import DB from "../../db/db";
import {
  SetupInterface,
} from "../../interfaces";
import { Connection, PublicKey } from "@solana/web3.js";
import { Model, Connection as DbConnection, Types } from 'mongoose';

import CampaignSchema, { ICampaign } from "../../db/schema/campaign.schema";
import TransactionSchema, { ITransaction } from "../../db/schema/transaction.schema";
import { AnchorProvider, BorshCoder, Idl, Program, Wallet, EventParser, BN } from '@coral-xyz/anchor';
import IDL from '../idl/pre_pump.json';
import { PromisePool } from '@supercharge/promise-pool';
import { ethers } from 'ethers';
import { CampaignEvent } from "../../constant";
import { sleep } from "../../utils/sleep";
import { chunkArray } from "../../utils/math";

require("dotenv").config();
const { Keypair } = require('@solana/web3.js');

export default class CampaignService {
  private db: DB;
  private static instance: CampaignService;
  private isSyncing: boolean = false;
  private devnet = false;
  private rpc: string;
  private PROGRAM_ID: string = 'PREKP6cD7NZgWCfoSf3vqotpJfctuoeQV9j4cL81K15'

  private connection;
  private dbConnection: DbConnection;
  // list models
  private campaignModel: Model<ICampaign>;
  private transactionModel: Model<ITransaction>;

