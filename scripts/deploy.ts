import { ethers, upgrades } from "hardhat";
import type { TablelandTables } from "../typechain-types/index";
import assert from "assert";

async function main() {
  const [account] = await ethers.getSigners();

  if (account.provider === undefined) {
    throw Error("missing provider");
  }

  const TT = await ethers.getContractFactory("TablelandTables");

  const contract = (await upgrades.deployProxy(
    TT,
    ["https://testnet.tableland.network/tables/"],
    {
      kind: "uups",
    }
  )) as TablelandTables;
  const registry = await contract.deployed();
  console.log("Proxy deployed to:", registry.address);

  const { chainId } = await account.provider.getNetwork();

  const createStatement = `create table healthbot_${chainId} (counter bigint);`;
  const tx = await registry.createTable(account.address, createStatement);
  const receipt = await tx.wait();

  const [, createEvent] = receipt.events ?? [];
  const tableId = createEvent.args!.tableId;

  console.log("Healthot table created as:", `healthbot_${chainId}_${tableId}`);

  const insertStatement = `insert into healthbot_${chainId}_${tableId} values (1);`;

  const updateTx = await registry.runSQL(
    account.address,
    tableId,
    insertStatement
  );

  const update = await updateTx.wait();

  const [insertEvent] = update.events ?? [];

  assert(
    insertEvent.args!.statement === insertStatement,
    "insert statement mismatch"
  );

  console.log("Healthbot table updated with:", insertEvent.args?.statement);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
