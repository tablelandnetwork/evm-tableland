import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import {
  TestTablelandDeployments,
  TablelandTables,
} from "../../../typechain-types";
import { ITablelandTables__factory as TablelandTablesFactory } from "@tableland/evm";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TablelandDeployments", function () {
  let accounts: SignerWithAddress[];
  let lib: TestTablelandDeployments;
  let tables: TablelandTables;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TablelandTables");
    tables = await (
      (await upgrades.deployProxy(Factory, ["https://foo.xyz/"], {
        kind: "uups",
      })) as TablelandTables
    ).deployed();
    await tables.deployed();

    const Lib = await ethers.getContractFactory("TestTablelandDeployments");
    lib = (await Lib.deploy()) as TestTablelandDeployments;
    await lib.deployed();
  });

  it("Should get base URI", async function () {
    const res = await lib.getBaseURI();
    expect(res).to.equal("http://localhost:8080/api/v1/");
  });

  it("Should get deployment and create table", async function () {
    const createStatement =
      "CREATE TABLE test_31337(id integer primary key,val text)";
    const tx = await lib.create(createStatement);
    const rec = await tx.wait();
    // Parse events from the registry
    const { abi } = TablelandTablesFactory;
    const iface = new ethers.utils.Interface(abi);
    let registryLog;
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("CreateTable"))) {
        registryLog = log;
      }
    }
    // Get the create table owner, table ID, and statement emitted from the event
    const logParsed = iface.parseLog(registryLog!);
    const { owner, tableId: tableIdFromLog, statement } = logParsed.args;
    const tableId = await lib.getTableId();
    expect(owner).to.equal(lib.address);
    expect(tableIdFromLog).to.equal(tableId);
    expect(statement).to.equal(createStatement);
  });

  it("Should get deployment and mutate table", async function () {
    const createStatement =
      "CREATE TABLE test_31337(id integer primary key,val text)";
    let tx = await lib.create(createStatement);
    let rec = await tx.wait();
    // Parse events from the registry
    const { abi } = TablelandTablesFactory;
    const iface = new ethers.utils.Interface(abi);
    let registryLog;
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("CreateTable"))) {
        registryLog = log;
      }
    }
    // Get the create table owner, table ID, and statement emitted from the event
    let logParsed = iface.parseLog(registryLog!);
    let { owner, tableId: tableIdFromLog, statement } = logParsed.args;
    const tableId = await lib.getTableId();
    expect(owner).to.equal(lib.address);
    expect(tableIdFromLog).to.equal(tableId);
    expect(statement).to.equal(createStatement);

    // Mutate the table
    const tableName = await lib.getTableName();
    const mutateStatement = `INSERT INTO ${tableName} VALUES(1,'foo')`;
    tx = await lib.mutate(tableId, mutateStatement);
    rec = await tx.wait();
    // Parse events from the registry
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("RunSQL"))) {
        registryLog = log;
      }
    }
    // Get the mutation caller, table ID, and statement emitted from the event
    logParsed = iface.parseLog(registryLog!);
    const { caller } = logParsed.args;
    ({ tableId: tableIdFromLog, statement } = logParsed.args);
    expect(caller).to.equal(lib.address);
    expect(tableIdFromLog).to.equal(tableId);
    expect(statement).to.equal(mutateStatement);
  });

  it("Should get deployment and transfer table", async function () {
    const receiver = accounts[4];
    const createStatement =
      "CREATE TABLE test_31337(id integer primary key,val text)";
    let tx = await lib.create(createStatement);
    let rec = await tx.wait();
    // Parse events from the registry
    const { abi } = TablelandTablesFactory;
    const iface = new ethers.utils.Interface(abi);
    let registryLog;
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("CreateTable"))) {
        registryLog = log;
      }
    }
    // Get the create table owner, table ID, and statement emitted from the event
    let logParsed = iface.parseLog(registryLog!);
    const { owner, tableId: tableIdFromLog, statement } = logParsed.args;
    const tableId = await lib.getTableId();
    expect(owner).to.equal(lib.address);
    expect(tableIdFromLog).to.equal(tableId);
    expect(statement).to.equal(createStatement);

    // Transfer table and parse events from the registry
    tx = await lib.safeTransferFrom(receiver.address, tableId);
    rec = await tx.wait();
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("TransferTable"))) {
        registryLog = log;
      }
    }
    // Get the table's original owner, new owner, and token ID emitted from the event
    logParsed = iface.parseLog(registryLog!);
    const { from, to, tableId: transferTableId } = logParsed.args;
    expect(from).to.equal(lib.address);
    expect(to).to.equal(receiver.address);
    expect(transferTableId).to.equal(tableId);
  });

  it("Should get deployment and set controller for table", async function () {
    const receiver = accounts[4];
    const createStatement =
      "CREATE TABLE test_31337(id integer primary key,val text)";
    let tx = await lib.create(createStatement);
    let rec = await tx.wait();
    // Parse events from the registry
    const { abi } = TablelandTablesFactory;
    const iface = new ethers.utils.Interface(abi);
    let registryLog;
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("CreateTable"))) {
        registryLog = log;
      }
    }
    // Get the create table owner, table ID, and statement emitted from the event
    let logParsed = iface.parseLog(registryLog!);
    const { owner, tableId: tableIdFromLog, statement } = logParsed.args;
    const tableId = await lib.getTableId();
    expect(owner).to.equal(lib.address);
    expect(tableIdFromLog).to.equal(tableId);
    expect(statement).to.equal(createStatement);

    // Set controller & parse events from the registry
    tx = await lib.setController(tableId, receiver.address);
    rec = await tx.wait();
    for (const log of rec.logs) {
      if (log.topics.includes(iface.getEventTopic("SetController"))) {
        registryLog = log;
      }
    }
    // Get the table's original owner, new owner, and token ID emitted from the event
    logParsed = iface.parseLog(registryLog!);
    const { tableId: controllerTableId, controller } = logParsed.args;
    expect(controller).to.equal(receiver.address);
    expect(controllerTableId).to.equal(tableId);
  });
});
