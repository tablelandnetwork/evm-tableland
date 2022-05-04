import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { TablelandTables } from "../typechain/index";

interface CreateEvent {
  tableId: BigNumber;
  statement: string;
  caller: string;
}

describe("Registry", function () {
  let registry: TablelandTables;
  let accounts: SignerWithAddress[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TablelandTables");
    registry = await Factory.deploy();
    await registry.deployed();
    // Manually call initialize because we are "deploying" the contract directly.
    await registry.initialize("https://website.com/");
  });

  it("Should mint a new table", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    const tx = await registry
      .connect(accounts[4]) // Use connect to test that _anyone_ can mint
      .createTable(accounts[4].address, createStatement);
    const receipt = await tx.wait();
    // Await for receipt and inspect events for token id etc.

    const [mintEvent, createEvent] = receipt.events ?? [];

    await expect(mintEvent.args!.tokenId).to.equal(BigNumber.from(0));
    await expect(createEvent.args!.tableId).to.equal(BigNumber.from(0));
    await expect(createEvent.args!.caller).to.equal(accounts[4].address);
    await expect(createEvent.args!.statement).to.equal(createStatement);

    const balance = await registry.balanceOf(accounts[4].address);
    await expect(1).to.equal(Number(balance.toString()));
    const totalSupply = await registry.totalSupply();
    await expect(1).to.equal(Number(totalSupply.toString()));
  });

  it("Should udpate the base URI", async function () {
    let tx = await registry.setBaseURI("https://fake.com/");
    await tx.wait();

    const createStatement = "create table contract_test_hardhat (int a);";
    const target = accounts[4].address;
    tx = await registry.createTable(target, createStatement);
    await tx.wait();
    const tokenURI = await registry.tokenURI(0);
    await expect(tokenURI).includes("https://fake.com/");
  });

  it("Should be easy to await the transaction", async function () {
    const mintAndReturnId = async (address: string, statement: string): Promise<CreateEvent> => {
      const tx = await registry.createTable(address, statement);
      const receipt = await tx.wait();
      const [mintEvent, createEvent] = receipt.events ?? [];
      return {
        tableId: createEvent.args?.tableId,
        statement: createEvent.args?.statement,
        caller: createEvent.args?.caller,
      };
    };

    const createStatement = "create table contract_test_hardhat (int a);";
    const target = accounts[4].address;
    // Here's our nice awaitable function
    const {
      tableId,
      statement,
      caller
    } = await mintAndReturnId(target, createStatement);
    await expect(tableId).to.equal(BigNumber.from(0));
    await expect(statement).to.equal(createStatement);
    await expect(caller).to.equal(target);
  });

  it("Should set controller for a table", async function () {
    const createStatement = "create table contract_test_hardhat (int a);";
    const tx = await registry
      .connect(accounts[4]) // Use connect to test that _anyone_ can mint
      .createTable(accounts[4].address, createStatement);
    const receipt = await tx.wait();
    // Await for receipt and inspect events for token id etc.

    const [mintEvent, createEvent] = receipt.events ?? [];

    await expect(mintEvent.args!.tokenId).to.equal(BigNumber.from(0));
    await expect(createEvent.args!.tableId).to.equal(BigNumber.from(0));
    await expect(createEvent.args!.caller).to.equal(accounts[4].address);
    await expect(createEvent.args!.statement).to.equal(createStatement);

    // account 4 is making account 3 the controller
    const txController = await registry
      .connect(accounts[4])
      .setController(accounts[4].address, createEvent.args!.tableId, accounts[3].address);
    const controllerReceipt = await txController.wait();

    const [setEvent] = controllerReceipt.events ?? [];

    await expect(setEvent.args!.tokenId).to.equal(createEvent.args!.tableId);
    await expect(setEvent.args!.controller).to.equal(accounts[3].address);
  });


});
