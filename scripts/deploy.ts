import { ethers, upgrades, baseURI } from "hardhat";
import type { TablelandTables } from "../typechain-types";
import assert from "assert";

async function main() {
  // Get proxy owner account
  const [account] = await ethers.getSigners();
  if (account.provider === undefined) {
    throw Error("missing provider");
  }
  const { chainId } = await account.provider.getNetwork();

  // Get base URI
  if (baseURI === undefined) {
    throw Error("missing base URI");
  }
  console.log("Using baseURI:", baseURI);

  // Deploy proxy
  const Factory = await ethers.getContractFactory("TablelandTables");
  const tables = (await upgrades.deployProxy(Factory, [baseURI], {
    kind: "uups",
  })) as TablelandTables;
  const registry = await tables.deployed();
  console.log(`Proxy for chain ${chainId} deployed to:`, registry.address);

  // Create health bot table
  const createStatement = `create table healthbot_${chainId} (counter bigint);`;
  let tx = await registry.createTable(account.address, createStatement);
  let receipt = await tx.wait();
  const [, createEvent] = receipt.events ?? [];
  const tableId = createEvent.args!.tableId;
  console.log("Healthot table created as:", `healthbot_${chainId}_${tableId}`);

  // Insert first row into health bot table
  const runStatement = `insert into healthbot_${chainId}_${tableId} values (1);`;
  tx = await registry.runSQL(account.address, tableId, runStatement);
  receipt = await tx.wait();
  const [runEvent] = receipt.events ?? [];
  assert(
    runEvent.args!.statement === runStatement,
    "insert statement mismatch"
  );

  console.log("Healthbot table updated with:", runEvent.args?.statement);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