  public async setup(setup: SetupInterface) {
    this.db = setup._db;
    this.rpc = setup.rpc;
    this.devnet = setup.devnet;

    // Setup connection
    this.connection = new Connection(setup.rpc);
    // Setup db
    this.dbConnection = await this.db.getConnection();
    this.campaignModel = CampaignSchema.getModel();
    this.transactionModel = TransactionSchema.getModel();
  }


  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }

    return CampaignService.instance;
  }

  // Ensure that the cronjob is not running multiple times
  async fetch() {
    if (this.isSyncing) return;
    this.isSyncing = true;
  
    const MAX_RETRIES = 3;
    let retryCount = 0;
  
    while (retryCount < MAX_RETRIES) {
      try {
        console.log("Fetching campaign start");
        const session = await this.dbConnection.startSession();
  
        try {
          session.startTransaction();

          // // Update total funds
          // await this.updateAllCampaignFunds(session);
          
          // // Clean up zero fund campaigns
          // await this.cleanupZeroFundCampaigns(session);
          
          // Then sync new transactions
          await this.syncNewTransaction();
          
          await session.commitTransaction();
          this.isSyncing = false;
          return; // Success - exit the retry loop
          
        } catch (e) {
          await session.abortTransaction();
          throw e;
        } finally {
          await session.endSession();
        }
  
      } catch (e) {
        if (e.code === 112) { // WriteConflict error code
          retryCount++;
          console.log(`Retry attempt ${retryCount} due to write conflict`);
          // Add small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('CampaignService fetch error:', e);
          break; // Exit on non-WriteConflict errors
        }
      }
    }
  
    this.isSyncing = false;
    if (retryCount === MAX_RETRIES) {
      console.log('Max retries reached for handling write conflicts');
    }
  }

  async fetchNewTransFromHelius(address: string, after: string | null, before: string | null = null) {
    const trans = await this.connection.getSignaturesForAddress(
      new PublicKey(address),
      {
        limit: 1000,
        until: after,
        before,
      },
      'finalized',
    );
    console.log('CampaignService trans length:', trans.length);
    return trans;
  }

  async syncNewTransaction() {
    let isDone = false;
    while (!isDone) {
      const signatureNeedHandle = [];
      const newestTran = await this.transactionModel.findOne({}).sort({ block: -1 }).exec();
      console.log('CampaignService newestTran revenue', newestTran?.id);
      // Fetch until reach the newest transaction if exist
      let catchedLastestTrans = false;
      let lastestTransSignature = null;
      while (!catchedLastestTrans) {
        const transactions = await this.fetchNewTransFromHelius(
          this.PROGRAM_ID,
          newestTran ? newestTran.signature : null,
          lastestTransSignature,
        );
        const signatures = transactions.filter((tran) => tran.err == null).map((tran: any) => tran.signature);
        if (signatures.length === 0) {
          catchedLastestTrans = true;
          break;
        }
        signatureNeedHandle.push(...signatures);
        // Push until reach the lastest transaction if exist
        if (!newestTran || signatureNeedHandle.includes(newestTran.signature) || transactions.length < 999) {
          catchedLastestTrans = true;
        } else {
          console.log('CampaignService Not found lastest trans yet, continue fetch');
          lastestTransSignature = signatures[signatures.length - 1];
        }
      }

      if (signatureNeedHandle.length === 0) {
        console.log('CampaignService No new transaction');
        isDone = false;
        break;
      }
      const signatures = signatureNeedHandle.reverse();
      console.log('CampaignService signatures', signatures.length);
      await this.insertDataFromSignature(signatures);
    }
  }

  async insertDataFromSignature(signatures: string[]) {
    if (signatures.length === 0) {
      return;
    }
    const transNotInOrder = [];
    const splitedArr = await chunkArray(signatures, 20);
    const { results, errors } = await PromisePool.withConcurrency(1)
      .for(splitedArr)
      .process(async (arr) => {
        await sleep(1000);
        return await this.connection.getParsedTransactions(arr, {
          maxSupportedTransactionVersion: 0,
        });
      });

    if (errors.length > 0) {
      console.log("errors", errors);
      throw errors;
    }
    for (const result of results) {
      transNotInOrder.push(...result);
    }
    console.log('FINAL signature need handle: ', transNotInOrder.length);
    const trans = transNotInOrder;
    const programId = new PublicKey(this.PROGRAM_ID);
    const provider = new AnchorProvider(this.connection, new Wallet(Keypair.generate()), {});

    const program = new Program(IDL as Idl, provider);

    const eventParser = new EventParser(programId, new BorshCoder(program.idl));

    await PromisePool.withConcurrency(1)
      .for(trans)
      .process(async (tran) => {
        await this.handleTransaction(tran, eventParser);
      });
  }

  async handleTransaction(tran: any, eventParser: EventParser) {
    const transactionSession = await this.dbConnection.startSession();
    const events = eventParser.parseLogs(tran.meta.logMessages);
    transactionSession.startTransaction();
    const transaction = await this.transactionModel.findOne({ signature: tran.transaction.signatures[0] });
    if (transaction) {
      console.log('CampaignService transaction already exist', transaction.signature);
      return;
    }
    try {
      const newTransaction = new this.transactionModel();
      newTransaction.signature = tran.transaction.signatures[0];
      newTransaction.block = tran.slot;
      newTransaction.blockTime = tran.blockTime;
      for (const event of events) {
        if (event.name === CampaignEvent.createdCampaignEvent) {
          await this.handleCreatedCampaignEvent(event.data, transactionSession);
        }
        // if (event.name === CampaignEvent.createdAndBoughtTokenEvent) {
        //   await this.handleCreatedAndBoughtTokenEvent(event.data, transactionSession);
        // }
        // if (event.name === CampaignEvent.sellTokenEvent) {
        //   await this.handleSellTokenEvent(event.data, transactionSession);
        // }
      }
      await newTransaction.save({ session: transactionSession });
      await transactionSession.commitTransaction();

    } catch (e) {
      console.error('error handle transaction', e);
      await transactionSession.abortTransaction();
    } finally {
      await transactionSession.endSession();
    }
  }

  async handleCreatedCampaignEvent(data: any, session) {

    const campaign = new this.campaignModel();
    campaign.creator = data.creator.toString();
    campaign.campaignIndex = Number(data.campaignIndex.toString());
    campaign.name = data.name.toString();
    campaign.symbol = data.symbol.toString();
    campaign.uri = data.uri.toString();
    campaign.donationGoal = Number(ethers.utils.formatUnits(data.donationGoal.toString(), 9).toString());
    campaign.depositDeadline = data.depositDeadline.toString();
    campaign.tradeDeadline = data.tradeDeadline.toString();
    campaign.timestamp = data.timestamp.toString();
    campaign.mint = data.mint;
    /// Derive Campaign PDA
    const creatorAddress = new PublicKey(data.creator);

    const [campaignPDA, _] = PublicKey.findProgramAddressSync(
      [Buffer.from("campaign"), creatorAddress.toBuffer(), Buffer.from(data.campaignIndex.toArray("le", 8))],
      new PublicKey(this.PROGRAM_ID)
    );

    // Fetch Campaign Account Info
    const campaignInfo = await this.connection.getAccountInfo(campaignPDA);
    if (!campaignInfo) {
      throw new Error('Campaign account not found');
    }

    // Calculate Total Fund Raised
    const minimumRentExemption = await this.connection.getMinimumBalanceForRentExemption(campaignInfo.data.length);
    const totalFundRaised = campaignInfo.lamports - minimumRentExemption;

    campaign.totalFundRaised = totalFundRaised;

    await campaign.save({ session });
  }
}
