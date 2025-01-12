import db from "./db/db";
import campaignService from "./services/campaign/fetch";
import CampaignFundService from "./services/campaign/fund-updater";
import CreateTokenService from "./services/campaign/create-token";
import SellProgressService from "./services/campaign/sell-progress";
import ClaimMonitorService from "./services/campaign/claim-monitor";
import { SetupInterface } from "./interfaces/setup.interface";
require("dotenv").config();

async function runJob() {
  try {
    await campaignService.getInstance().fetch();
  } catch (e) {
    console.log(`CAMPAIGN error`, e);
  }
}

async function runFundUpdateJob() {
  try {
    await CampaignFundService.getInstance().fetch();
  } catch (e) {
    console.log(`UPDATE FUND error`, e);
  }
}

async function runCreateTokenJob() {
  try {
    await CreateTokenService.getInstance().fetch();
  } catch (e) {
    console.log(`CREATE TOKEN error`, e);
  }
}

async function runSellProgressJob() {
  try {
    await SellProgressService.getInstance().fetch();
  } catch (e) {
    console.log(`SELL PROGRESS UPDATE error`, e);
  }
}

async function runClaimMonitorJob() {
  try {
    await ClaimMonitorService.getInstance().fetch();
  } catch (e) {
    console.log(`CLAIM MONITOR error`, e);
  }
}

// cronjob for campaign list
const mainLoop = async function () {
  await runJob();
  setTimeout(mainLoop, 15000);
};

// cronjob for fund update
const fundLoop = async function () {
  await runFundUpdateJob();
  setTimeout(fundLoop, 15000);
}

// cronjob for create token
const tokenLoop = async function () {
  await runCreateTokenJob();
  setTimeout(tokenLoop, 15000);
}

// cronjob for sell progress
const sellLoop = async function () {
  await runSellProgressJob();
  setTimeout(sellLoop, 15000);
}

// cronjob for claim monitor
const claimLoop = async function () {
  await runClaimMonitorJob();
  setTimeout(claimLoop, 15000);
}

async function syncHistory() {
  const DB = await db.getInstance();
  await DB.connect();
  const config: SetupInterface = {
    _db: DB,
    rpc: process.env.RPC,
    devnet: process.env.NODE_ENV === 'production' ? false : true
  };
  await campaignService.getInstance().setup(config);
  await CreateTokenService.getInstance().setup(config);
  await CampaignFundService.getInstance().setup(config);
  await SellProgressService.getInstance().setup(config);
  await ClaimMonitorService.getInstance().setup(config);

  // Start token creation first to handle PENDING campaigns
  tokenLoop();
  mainLoop();
  fundLoop();
  sellLoop();
  claimLoop();
}

(async () => {
  await syncHistory();
})();
