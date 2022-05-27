import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TablelandTables } from "../typechain-types/index";

describe("TablelandTables", function () {
  let tables: TablelandTables;
  let accounts: SignerWithAddress[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TablelandTables");
    tables = await Factory.deploy();
    await tables.deployed();
    await tables.initialize("https://website.com/");
  });

  it("Should create a new table", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    const tx = await tables
      .connect(accounts[4]) // Use connect to test that _anyone_ can create a table
      .createTable(accounts[4].address, createStatement);
    const receipt = await tx.wait();
    const [mintEvent, createEvent] = receipt.events ?? [];
    expect(mintEvent.args!.tokenId).to.equal(BigNumber.from(1));
    expect(createEvent.args!.tableId).to.equal(BigNumber.from(1));
    expect(createEvent.args!.owner).to.equal(accounts[4].address);
    expect(createEvent.args!.statement).to.equal(createStatement);
    const balance = await tables.balanceOf(accounts[4].address);
    expect(balance).to.equal(BigNumber.from(1));
    const totalSupply = await tables.totalSupply();
    expect(totalSupply).to.equal(BigNumber.from(1));
  });

  it("Should be able to call runSQL", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    let tx = await tables
      .connect(accounts[4])
      .createTable(accounts[4].address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test owner can call runSQL on table
    const insertStatement = "insert into contract_test_insert_hardhat";
    tx = await tables
      .connect(accounts[4])
      .runSQL(accounts[4].address, tableId, insertStatement);
    receipt = await tx.wait();
    let [insertEvent] = receipt.events ?? [];
    expect(insertEvent.args!.caller).to.equal(accounts[4].address);
    expect(insertEvent.args!.isOwner).to.equal(true);
    expect(insertEvent.args!.tableId).to.equal(tableId);
    expect(insertEvent.args!.statement).to.equal(insertStatement);

    // Test others can call runSQL on table
    tx = await tables
      .connect(accounts[5])
      .runSQL(accounts[5].address, tableId, insertStatement);
    receipt = await tx.wait();
    [insertEvent] = receipt.events ?? [];
    expect(insertEvent.args!.caller).to.equal(accounts[5].address);
    expect(insertEvent.args!.isOwner).to.equal(false);
    expect(insertEvent.args!.tableId).to.equal(tableId);
    expect(insertEvent.args!.statement).to.equal(insertStatement);
  });

  it("Should set controller for a table", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    let tx = await tables
      .connect(accounts[4]) // Use connect to test that _anyone_ can mint
      .createTable(accounts[4].address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // account 4 is making account 3 the controller
    tx = await tables
      .connect(accounts[4])
      .setController(accounts[4].address, tableId, accounts[3].address);
    receipt = await tx.wait();
    const [setEvent] = receipt.events ?? [];
    expect(setEvent.args!.tableId).to.equal(createEvent.args!.tableId);
    expect(setEvent.args!.controller).to.equal(accounts[3].address);

    // TODO: test that nobody else can runSQL now
    // TODO: test that only owner can setController
  });

  it("Should emit TransferTable event when table transferred", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    let tx = await tables
      .connect(accounts[4])
      .createTable(accounts[4].address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // account 4 is transferring table to account 3
    tx = await tables
      .connect(accounts[4])
      .transferFrom(accounts[4].address, accounts[3].address, tableId);
    receipt = await tx.wait();
    const [, tableTransferEvent] = receipt.events ?? [];
    expect(tableTransferEvent.args!.from).to.equal(accounts[4].address);
    expect(tableTransferEvent.args!.to).to.equal(accounts[3].address);
    expect(tableTransferEvent.args!.startTableId).to.equal(
      createEvent.args!.tableId
    );
    expect(tableTransferEvent.args!.quantity).to.equal(BigNumber.from(1));
  });

  it("Should udpate the base URI", async function () {
    let tx = await tables.setBaseURI("https://fake.com/");
    await tx.wait();

    const createStatement = "create table contract_test_hardhat (int a);";
    tx = await tables.createTable(accounts[4].address, createStatement);
    await tx.wait();
    const tokenURI = await tables.tokenURI(1);
    expect(tokenURI).includes("https://fake.com/");
  });

  // TODO: pause, unpause
  // TODO: controller logic
});
