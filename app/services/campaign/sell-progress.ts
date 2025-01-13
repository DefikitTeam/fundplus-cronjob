import DB from "../../db/db";
import {
  SetupInterface,
} from "../../interfaces";
import { Connection, PublicKey, SystemProgram, 
  SYSVAR_RENT_PUBKEY, 
  clusterApiUrl } from "@solana/web3.js";
import { Model, Connection as DbConnection, Types } from 'mongoose';

import CampaignSchema, { ICampaign } from "../../db/schema/campaign.schema";
import AddTokenPumpProcessSchema, { AddTokenProcessStatus, IAddTokenPumpProcess } from "../../db/schema/token-process.schema";
import TransactionSchema, { ITransaction } from "../../db/schema/transaction.schema";
import SellProgressSchema, { ISellProgress } from "../../db/schema/sold-out-campaigns.schema";
import { AnchorProvider, BorshCoder, Idl, Program, Wallet, EventParser, BN } from '@coral-xyz/anchor';
import IDL from '../idl/pre_pump.json';
import PUMP_IDL from '../idl/pump.json';
import { PromisePool } from '@supercharge/promise-pool';
import { ethers } from 'ethers';
import { CampaignEvent } from "../../constant";
import { sleep } from "../../utils/sleep";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { 
  createUmi 
} from '@metaplex-foundation/umi-bundle-defaults';
import { 
  publicKey 
} from "@metaplex-foundation/umi";
import { chunkArray } from "../../utils/math";

require("dotenv").config();
const { Keypair } = require('@solana/web3.js');

export default class SellProgressService {
  private db: DB;
  private static instance: SellProgressService;
  private isSyncing: boolean = false;
  private devnet = false;
  private heliusKey: string;
  private rpc: string;
  private PROGRAM_ID: string = 'PREKP6cD7NZgWCfoSf3vqotpJfctuoeQV9j4cL81K15'
  private PUMP_ID: string = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'

  private connection;
  private dbConnection: DbConnection;
  // list models
  private campaignModel: Model<ICampaign>;
  private transactionModel: Model<ITransaction>;
  private addTokenPumpProcessModel: Model<IAddTokenPumpProcess>;
  private sellProgressModel: Model<ISellProgress>;

  private operatorKeyPair = Keypair.fromSecretKey(bs58.decode(process.env.OPERATOR_PRIV_KEY || ""));

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
    this.sellProgressModel = SellProgressSchema.getModel();
    this.addTokenPumpProcessModel = AddTokenPumpProcessSchema.getModel();
  }


  public static getInstance(): SellProgressService {
    if (!SellProgressService.instance) {
      SellProgressService.instance = new SellProgressService();
    }

    return SellProgressService.instance;
  }

  // Ensure that the cronjob is not running multiple times
  async fetch() {
    if (this.isSyncing) return;
    this.isSyncing = true;
  
    const MAX_RETRIES = 3;
    let retryCount = 0;
  
    while (retryCount < MAX_RETRIES) {
      try {
        console.log("Sell Prpgress Update start");
        const session = await this.dbConnection.startSession();
  
        try {
          session.startTransaction();
          
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
        if (e.code === 112) {// WriteConflict error code
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
        await sleep(5000);
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
      console.log('Received events:', events);
      for (const event of events) {
        if (event.name === CampaignEvent.sellTokenEvent) {
          await this.handleSellTokenEvent(event.data, transactionSession);
        }
        if (event.name === CampaignEvent.claimedTokenEvent) {
          await this.handleClaimedTokenEvent(event.data, transactionSession);
        }
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


  async handleSellTokenEvent(data: any, transactionSession: any) {
    // const campaigns = await this.campaignModel.find();

    // for (const campaign of campaigns) {
    //   const creatorAddress = new PublicKey(campaign.creator);

    //   const [campaignPDA, _] = PublicKey.findProgramAddressSync(
    //     [Buffer.from("campaign"), creatorAddress.toBuffer(), Buffer.from(campaign.campaignIndex.toArray("le", 8))],
    //     new PublicKey(this.PROGRAM_ID)
    //   )

    //   const campaignInfo = await this.connection.getAccountInfo(campaignPDA);
    //   if (!campaignInfo) {
    //     throw new Error('Campaign account not found');
    //   };

    //   if (!campaign.mint) {
    //     continue;
    //   }
  
    //   const now = Math.floor(Date.now() / 1000);

    //   const isTradingPassed = campaign.TradeDeadline < now;

    //   const associatedCampaign = getAssociatedTokenAddressSync(new PublicKey(campaign.mint), campaignPDA, true);
    //   const tokenAccountBalance = await this.connection.getTokenAccountBalance(associatedCampaign);
    //   const soldAmount = campaign.totalTokenBought - tokenAccountBalance.value.uiAmount;

    //   const isSoldOut = soldAmount >= campaign.totalTokenBought;

    //   if (isSoldOut && !isTradingPassed) {
    //     const sellProgress = new this.sellProgressModel({
    //       creator: campaign.creator,
    //       campaignIndex: campaign.campaignIndex,
    //       is_sell_all: true,
    //       claimable_amount: 0,
    //     });
    //     await sellProgress.save({ session: transactionSession });
    //   } else {
    //     const sellProgress = new this.sellProgressModel({
    //       creator: campaign.creator,
    //       campaignIndex: campaign.campaignIndex,
    //       is_sell_all: false,
    //       claimable_amount: 0,
    //     });
    //     await sellProgress.save({ session: transactionSession });
    //   }

    // }

    try {
      const campaign = await this.campaignModel.findOne({
        creator: data.creator.toString(),
        campaignIndex: Number(data.campaignIndex.toString())
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const sellProgress = new this.sellProgressModel({
        creator: data.creator.toString(),
        campaignIndex: Number(data.campaignIndex.toString()),
        is_sell_all: true,
        mint: data.mint.toString(),
        claimale_amount: 0,
      })

      await sellProgress.save({ session: transactionSession });
    } catch (error) {
      console.error('Error handling sell token event:', error);
      throw error;
    }
  }

  async handleClaimedTokenEvent(data: any, transactionSession: any) {
    try {
      const sellProgress = await this.sellProgressModel.findOne({
        creator: data.creator.toString(),
        campaignIndex: Number(data.campaignIndex.toString())
      });

      if (!sellProgress) {
        throw new Error('No sold out campaign found');
      }

      await this.sellProgressModel.findOneAndUpdate(
        {creator: data.creator.toString(), campaignIndex: Number(data.campaignIndex.toString())},
        {
          claimable_amount: Number(data.amount.toString())
        },
        { session: transactionSession }
      );
    } catch (error) {
      console.error('Error handling claimed token event:', error);
      throw error;
    }
  }
}
