import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  TablelandTables,
  TestReentrancyRunSQLLegacy,
  TestReentrancyMutateOne,
  TestReentrancyMutate,
} from "../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TablelandTables", function () {
  let accounts: SignerWithAddress[];
  let tables: TablelandTables;
  let runSqlLegacyReentrantController: TestReentrancyRunSQLLegacy;
  let mutateOneReentrantController: TestReentrancyMutateOne;
  let mutateReentrantController: TestReentrancyMutate;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TablelandTables");

    tables = await (
      (await upgrades.deployProxy(Factory, ["https://foo.xyz/"], {
        kind: "uups",
      })) as TablelandTables
    ).deployed();

    await tables.deployed();

    // Deploy test controller contracts
    runSqlLegacyReentrantController = (await (
      await ethers.getContractFactory("TestReentrancyRunSQLLegacy")
    ).deploy(tables.address)) as TestReentrancyRunSQLLegacy;
    await runSqlLegacyReentrantController.deployed();

    mutateOneReentrantController = (await (
      await ethers.getContractFactory("TestReentrancyMutateOne")
    ).deploy(tables.address)) as TestReentrancyMutateOne;
    await mutateOneReentrantController.deployed();

    mutateReentrantController = (await (
      await ethers.getContractFactory("TestReentrancyMutate")
    ).deploy(tables.address)) as TestReentrancyMutate;
    await mutateReentrantController.deployed();
  });

  it("Should not be initializable more than once", async function () {
    await expect(tables.initialize("https://foo.xyz/")).to.be.revertedWith(
      "ERC721A__Initializable: contract is already initialized"
    );
  });

  it("Should have set owner to deployer address", async function () {
    const owner = await tables.owner();
    expect(owner).to.equal(accounts[0].address);
  });

  it("Should create a new table", async function () {
    // Test anyone can create a table
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    let [mintEvent, createEvent] = receipt.events ?? [];
    expect(mintEvent.args!.tokenId).to.equal(BigNumber.from(1));
    expect(createEvent.args!.tableId).to.equal(BigNumber.from(1));
    expect(createEvent.args!.owner).to.equal(owner.address);
    expect(createEvent.args!.statement).to.equal(createStatement);
    let balance = await tables.balanceOf(owner.address);
    expect(balance).to.equal(BigNumber.from(1));
    let totalSupply = await tables.totalSupply();
    expect(totalSupply).to.equal(BigNumber.from(1));

    // Test an account can create a table for another account
    const sender = accounts[5];
    tx = await tables
      .connect(sender)
      ["create(address,string)"](owner.address, createStatement);
    receipt = await tx.wait();
    [mintEvent, createEvent] = receipt.events ?? [];
    expect(mintEvent.args!.tokenId).to.equal(BigNumber.from(2));
    expect(createEvent.args!.tableId).to.equal(BigNumber.from(2));
    expect(createEvent.args!.owner).to.equal(owner.address);
    expect(createEvent.args!.statement).to.equal(createStatement);
    balance = await tables.balanceOf(owner.address);
    expect(balance).to.equal(BigNumber.from(2));
    totalSupply = await tables.totalSupply();
    expect(totalSupply).to.equal(BigNumber.from(2));
  });

  it("Should be able to create multiple tables", async function () {
    // Test anyone can create a table
    const owner = accounts[4];
    const createStatement1 = "create table test1 (int a);";
    const createStatement2 = "create table test2 (int a);";
    let tx = await tables
      .connect(owner)
      ["create(address,string[])"](owner.address, [
        createStatement1,
        createStatement2,
      ]);
    let receipt = await tx.wait();
    let [mintEvent1, createEvent1, mintEvent2, createEvent2] =
      receipt.events ?? [];
    // first table
    expect(mintEvent1.args!.tokenId).to.equal(BigNumber.from(1));
    expect(createEvent1.args!.tableId).to.equal(BigNumber.from(1));
    expect(createEvent1.args!.owner).to.equal(owner.address);
    expect(createEvent1.args!.statement).to.equal(createStatement1);
    // second table
    expect(mintEvent2.args!.tokenId).to.equal(BigNumber.from(2));
    expect(createEvent2.args!.tableId).to.equal(BigNumber.from(2));
    expect(createEvent2.args!.owner).to.equal(owner.address);
    expect(createEvent2.args!.statement).to.equal(createStatement2);

    let balance = await tables.balanceOf(owner.address);
    expect(balance).to.equal(BigNumber.from(2));
    let totalSupply = await tables.totalSupply();
    expect(totalSupply).to.equal(BigNumber.from(2));

    // Test an account can create tables for another account
    const sender = accounts[5];
    tx = await tables
      .connect(sender)
      ["create(address,string[])"](owner.address, [
        createStatement1,
        createStatement2,
      ]);
    receipt = await tx.wait();
    [mintEvent1, createEvent1, mintEvent2, createEvent2] = receipt.events ?? [];
    expect(mintEvent1.args!.tokenId).to.equal(BigNumber.from(3));
    expect(createEvent1.args!.tableId).to.equal(BigNumber.from(3));
    expect(createEvent1.args!.owner).to.equal(owner.address);
    expect(createEvent1.args!.statement).to.equal(createStatement1);
    expect(mintEvent2.args!.tokenId).to.equal(BigNumber.from(4));
    expect(createEvent2.args!.tableId).to.equal(BigNumber.from(4));
    expect(createEvent2.args!.owner).to.equal(owner.address);
    expect(createEvent2.args!.statement).to.equal(createStatement2);

    balance = await tables.balanceOf(owner.address);
    expect(balance).to.equal(BigNumber.from(4));
    totalSupply = await tables.totalSupply();
    expect(totalSupply).to.equal(BigNumber.from(4));
  });

  it("Should revert if create is called without statements", async function () {
    const sender = accounts[5];

    await expect(
      tables.connect(sender)["create(address,string[])"](sender.address, [])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should be able to run mutating SQL statements", async function () {
    // Test run SQL fails if table does not exist
    const owner = accounts[4];
    const runStatement = "insert into testing values (0);";
    await expect(
      tables
        .connect(owner)
        ["mutate(address,uint256,string)"](
          owner.address,
          BigNumber.from(1),
          runStatement
        )
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test owner can run SQL on table
    tx = await tables
      .connect(owner)
      ["mutate(address,uint256,string)"](owner.address, tableId, runStatement);
    receipt = await tx.wait();
    let [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(owner.address);
    expect(runEvent.args!.isOwner).to.equal(true);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy).to.not.equal(undefined);

    // Test others can run SQL on table
    const nonOwner = accounts[5];
    tx = await tables
      .connect(nonOwner)
      ["mutate(address,uint256,string)"](
        nonOwner.address,
        tableId,
        runStatement
      );
    receipt = await tx.wait();
    [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(nonOwner.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy).to.not.equal(undefined);

    // Test others cannot run SQL on behalf of another account
    const sender = accounts[5];
    const caller = accounts[6];
    await expect(
      tables
        .connect(sender)
        ["mutate(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement
        )
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test contract owner can not run SQL on behalf of another account
    const contractOwner = accounts[0];

    // TODO: remove this once deprecated function is removed
    await expect(
      tables
        .connect(contractOwner)
        .runSQL(caller.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    await expect(
      tables
        .connect(contractOwner)
        ["mutate(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement
        )
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should not enable reentracy attack via legacy runSQL with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement = "insert into testing values (1);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(
        owner.address,
        tableId,
        runSqlLegacyReentrantController.address
      );
    await tx.wait();

    await expect(
      tables.connect(owner).runSQL(owner.address, tableId, runStatement)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should not enable reentracy attack via mutate with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement = "insert into testing values (1);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(
        owner.address,
        tableId,
        mutateOneReentrantController.address
      );
    await tx.wait();

    await expect(
      tables
        .connect(owner)
        ["mutate(address,uint256,string)"](owner.address, tableId, runStatement)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should be able to run a set of mutating SQL statements in the same transaction", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent1] = receipt.events ?? [];
    const tableId1 = createEvent1.args!.tableId;

    tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    receipt = await tx.wait();
    const [, createEvent2] = receipt.events ?? [];
    const tableId2 = createEvent2.args!.tableId;

    // Test owner can run SQLs on table
    tx = await tables
      .connect(owner)
      ["mutate(address,(uint256,string)[])"](owner.address, [
        { tableId: tableId1, statement: runStatement1 },
        { tableId: tableId2, statement: runStatement2 },
      ]);
    receipt = await tx.wait();
    const [runEvent1, runEvent2] = receipt.events ?? [];

    // event 1
    expect(runEvent1.args!.caller).to.equal(owner.address);
    expect(runEvent1.args!.isOwner).to.equal(true);
    expect(runEvent1.args!.tableId).to.equal(tableId1);
    expect(runEvent1.args!.statement).to.equal(runStatement1);
    expect(runEvent1.args!.policy).to.not.equal(undefined);

    // event 2
    expect(runEvent2.args!.caller).to.equal(owner.address);
    expect(runEvent2.args!.isOwner).to.equal(true);
    expect(runEvent2.args!.tableId).to.equal(tableId2);
    expect(runEvent2.args!.statement).to.equal(runStatement2);
    expect(runEvent2.args!.policy).to.not.equal(undefined);
  });

  it("Should not enable reentracy attack via mutate many with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, mutateReentrantController.address);
    await tx.wait();

    await expect(
      tables
        .connect(owner)
        ["mutate(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should NOT be able to call `mutate` with table that doesn't exist", async function () {
    // Test run SQL fails if table does not exist
    const owner = accounts[4];
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";
    await expect(
      tables
        .connect(owner)
        ["mutate(address,(uint256,string)[])"](owner.address, [
          { tableId: BigNumber.from(1), statement: runStatement1 },
          { tableId: BigNumber.from(1), statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should be able to call `mutate` with table you do not own", async function () {
    // Test others can run SQLs on table
    const nonOwner = accounts[5];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(nonOwner)
      ["mutate(address,(uint256,string)[])"](nonOwner.address, [
        { tableId, statement: runStatement1 },
        { tableId, statement: runStatement2 },
      ]);
    receipt = await tx.wait();
    const [runEvent1, runEvent2] = receipt.events ?? [];

    expect(runEvent1.args!.caller).to.equal(nonOwner.address);
    expect(runEvent1.args!.isOwner).to.equal(false);
    expect(runEvent1.args!.tableId).to.equal(tableId);
    expect(runEvent1.args!.statement).to.equal(runStatement1);
    expect(runEvent1.args!.policy).to.not.equal(undefined);

    expect(runEvent2.args!.caller).to.equal(nonOwner.address);
    expect(runEvent2.args!.isOwner).to.equal(false);
    expect(runEvent2.args!.tableId).to.equal(tableId);
    expect(runEvent2.args!.statement).to.equal(runStatement2);
    expect(runEvent2.args!.policy).to.not.equal(undefined);
  });

  it("Should NOT be able to call `mutate` on behalf of someone else", async function () {
    // Test others cannot run SQL on behalf of another account
    const sender = accounts[5];
    const caller = accounts[6];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    const tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(sender)
        ["mutate(address,(uint256,string)[])"](caller.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should NOT allow calling `mutate` when contract is paused", async function () {
    // Test others cannot run SQL on behalf of another account
    const owner = accounts[4];
    const contractOwner = accounts[0];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Pause with contract owner
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test mutating tables when paused
    await expect(
      tables
        .connect(owner)
        ["mutate(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWith("Pausable: paused");

    // Test mutating single table when paused
    await expect(
      tables
        .connect(owner)
        ["mutate(address,uint256,string)"](
          owner.address,
          tableId,
          runStatement1
        )
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should NOT allow calling legacy `runSQL` when contract is paused", async function () {
    // Test others cannot run SQL on behalf of another account
    const owner = accounts[4];
    const contractOwner = accounts[0];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Pause with contract owner
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test mutating when paused
    await expect(
      tables.connect(owner).runSQL(owner.address, tableId, runStatement1)
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should NOT be able to run a set of SQL statements on table that doesn't exist", async function () {
    // Test run SQL fails if table does not exist
    const owner = accounts[4];
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";
    await expect(
      tables
        .connect(owner)
        ["mutate(address,(uint256,string)[])"](owner.address, [
          { tableId: BigNumber.from(1), statement: runStatement1 },
          { tableId: BigNumber.from(1), statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should be able to run a set of SQL statements on table you do not own", async function () {
    // Test others can run SQLs on table
    const nonOwner = accounts[5];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(nonOwner)
      ["mutate(address,(uint256,string)[])"](nonOwner.address, [
        { tableId, statement: runStatement1 },
        { tableId, statement: runStatement2 },
      ]);
    receipt = await tx.wait();
    const [runEvent1, runEvent2] = receipt.events ?? [];

    expect(runEvent1.args!.caller).to.equal(nonOwner.address);
    expect(runEvent1.args!.isOwner).to.equal(false);
    expect(runEvent1.args!.tableId).to.equal(tableId);
    expect(runEvent1.args!.statement).to.equal(runStatement1);
    expect(runEvent1.args!.policy).to.not.equal(undefined);

    expect(runEvent2.args!.caller).to.equal(nonOwner.address);
    expect(runEvent2.args!.isOwner).to.equal(false);
    expect(runEvent2.args!.tableId).to.equal(tableId);
    expect(runEvent2.args!.statement).to.equal(runStatement2);
    expect(runEvent2.args!.policy).to.not.equal(undefined);
  });

  it("Should NOT be able to run a set of SQL statements on behalf of someone else", async function () {
    // Test others cannot run SQL on behalf of another account
    const sender = accounts[5];
    const caller = accounts[6];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    const tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(sender)
        ["mutate(address,(uint256,string)[])"](caller.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should NOT allow contract owner to run a set of SQL statements on behalf of someone else", async function () {
    // Test contract owner can run SQL on behalf of another account
    const contractOwner = accounts[0];
    const tableOwner = accounts[4];
    const caller = accounts[5];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    const tx = await tables
      .connect(tableOwner)
      ["create(address,string)"](tableOwner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(contractOwner)
        ["mutate(address,(uint256,string)[])"](caller.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should emit transfer event when table transferred", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test events from creating table do not include transfer event
    // (should be one from mint event and one custom create table event)
    expect(receipt.events?.length).to.equal(2);

    // Test owner transferring table
    const newOwner = accounts[5];
    tx = await tables
      .connect(owner)
      .transferFrom(owner.address, newOwner.address, tableId);
    receipt = await tx.wait();
    const [, transferTableEvent] = receipt.events ?? [];
    expect(transferTableEvent.args!.from).to.equal(owner.address);
    expect(transferTableEvent.args!.to).to.equal(newOwner.address);
    expect(transferTableEvent.args!.tableId).to.equal(
      createEvent.args!.tableId
    );
  });

  it("Should udpate the base URI", async function () {
    // Test only contact owner can set base URI
    const owner = accounts[4];
    await expect(
      tables.connect(owner).setBaseURI("https://fake.com/")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const contractOwner = accounts[0];
    let tx = await tables
      .connect(contractOwner)
      .setBaseURI("https://fake.com/");
    await tx.wait();

    tx = await tables
      .connect(owner)
      ["create(address,string)"](
        owner.address,
        "create table testing (int a);"
      );
    await tx.wait();
    const tokenURI = await tables.tokenURI(1);
    expect(tokenURI).includes("https://fake.com/");
  });

  it("Should pause and unpause minting", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    await tx.wait();

    // Test only contract owner can pause
    expect(tables.connect(owner).pause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Pause with contract owner
    const contractOwner = accounts[0];
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test legacy createTable when paused
    await expect(
      tables.connect(owner).createTable(owner.address, createStatement)
    ).to.be.revertedWith("Pausable: paused");

    // Test creating table when paused
    await expect(
      tables
        .connect(owner)
        ["create(address,string)"](owner.address, createStatement)
    ).to.be.revertedWith("Pausable: paused");

    // Test creating multiple tables when paused
    await expect(
      tables
        .connect(owner)
        ["create(address,string[])"](owner.address, [
          "insert into testing values (0);",
          "insert into testing values (0);",
        ])
    ).to.be.revertedWith("Pausable: paused");

    // Test setting controller is paused
    await expect(
      tables
        .connect(owner)
        .setController(owner.address, BigNumber.from(1), accounts[5].address)
    ).to.be.revertedWith("Pausable: paused");

    // Test locking controller is paused
    await expect(
      tables.connect(owner).lockController(owner.address, BigNumber.from(1))
    ).to.be.revertedWith("Pausable: paused");

    // Test only contract owner can unpause
    await expect(tables.connect(owner).unpause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Unpause with contract owner
    tx = await tables.connect(contractOwner).unpause();
    await tx.wait();

    // Test creating tables is unpaused
    tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    await tx.wait();
  });

  it("Should reject big statements when running SQL", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    const tx = await tables
      .connect(owner)
      ["create(address,string)"](owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Creating a fake statement greater than 35000 bytes
    const runStatement = Array(35001).fill("a").join("");

    await expect(
      tables
        .connect(owner)
        ["mutate(address,uint256,string)"](owner.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(tables, "MaxQuerySizeExceeded");
  });

  it("Should be able to get tableId inside a contract", async function () {
    const Factory = await ethers.getContractFactory("TestCreateFromContract");
    // supply the address of the registry contract
    const contract = await Factory.deploy(tables.address);
    await contract.deployed();
    const createTx = await contract.create("test_table");
    await createTx.wait();
    const tableId = await contract.tables("test_table");

    expect(tableId instanceof BigNumber).to.equal(true);
    expect(tableId.toNumber()).to.equal(1);
  });
});
