import db from "./db/db";
import campaignService from "./services/campaign/fetch";
import CampaignFundService from "./services/campaign/fund-updater";
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

async function syncHistory() {
  const DB = await db.getInstance();
  await DB.connect();
  const config: SetupInterface = {
    _db: DB,
    rpc: process.env.RPC,
    devnet: process.env.NODE_ENV === 'production' ? false : true,
    heliusKey: process.env.HELIUS_KEY
  };
  await campaignService.getInstance().setup(config);
  await CampaignFundService.getInstance().setup(config);

  mainLoop();
  fundLoop();
}

(async () => {
  await syncHistory();
})();
