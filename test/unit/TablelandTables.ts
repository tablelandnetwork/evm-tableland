import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  TablelandTables,
  TestReentrancyRunSQLLegacy,
  TestReentrancyWriteToTable,
  TestReentrancyRunSQL,
} from "../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TablelandTables", function () {
  let accounts: SignerWithAddress[];
  let tables: TablelandTables;
  let runSqlLegacyReentrantController: TestReentrancyRunSQLLegacy;
  let writeToTableReentrantController: TestReentrancyWriteToTable;
  let sqlReentrantController: TestReentrancyRunSQL;

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

    writeToTableReentrantController = (await (
      await ethers.getContractFactory("TestReentrancyWriteToTable")
    ).deploy(tables.address)) as TestReentrancyWriteToTable;
    await writeToTableReentrantController.deployed();

    sqlReentrantController = (await (
      await ethers.getContractFactory("TestReentrancyRunSQL")
    ).deploy(tables.address)) as TestReentrancyRunSQL;
    await sqlReentrantController.deployed();
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
      .createTable(owner.address, createStatement);
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
      .createTable(owner.address, createStatement);
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

  it("Should be able to run SQL", async function () {
    // Test run SQL fails if table does not exist
    const owner = accounts[4];
    const runStatement = "insert into testing values (0);";
    await expect(
      tables
        .connect(owner)
        .writeToTable(owner.address, BigNumber.from(1), runStatement)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test owner can run SQL on table
    tx = await tables
      .connect(owner)
      .writeToTable(owner.address, tableId, runStatement);
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
      .writeToTable(nonOwner.address, tableId, runStatement);
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
      tables.connect(sender).writeToTable(caller.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test contract owner can not run SQL on behalf of another account
    const contractOwner = accounts[0];

    // TODO: remove this once deprecated function is removed
    await expect(
      tables
        .connect(contractOwner)
        ["runSQL(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement
        )
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    await expect(
      tables
        .connect(contractOwner)
        .writeToTable(caller.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should not enable reentracy attack via legacy runSQL with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement = "insert into testing values (1);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
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
      tables
        .connect(owner)
        ["runSQL(address,uint256,string)"](owner.address, tableId, runStatement)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should not enable reentracy attack via writeToTable with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement = "insert into testing values (1);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(
        owner.address,
        tableId,
        writeToTableReentrantController.address
      );
    await tx.wait();

    await expect(
      tables.connect(owner).writeToTable(owner.address, tableId, runStatement)
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should be able to run a set of SQL statements in the same transaction", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test owner can run SQLs on table
    tx = await tables
      .connect(owner)
      ["runSQL(address,(uint256,string)[])"](owner.address, [
        { tableId, statement: runStatement1 },
        { tableId, statement: runStatement2 },
      ]);
    receipt = await tx.wait();
    const [runEvent1, runEvent2] = receipt.events ?? [];

    // event 1
    expect(runEvent1.args!.caller).to.equal(owner.address);
    expect(runEvent1.args!.isOwner).to.equal(true);
    expect(runEvent1.args!.tableId).to.equal(tableId);
    expect(runEvent1.args!.statement).to.equal(runStatement1);
    expect(runEvent1.args!.policy).to.not.equal(undefined);

    // event 2
    expect(runEvent2.args!.caller).to.equal(owner.address);
    expect(runEvent2.args!.isOwner).to.equal(true);
    expect(runEvent2.args!.tableId).to.equal(tableId);
    expect(runEvent2.args!.statement).to.equal(runStatement2);
    expect(runEvent2.args!.policy).to.not.equal(undefined);
  });

  it("Should not enable reentracy attack via runSQL with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, sqlReentrantController.address);
    await tx.wait();

    await expect(
      tables
        .connect(owner)
        ["runSQL(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Should be able to run a set of runSQL and create statements in the same transaction", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const statement1 = "insert into testing values (1);";
    const statement2 = "create table other_testing (int a);";
    const statement3 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      ["runSQL(address,(uint256,string)[])"](owner.address, [
        { tableId, statement: statement1 },
        { tableId: BigNumber.from(0), statement: statement2 },
        { tableId, statement: statement3 },
      ]);
    receipt = await tx.wait();
    const [runEvent1, transferEvent, createEvent1, runEvent2] =
      receipt.events ?? [];

    expect(runEvent1.args!.caller).to.equal(owner.address);
    expect(runEvent1.args!.isOwner).to.equal(true);
    expect(runEvent1.args!.tableId).to.equal(tableId);
    expect(runEvent1.args!.statement).to.equal(statement1);
    expect(runEvent1.args!.policy).to.not.equal(undefined);

    expect(transferEvent.event).to.equal("Transfer");
    expect(transferEvent.args!.from).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(transferEvent.args!.to).to.equal(owner.address);

    expect(createEvent1.event).to.equal("CreateTable");
    expect(createEvent1.args!.statement).to.equal(statement2);
    expect(createEvent1.args!.owner).to.equal(owner.address);

    expect(runEvent2.args!.caller).to.equal(owner.address);
    expect(runEvent2.args!.isOwner).to.equal(true);
    expect(runEvent2.args!.tableId).to.equal(tableId);
    expect(runEvent2.args!.statement).to.equal(statement3);
    expect(runEvent2.args!.policy).to.not.equal(undefined);
  });

  it("Should NOT enable reentracy attack via `runSQL` with policy", async function () {
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, sqlReentrantController.address);
    await tx.wait();

    await expect(
      tables
        .connect(owner)
        ["runSQL(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });
  it("Should NOT be able to call `runSQL` with table that doesn't exist", async function () {
    // Test run SQL fails if table does not exist
    const owner = accounts[4];
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";
    await expect(
      tables
        .connect(owner)
        ["runSQL(address,(uint256,string)[])"](owner.address, [
          { tableId: BigNumber.from(1), statement: runStatement1 },
          { tableId: BigNumber.from(1), statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should be able to call `runSQL` with table you do not own", async function () {
    // Test others can run SQLs on table
    const nonOwner = accounts[5];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(nonOwner)
      ["runSQL(address,(uint256,string)[])"](nonOwner.address, [
        { tableId, statement: runStatement1 },
        { tableId, statement: runStatement2 },
        // this creates the table for the nonOwner address and gives them ownership
        { tableId: BigNumber.from(0), statement: createStatement },
      ]);
    receipt = await tx.wait();
    const [runEvent1, runEvent2, transferEvent, createEvent1] =
      receipt.events ?? [];

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

    expect(transferEvent.event).to.equal("Transfer");
    expect(transferEvent.args!.from).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(transferEvent.args!.to).to.equal(nonOwner.address);

    expect(createEvent1.event).to.equal("CreateTable");
    expect(createEvent1.args!.statement).to.equal(createStatement);
    expect(createEvent1.args!.owner).to.equal(nonOwner.address);
  });

  it("Should NOT be able to call `runSQL` on behalf of someone else", async function () {
    // Test others cannot run SQL on behalf of another account
    const sender = accounts[5];
    const caller = accounts[6];
    const owner = accounts[4];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    const tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(sender)
        ["runSQL(address,(uint256,string)[])"](caller.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should NOT allow calling `runSQL` when contract is paused", async function () {
    // Test others cannot run SQL on behalf of another account
    const owner = accounts[4];
    const contractOwner = accounts[0];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Pause with contract owner
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test creating tables is paused
    await expect(
      tables
        .connect(owner)
        ["runSQL(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
          { tableId: BigNumber.from(0), statement: createStatement },
        ])
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
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Pause with contract owner
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test creating tables is paused
    await expect(
      tables
        .connect(owner)
        ["runSQL(address,uint256,string)"](
          owner.address,
          tableId,
          runStatement1
        )
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
        ["runSQL(address,(uint256,string)[])"](owner.address, [
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
      .createTable(owner.address, createStatement);
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    tx = await tables
      .connect(nonOwner)
      ["runSQL(address,(uint256,string)[])"](nonOwner.address, [
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
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(sender)
        ["runSQL(address,(uint256,string)[])"](caller.address, [
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
      .createTable(tableOwner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    await expect(
      tables
        .connect(contractOwner)
        ["runSQL(address,(uint256,string)[])"](caller.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should NOT allow runSQLs to run when paused", async function () {
    // Test others cannot run SQL on behalf of another account
    const owner = accounts[4];
    const contractOwner = accounts[0];

    const createStatement = "create table testing (int a);";
    const runStatement1 = "insert into testing values (1);";
    const runStatement2 = "insert into testing values (2);";

    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Pause with contract owner
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test creating tables is paused
    await expect(
      tables
        .connect(owner)
        ["runSQL(address,(uint256,string)[])"](owner.address, [
          { tableId, statement: runStatement1 },
          { tableId, statement: runStatement2 },
        ])
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should emit transfer event when table transferred", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
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
      .createTable(owner.address, "create table testing (int a);");
    await tx.wait();
    const tokenURI = await tables.tokenURI(1);
    expect(tokenURI).includes("https://fake.com/");
  });

  it("Should pause and unpause minting", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    let tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    await tx.wait();

    // Test only contract owner can pause
    expect(tables.connect(owner).pause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Pause with contract owner
    const contractOwner = accounts[0];
    tx = await tables.connect(contractOwner).pause();
    await tx.wait();

    // Test creating tables is paused
    await expect(
      tables.connect(owner).createTable(owner.address, createStatement)
    ).to.be.revertedWith("Pausable: paused");

    // Test running SQL is paused
    await expect(
      tables
        .connect(owner)
        .writeToTable(
          owner.address,
          BigNumber.from(1),
          "insert into testing values (0);"
        )
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
      .createTable(owner.address, createStatement);
    await tx.wait();
  });

  it("Should reject big statements when running SQL", async function () {
    const owner = accounts[4];
    const createStatement = "create table testing (int a);";
    const tx = await tables
      .connect(owner)
      .createTable(owner.address, createStatement);
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Creating a fake statement greater than 35000 bytes
    const runStatement = Array(35001).fill("a").join("");

    await expect(
      tables.connect(owner).writeToTable(owner.address, tableId, runStatement)
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
