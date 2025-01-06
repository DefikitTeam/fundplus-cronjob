import DB from "../../db/db";
import {
  SetupInterface,
} from "../../interfaces";
import { Connection, PublicKey } from "@solana/web3.js";
import { Model, Connection as DbConnection, Types } from 'mongoose';

import CampaignSchema, { ICampaign } from "../../db/schema/campaign.schema";
import TransactionSchema, { ITransaction } from "../../db/schema/transaction.schema";
import { BN } from '@coral-xyz/anchor';

require("dotenv").config();
const { Keypair } = require('@solana/web3.js');

export default class CampaignFundService {
  private db: DB;
  private static instance: CampaignFundService;
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

  public async setup(setup: SetupInterface) {
    this.db = setup._db;
    this.rpc = setup.rpc;
    this.devnet = setup.devnet;
    this.heliusKey = setup.heliusKey;

    // Setup connection
    this.connection = new Connection(setup.rpc);
    // Setup db
    this.dbConnection = await this.db.getConnection();
    this.campaignModel = CampaignSchema.getModel();
    this.transactionModel = TransactionSchema.getModel();
  }


  public static getInstance(): CampaignFundService {
    if (!CampaignFundService.instance) {
      CampaignFundService.instance = new CampaignFundService();
    }

    return CampaignFundService.instance;
  }

  // Ensure that the cronjob is not running multiple times
  async fetch() {
    if (this.isSyncing) return;
    this.isSyncing = true;
  
    const MAX_RETRIES = 3;
    let retryCount = 0;
  
    while (retryCount < MAX_RETRIES) {
      try {
        console.log("Updating campaign funds");
        const session = await this.dbConnection.startSession();
  
        try {
          // Add transaction options with writeConcern
          session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' }
          });

          // Update total funds
          await this.updateAllCampaignFunds(session);
          
          // Clean up zero fund campaigns 
          await this.cleanupZeroFundCampaigns(session);
          
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
          // Add exponential backoff
          const backoffMs = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          console.log('CampaignFundService fetch error:', e);
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

  async cleanupZeroFundCampaigns(session) {
    const campaigns = await this.campaignModel.find();
    
    for (const campaign of campaigns) {
      // Get current on-chain state
      const [campaignPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), 
         new PublicKey(campaign.creator).toBuffer(), 
         Buffer.from(new BN(campaign.campaignIndex).toArray("le", 8))],
        new PublicKey(this.PROGRAM_ID)
      );
  
      const campaignInfo = await this.connection.getAccountInfo(campaignPDA);
      if (!campaignInfo) continue;
  
      const minimumRentExemption = await this.connection.getMinimumBalanceForRentExemption(campaignInfo.data.length);
      const currentFunds = campaignInfo.lamports - minimumRentExemption;
  
      // Delete if funds are now 0
      if (currentFunds === 0) {
        await this.campaignModel.deleteOne({ 
          _id: campaign._id 
        }, { session });
      }
    }
  }

  async updateCampaignFunds(campaign: ICampaign, session) {
    const [campaignPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        new PublicKey(campaign.creator).toBuffer(),
        Buffer.from(new BN(campaign.campaignIndex).toArray("le", 8))
      ],
      new PublicKey(this.PROGRAM_ID)
    );
  
    const campaignInfo = await this.connection.getAccountInfo(campaignPDA);
    if (!campaignInfo) return;
  
    const minimumRentExemption = await this.connection.getMinimumBalanceForRentExemption(campaignInfo.data.length);
    const currentFunds = campaignInfo.lamports - minimumRentExemption;
  
    // Use compound key instead of _id
    await this.campaignModel.findOneAndUpdate(
      { 
        creator: campaign.creator,
        campaignIndex: campaign.campaignIndex 
      },
      { totalFundRaised: currentFunds },
      { session }
    );
  }
  
  // Function to update all campaign funds
  async updateAllCampaignFunds(session) {
    try {
      const campaigns = await this.campaignModel.find();
      
      for (const campaign of campaigns) {
        const [campaignPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("campaign"), 
            new PublicKey(campaign.creator).toBuffer(), 
            Buffer.from(new BN(campaign.campaignIndex).toArray("le", 8))
          ],
          new PublicKey(this.PROGRAM_ID)
        );
      
        const campaignInfo = await this.connection.getAccountInfo(campaignPDA);
        if (!campaignInfo) continue;
      
        const minimumRentExemption = await this.connection.getMinimumBalanceForRentExemption(campaignInfo.data.length);
        const currentFunds = campaignInfo.lamports - minimumRentExemption;
  
        // Delete if zero funds, otherwise update
        if (currentFunds === 0) {
          await this.campaignModel.deleteOne({ _id: campaign._id }, { session });
        } else {
          await this.campaignModel.findOneAndUpdate(
            { _id: campaign._id },
            { totalFundRaised: currentFunds },
            { session }
          );
        }
      }
    } catch (error) {
      console.error('Error updating campaign funds:', error);
      throw error;
    }
  }
}