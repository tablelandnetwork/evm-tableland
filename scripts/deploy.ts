import { promisify } from "util";
import { ethers, upgrades, network, baseURI, proxy } from "hardhat";
import { getFeeData, isEventLog } from "./utils";
import type { TablelandTables } from "../typechain-types";
import assert from "assert";

const sleep = promisify(setTimeout);
const pollTimeout = 60 * 10 * 1000; // 10 min timeout (required for Filecoin)
const pollInterval = 5000;

async function main() {
  console.log(`\nDeploying new proxy to '${network.name}'...`);

  // Get proxy owner account
  const [account] = await ethers.getSigners();
  if (account.provider === undefined) {
    throw Error("missing provider");
  }

  // Get base URI
  if (baseURI === undefined || baseURI === "") {
    throw Error(`missing baseURIs entry for '${network.name}'`);
  }
  console.log(`Using base URI '${baseURI}'`);

  // Don't allow multiple proxies per network
  if (proxy !== undefined && proxy !== "") {
    throw Error(`proxy already deployed to '${network.name}'`);
  }

  // Deploy proxy
  const Factory = await ethers.getContractFactory("TablelandTables");
  // Needed for Polygon Amoy; can use to get prices for other networks, too
  const chainName = network.name;
  const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeData(chainName);

  // @ts-expect-error ignore `Conversion of type 'Contract'` error since
  // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
  const proxyDeploy = (await upgrades.deployProxy(Factory, [baseURI], {
    kind: "uups",
    timeout: pollTimeout,
    pollingInterval: pollInterval,
    txOverrides: { maxFeePerGas, maxPriorityFeePerGas },
  })) as TablelandTables;
  const tables = await proxyDeploy.waitForDeployment();

  console.log("New proxy address:", await tables.getAddress());

  // Check implementation
  // Note: We poll here because the impl won't be visible from the proxy until the next tipset on Filecoin.
  // Note: See https://docs.filecoin.io/smart-contracts/developing-contracts/best-practices/#consistently-generating-transaction-receipts.
  const startTime = Date.now();
  while (!(await checkImpl(await tables.getAddress()))) {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= pollTimeout) {
      throw Error("impl did not become visible from proxy");
    }
    console.log("Waiting for implementation to be visible from proxy...");
    await sleep(pollInterval);
  }

  // Create health bot table
  const { chainId } = await account.provider.getNetwork();
  const createStatement = `create table healthbot_${chainId} (counter integer);`;
  let tx = await tables["create(address,string)"](
    account.address,
    createStatement
  );
  let receipt = await tx.wait();
  const [, createEvent] = receipt?.logs.filter(isEventLog) ?? [];
  const tableId = createEvent.args!.tableId;
  console.log("Healthbot table created as:", `healthbot_${chainId}_${tableId}`);

  // Insert first row into health bot table
  const runStatement = `insert into healthbot_${chainId}_${tableId} values (1);`;
  // Add 20% buffer to gas limit to avoid out-of-gas errors
  const estimatedGasLimit = await tables[
    "mutate(address,uint256,string)"
  ].estimateGas(account.address, tableId, runStatement);
  const gasLimit =
    estimatedGasLimit + (estimatedGasLimit * BigInt(20)) / BigInt(100);
  tx = await tables["mutate(address,uint256,string)"](
    account.address,
    tableId,
    runStatement,
    {
      gasLimit,
    }
  );
  receipt = await tx.wait();
  const [runEvent] = receipt?.logs.filter(isEventLog) ?? [];
  assert(
    runEvent.args!.statement === runStatement,
    "insert statement mismatch"
  );
  console.log("Healthbot table updated with:", runEvent.args?.statement);

  // Warn that proxy address needs to be saved in config
  console.log(
    `\nSave 'proxies.${
      network.name
    }: "${await tables.getAddress()}"' in 'network.ts'!`
  );
}

async function checkImpl(proxy: string): Promise<boolean> {
  try {
    const impl = await upgrades.erc1967.getImplementationAddress(proxy);
    console.log("New implementation address:", impl);
    return true;
  } catch (error) {
    return false;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
