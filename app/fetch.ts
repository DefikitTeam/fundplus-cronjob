import db from "./db/db";
import campaignService from "./services/campaign/fetch";
import { SetupInterface } from "./interfaces/setup.interface";
require("dotenv").config();
import { start } from './server/server'

async function runJob() {
  try {
    await campaignService.getInstance().fetch();
  } catch (e) {
    console.log(`CAMPAIGN error`, e);
  }
} 

const mainLoop = async function () {
  await runJob();
  setTimeout(mainLoop, 30000);
};

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
  mainLoop();
}

(async () => {
  await syncHistory();
  await start();
})();
