import DB from "../../db/db";
import {
  SetupInterface,
} from "../../interfaces";
import { Connection, PublicKey, SystemProgram, 
  SYSVAR_RENT_PUBKEY, 
  clusterApiUrl } from "@solana/web3.js";
import { Model, Connection as DbConnection, Types } from 'mongoose';

import CampaignSchema, { ICampaign } from "../../db/schema/campaign.schema";
import TransactionSchema, { ITransaction } from "../../db/schema/transaction.schema";
import AddTokenPumpProcessSchema, {AddTokenProcessStatus, IAddTokenPumpProcess} from "../../db/schema/token-process.schema";
import { AnchorProvider, BorshCoder, Idl, Program, Wallet, EventParser, BN } from '@coral-xyz/anchor';
import IDL from '../idl/pre_pump.json';
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

require("dotenv").config();
const { Keypair } = require('@solana/web3.js');

export default class CreateTokenService {
  private db: DB;
  private static instance: CreateTokenService;
  private isSyncing: boolean = false;
  private devnet = false;
  private heliusKey: string;
  private rpc: string;
  private PROGRAM_ID: string = 'PREKP6cD7NZgWCfoSf3vqotpJfctuoeQV9j4cL81K15'

  private connection;
  private dbConnection: DbConnection;
  // list models
  private campaignModel: Model<ICampaign>;
  private transactionModel: Model<ITransaction>;
  private addTokenPumpProcessModel: Model<IAddTokenPumpProcess>;

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
    this.addTokenPumpProcessModel = AddTokenPumpProcessSchema.getModel();
  }


  public static getInstance(): CreateTokenService {
    if (!CreateTokenService.instance) {
      CreateTokenService.instance = new CreateTokenService();
    }

    return CreateTokenService.instance;
  }

  // Ensure that the cronjob is not running multiple times
  async fetch() {
    if (this.isSyncing) return;
    this.isSyncing = true;
  
    const MAX_RETRIES = 3;
    let retryCount = 0;
  
    while (retryCount < MAX_RETRIES) {
      try {
        console.log("Create Token check start");
        const session = await this.dbConnection.startSession();
  
        try {
          session.startTransaction();

          await this.syncAllCampaignStatuses(session);

          const pendingCampaigns = await this.addTokenPumpProcessModel.find({
            status: AddTokenProcessStatus.PENDING
          });

          for (const campaign of pendingCampaigns) {
            await this.createTokenForCampaign(campaign, session);
          }
          
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
    // const splitedArr = this.chunkArray(signatures, 600);
    // console.log("splitedArr", splitedArr);
    const transNotInOrder = [];
    const chunkSize = 20;
    // Process signatures in chunks of 10
    for (let i = 0; i < signatures.length; i += chunkSize) {
      if (i > 0) {
        await sleep(10000)
      }
      const chunk = signatures.slice(i, i + chunkSize);
      const { results, errors } = await PromisePool.withConcurrency(1)
        .for(chunk)
        .process(async (arr) => {
          return await this.connection.getParsedTransaction(arr, {
            maxSupportedTransactionVersion: 0,
          });
        });

      if (errors.length > 0) {
        console.log("errors", errors);
        throw errors;
      }
      transNotInOrder.push(...results);
      console.log(`Processed signatures ${i + 1} to ${Math.min(i + chunkSize, signatures.length)}`);
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
        if (event.name === CampaignEvent.createdCampaignEvent) {
          await this.handleCreatedCampaignEvent(event.data, transactionSession);
        }
        if (event.name === CampaignEvent.createdAndBoughtTokenEvent) {
          await this.handleCreatedAndBoughtTokenEvent(event.data, transactionSession);
        }
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

  async checkAndUpdateCampaignStatus(campaign: any, session) {
    try {
      // First check if campaign is already COMPLETED
      const existingProcess = await this.addTokenPumpProcessModel.findOne({
        creator: campaign.creator,
        campaignIndex: campaign.campaignIndex
      });

      // Get all campaigns from addTokenPumpProcessModel for logging
      const allProcesses = await this.addTokenPumpProcessModel.find();
      
      // Log details for all processes
      for (const process of allProcesses) {
        const campaignDetails = await this.campaignModel.findOne({
          creator: process.creator,
          campaignIndex: process.campaignIndex
        });
      }

      if (existingProcess?.status === AddTokenProcessStatus.COMPLETED) {
        console.log(`Campaign ${campaign.campaignIndex} is already COMPLETED - skipping status update`);
        return existingProcess;
      }
  
      const now = Math.floor(Date.now() / 1000);
  
      // Status checks with logging
      const isPending = (
        (campaign.totalFundRaised / 1e9).toFixed(2) >= campaign.donationGoal &&
        campaign.depositDeadline >= now
      ) && !campaign.mint;

      const isCompleted = campaign.mint && 
      campaign.mint !== "11111111111111111111111111111111";
  
      const isFailed = (
        (campaign.totalFundRaised / 1e9).toFixed(2) < campaign.donationGoal &&
        campaign.depositDeadline <= now
      );
  
      const isRaising = (
        (campaign.totalFundRaised / 1e9).toFixed(2) < campaign.donationGoal &&
        campaign.depositDeadline > now
      );
  
      let status = AddTokenProcessStatus.RAISING;
      if (isPending) status = AddTokenProcessStatus.PENDING;
      if (isFailed) status = AddTokenProcessStatus.FAILED;
      if (isCompleted) status = AddTokenProcessStatus.COMPLETED;
  
      const result = await this.addTokenPumpProcessModel.findOneAndUpdate(
        {
          creator: campaign.creator,
          campaignIndex: campaign.campaignIndex,
        },
        { 
          status,
          updatedAt: Date.now() 
        },
        { 
          upsert: true, 
          session, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
  
      console.log(`Updated campaign ${campaign.campaignIndex} to status: ${status}`);
      return result;
  
    } catch (err) {
      console.error(`Error updating campaign ${campaign.campaignIndex}:`, err);
      throw err;
    }
  }

  // TypeScript
  async syncAllCampaignStatuses(session) {
    const campaigns = await this.campaignModel.find();
    for (const campaign of campaigns) {
      await this.checkAndUpdateCampaignStatus(campaign, session);
    }
  }

  async createTokenForCampaign(processRecord: IAddTokenPumpProcess, session) {
    const campaign = await this.campaignModel.findOne({
      creator: processRecord.creator,
      campaignIndex: processRecord.campaignIndex
    });

    if (!campaign) {
      console.log('Campaign not found');
      return;
    }

    try {
      // Setup provider with operator keypair 
      const provider = new AnchorProvider(
        this.connection,
        new Wallet(this.operatorKeyPair),
        {}
      );
      const program = new Program(IDL as Idl, provider);

      // Get necessary PDAs and accounts
      const creatorAddress = new PublicKey(campaign.creator);
      const campaignIndex = new BN(campaign.campaignIndex);
      const slippage = 200;

      const [config] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );

      const [campaignPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creatorAddress.toBuffer(),
          Buffer.from(campaignIndex.toArray("le", 8))
        ],
        program.programId
      );

      const mintKeypair = Keypair.generate();

      // Setup PumpFun accounts
      const pumpFunMintAuthority = new PublicKey("TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM");
      
      const [bondingCurve] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bonding-curve"),
          mintKeypair.publicKey.toBuffer()
        ],
        new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
      );

      const associatedBondingCurve = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        bondingCurve,
        true
      );

      const pumpFunGlobal = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
      const pumpFunEventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");

      // Get metadata PDA
      const umi = createUmi(this.devnet ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta"));
      const [metadataAddress] = findMetadataPda(umi, {
        mint: publicKey(mintKeypair.publicKey.toBase58())
      });
      const metadata = new PublicKey(metadataAddress);

      // Call create token instruction
      await program.methods.createToken(slippage)
        .accounts({
          operator: this.operatorKeyPair.publicKey,
          config,
          treasury,
          creator: creatorAddress, 
          campaignAccount: campaignPDA,
          mint: mintKeypair.publicKey,
          pumpFunMintAuthority,
          pumpFunBondingCurve: bondingCurve,
          pumpFunAssociatedBondingCurve: associatedBondingCurve, 
          pumpFunGlobal,
          pumpFunEventAuthority,
          pumpFunProgram: new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
          metadata,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          mplTokenMetadata: MPL_TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY
        })
        .signers([this.operatorKeyPair, mintKeypair])
        .rpc();

      // Update status to COMPLETED
      await this.addTokenPumpProcessModel.findOneAndUpdate(
        {
          creator: processRecord.creator,
          campaignIndex: processRecord.campaignIndex
        },
        {
          status: AddTokenProcessStatus.COMPLETED,
          updatedAt: Date.now()
        },
        { session }
      );

      // Update campaign with mint
      campaign.mint = mintKeypair.publicKey.toString();
      await campaign.save({ session });

    } catch (error) {
      console.error('Error creating token:', error);
      
      // Update status to FAILED on error
      await this.addTokenPumpProcessModel.findOneAndUpdate(
        {
          creator: processRecord.creator,
          campaignIndex: processRecord.campaignIndex
        },
        {
          status: AddTokenProcessStatus.FAILED,
          updatedAt: Date.now()
        },
        { session }
      );
    }
  }
  
  async handleCreatedAndBoughtTokenEvent(data: any, session) {
    const campaign = await this.campaignModel.findOne({
      creator: data.creator.toString(),
      campaignIndex: Number(data.campaignIndex.toString()),
    });
  
    if (!campaign) {
      console.log('Campaign not found');
      return;
    }
  
    // Update campaign with token info from event
    campaign.totalTokenBought = Number(ethers.utils.formatUnits(data.boughtAmount.toString(), 9).toString());
    campaign.mint = data.mint.toString();
  
    // Update process status
    await this.addTokenPumpProcessModel.findOneAndUpdate(
      {
        creator: campaign.creator,
        campaignIndex: campaign.campaignIndex
      },
      {
        status: AddTokenProcessStatus.COMPLETED,
        updatedAt: Date.now()
      },
      { session }
    );
  
    await campaign.save({ session });
  }
}
