import { promisify } from "util";
import { ethers, upgrades, network, proxy } from "hardhat";
import type { TablelandTables } from "../typechain-types";
import assert from "assert";

const sleep = promisify(setTimeout);
const pollTimeout = 60 * 10 * 1000; // 10 min timeout (required for Filecoin)
const pollInterval = 5000;

async function main() {
  console.log(`\nUpgrading '${network.name}' proxy...`);

  // Get proxy owner account
  const [account] = await ethers.getSigners();
  if (account.provider === undefined) {
    throw Error("missing provider");
  }

  // Get proxy address
  if (proxy === undefined || proxy === "") {
    throw Error(`missing proxies entry for '${network.name}'`);
  }
  console.log(`Using proxy address '${proxy}'`);

  // Check current implementation
  const impl = await upgrades.erc1967.getImplementationAddress(proxy);
  console.log("Current implementation address:", impl);

  // Upgrade proxy
  const Factory = await ethers.getContractFactory("TablelandTables");
  const tables = await (
    (await upgrades.upgradeProxy(proxy, Factory, {
      kind: "uups",
      timeout: pollTimeout,
      pollingInterval: pollInterval,
    })) as TablelandTables
  ).deployed();
  assert(tables.address === proxy, "proxy address changed");

  // Check new implementation
  // Note: We poll here because the new impl won't be visible from the proxy until the next tipset on Filecoin.
  // Note: See https://docs.filecoin.io/smart-contracts/developing-contracts/best-practices/#consistently-generating-transaction-receipts.
  const startTime = Date.now();
  while (!(await checkNewImpl(tables.address, impl))) {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= pollTimeout) {
      console.warn("\nProxy implementation did not change. Is this expected?");
      return;
    }
    console.log("Waiting for new implementation to be visible from proxy...");
    await sleep(pollInterval);
  }
}

async function checkNewImpl(proxy: string, oldImpl: string): Promise<boolean> {
  try {
    const impl = await upgrades.erc1967.getImplementationAddress(proxy);
    if (impl !== oldImpl) {
      console.log("New implementation address:", impl);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Current implementation is not visible from proxy.");
    return false;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
