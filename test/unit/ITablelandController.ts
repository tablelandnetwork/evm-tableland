import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import type {
  TablelandTables,
  TestERC721Enumerable,
  TestERC721AQueryable,
  TestTablelandController,
  TestTablelandControllerV0,
  TestAllowAllTablelandController,
  TestRawTablelandController1,
  TestRawTablelandController2,
  ERC721EnumerablePolicies,
  ERC721AQueryablePolicies,
} from "../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("ITablelandController", function () {
  let accounts: SignerWithAddress[];
  let tables: TablelandTables;
  let foos: TestERC721Enumerable;
  let bars: TestERC721AQueryable;
  let enumPolicyLib: ERC721EnumerablePolicies;
  let queryablePolicyLib: ERC721AQueryablePolicies;
  let controller: TestTablelandController;
  let controllerV0: TestTablelandControllerV0;
  let allowAllController: TestAllowAllTablelandController;
  let rawController1: TestRawTablelandController1;
  let rawController2: TestRawTablelandController2;

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    // Deploy tables
    const Factory = await ethers.getContractFactory("TablelandTables");
    tables = await (
      (await upgrades.deployProxy(Factory, ["https://foo.xyz/"], {
        kind: "uups",
      })) as TablelandTables
    ).deployed();

    // Deploy test erc721 contracts
    foos = (await (
      await ethers.getContractFactory("TestERC721Enumerable")
    ).deploy()) as TestERC721Enumerable;
    await foos.deployed();
    bars = (await (
      await ethers.getContractFactory("TestERC721AQueryable")
    ).deploy()) as TestERC721AQueryable;
    await bars.deployed();

    // Get the enumerablePolicies library
    enumPolicyLib = (await (
      await ethers.getContractFactory("ERC721EnumerablePolicies")
    ).deploy()) as TestTablelandController;
    await enumPolicyLib.deployed();

    // Get the queryablePolicies library
    queryablePolicyLib = (await (
      await ethers.getContractFactory("ERC721AQueryablePolicies")
    ).deploy()) as TestTablelandController;
    await queryablePolicyLib.deployed();

    // Deploy test controllers
    controller = (await (
      await ethers.getContractFactory("TestTablelandController")
    ).deploy()) as TestTablelandController;
    await controller.deployed();

    controllerV0 = (await (
      await ethers.getContractFactory("TestTablelandControllerV0")
    ).deploy()) as TestTablelandControllerV0;
    await controllerV0.deployed();

    allowAllController = (await (
      await ethers.getContractFactory("TestAllowAllTablelandController")
    ).deploy()) as TestAllowAllTablelandController;
    await allowAllController.deployed();

    rawController1 = (await (
      await ethers.getContractFactory("TestRawTablelandController1")
    ).deploy()) as TestRawTablelandController1;
    await rawController1.deployed();

    rawController2 = (await (
      await ethers.getContractFactory("TestRawTablelandController2")
    ).deploy()) as TestRawTablelandController2;
    await rawController2.deployed();

    // Setup controllers
    await (await controller.setFoos(foos.address)).wait();
    await (await controller.setBars(bars.address)).wait();
    await (await controllerV0.setFoos(foos.address)).wait();
    await (await controllerV0.setBars(bars.address)).wait();
  });

  it("Should set controller for a table", async function () {
    // Test setting controller fails if table does not exist
    const owner = accounts[4];
    await expect(
      tables
        .connect(owner)
        .setController(owner.address, BigNumber.from(1), accounts[3].address)
    ).to.be.revertedWithCustomError(tables, "OwnerQueryForNonexistentToken");

    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test caller must be table owner
    const notOwner = accounts[5];
    const eoaController = accounts[6];
    await expect(
      tables
        .connect(owner)
        .setController(notOwner.address, tableId, eoaController.address)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test only owner can set controller
    await expect(
      tables
        .connect(notOwner)
        .setController(owner.address, tableId, eoaController.address)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test setting controller to an EOA address
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, eoaController.address);
    receipt = await tx.wait();
    let [setControllerEvent] = receipt.events ?? [];
    expect(setControllerEvent.args!.tableId).to.equal(
      createEvent.args!.tableId
    );
    expect(setControllerEvent.args!.controller).to.equal(eoaController.address);

    // Test that runSQL is now locked down to this EOA address
    // (not even owner should be able to run SQL now)
    const runStatement = "insert into testing values (0);";
    await expect(
      tables
        .connect(owner)
        ["runSQL(address,uint256,string)"](owner.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
    tx = await tables
      .connect(eoaController)
      ["runSQL(address,uint256,string)"](
        eoaController.address,
        tableId,
        runStatement
      );
    await tx.wait();

    // Test setting controller to a contract address
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, allowAllController.address);
    receipt = await tx.wait();
    [setControllerEvent] = receipt.events ?? [];
    expect(setControllerEvent.args!.tableId).to.equal(
      createEvent.args!.tableId
    );
    expect(setControllerEvent.args!.controller).to.equal(
      allowAllController.address
    );

    // Test that anyone can run SQL through contract controller
    const caller = accounts[7];
    tx = await tables
      .connect(caller)
      ["runSQL(address,uint256,string)"](caller.address, tableId, runStatement);
    receipt = await tx.wait();
    const [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy.allowInsert).to.equal(true);
    expect(runEvent.args!.policy.allowUpdate).to.equal(true);
    expect(runEvent.args!.policy.allowDelete).to.equal(true);
    expect(runEvent.args!.policy.whereClause).to.equal("");
    expect(runEvent.args!.policy.withCheck).to.equal("");
    expect(runEvent.args!.policy.updatableColumns.length).to.equal(0);
  });

  it("Should get controller for a table", async function () {
    const owner = accounts[4];
    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    const eoaController = accounts[6];
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, eoaController.address);
    await tx.wait();

    expect(await tables.getController(tableId)).to.equal(eoaController.address);
  });

  it("Should unset controller for a table", async function () {
    const owner = accounts[4];
    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    const eoaController = accounts[6];
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, eoaController.address);
    await tx.wait();
    expect(await tables.getController(tableId)).to.equal(eoaController.address);

    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, ethers.constants.AddressZero);
    receipt = await tx.wait();
    const [setControllerEvent] = receipt.events ?? [];
    expect(setControllerEvent.args!.controller).to.equal(
      ethers.constants.AddressZero
    );

    expect(await tables.getController(tableId)).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("Should lock controller for a table", async function () {
    // Test locking controller fails if table does not exist
    const owner = accounts[4];
    await expect(
      tables.connect(owner).lockController(owner.address, BigNumber.from(1))
    ).to.be.revertedWithCustomError(tables, "OwnerQueryForNonexistentToken");

    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test caller must be table owner
    const notOwner = accounts[5];
    await expect(
      tables.connect(owner).lockController(notOwner.address, tableId)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test only owner can lock controller
    await expect(
      tables.connect(notOwner).lockController(owner.address, tableId)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    const eoaController = accounts[6];
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, eoaController.address);
    await tx.wait();
    expect(await tables.getController(tableId)).to.equal(eoaController.address);

    tx = await tables.connect(owner).lockController(owner.address, tableId);
    receipt = await tx.wait();

    // Test controller can no longer be set
    await expect(
      tables
        .connect(owner)
        .setController(owner.address, tableId, eoaController.address)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    // Test controller cannot be locked again
    await expect(
      tables.connect(owner).lockController(owner.address, tableId)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should not set or lock controller for a table with contract owner", async function () {
    const owner = accounts[4];

    const tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;

    // Test contract owner can not set or lock the controller
    const contractOwner = accounts[0];
    const eoaController = accounts[6];
    await expect(
      tables
        .connect(contractOwner)
        .setController(owner.address, tableId, eoaController.address)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");

    await expect(
      tables.connect(contractOwner).lockController(owner.address, tableId)
    ).to.be.revertedWithCustomError(tables, "Unauthorized");
  });

  it("Should be able to gate run SQL with controller contract", async function () {
    const owner = accounts[4];
    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, controller.address);
    await tx.wait();

    // Test that run SQL on table is gated by ether (with custom error)
    const runStatement = "insert into testing values (0);";
    const caller = accounts[5];
    await expect(
      tables
        .connect(caller)
        ["runSQL(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement
        )
    ).to.be.revertedWithCustomError(controller, "InsufficientValue");

    // Test that run SQL on table is gated by ether (with revert/require)
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement, {
        value: ethers.utils.parseEther("2"),
      })
    ).to.be.revertedWith("too much ether!");

    // Test that run SQL on table is gated by Foo and Bar ownership
    const value = ethers.utils.parseEther("1");
    await expect(
      tables
        .connect(caller)
        ["runSQL(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement,
          {
            value,
          }
        )
    ).to.be.revertedWithCustomError(
      enumPolicyLib,
      "ERC721EnumerablePoliciesUnauthorized"
    );

    // Test balance was reverted
    expect(await ethers.provider.getBalance(tables.address)).to.equal(
      BigNumber.from(0)
    );
    expect(await ethers.provider.getBalance(controller.address)).to.equal(
      BigNumber.from(0)
    );

    // Mint a Foo
    tx = await foos.connect(caller).mint();
    await tx.wait();

    // Still gated (need a Bar too)
    await expect(
      tables
        .connect(caller)
        ["runSQL(address,uint256,string)"](
          caller.address,
          tableId,
          runStatement,
          {
            value,
          }
        )
    ).to.be.revertedWithCustomError(
      queryablePolicyLib,
      "ERC721AQueryablePoliciesUnauthorized"
    );

    // Mint a Bar
    tx = await bars.connect(caller).mint();
    await tx.wait();

    // Caller should be able to run SQL now
    tx = await tables
      .connect(caller)
      ["runSQL(address,uint256,string)"](
        caller.address,
        tableId,
        runStatement,
        { value }
      );
    receipt = await tx.wait();
    let [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy.allowInsert).to.equal(false);
    expect(runEvent.args!.policy.allowUpdate).to.equal(true);
    expect(runEvent.args!.policy.allowDelete).to.equal(false);
    expect(runEvent.args!.policy.whereClause).to.equal(
      "foo_id in(0) and bar_id in(0)"
    );
    expect(runEvent.args!.policy.withCheck).to.equal("baz > 0");
    expect(runEvent.args!.policy.updatableColumns.length).to.equal(1);
    expect(runEvent.args!.policy.updatableColumns).to.include("baz");

    // Test balance was taken by controller
    expect(await ethers.provider.getBalance(tables.address)).to.equal(
      BigNumber.from(0)
    );
    expect(await ethers.provider.getBalance(controller.address)).to.equal(
      value
    );

    // Mint some more
    tx = await foos.connect(caller).mint();
    await tx.wait();
    tx = await bars.connect(caller).mint();
    await tx.wait();
    tx = await bars.connect(caller).mint();
    await tx.wait();

    // Where clause should reflect all owned tokens
    tx = await tables
      .connect(caller)
      ["runSQL(address,uint256,string)"](
        caller.address,
        tableId,
        runStatement,
        { value }
      );
    receipt = await tx.wait();
    [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy.allowInsert).to.equal(false);
    expect(runEvent.args!.policy.allowUpdate).to.equal(true);
    expect(runEvent.args!.policy.allowDelete).to.equal(false);
    expect(runEvent.args!.policy.whereClause).to.equal(
      "foo_id in(0,1) and bar_id in(0,1,2)"
    );
    expect(runEvent.args!.policy.withCheck).to.equal("baz > 0");
    expect(runEvent.args!.policy.updatableColumns.length).to.equal(1);
    expect(runEvent.args!.policy.updatableColumns).to.include("baz");
  });

  it("Should be able to gate run SQL with controller v0 contract", async function () {
    const owner = accounts[4];
    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    let receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, controllerV0.address);
    await tx.wait();

    // Test that run SQL on table is gated by ether
    const runStatement = "insert into testing values (0);";
    const caller = accounts[5];
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement)
    ).to.be.revertedWithCustomError(controllerV0, "InsufficientValue");

    // Test that run SQL on table is gated by Foo and Bar ownership
    const value = ethers.utils.parseEther("1");
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement, {
        value,
      })
    ).to.be.revertedWithCustomError(
      enumPolicyLib,
      "ERC721EnumerablePoliciesUnauthorized"
    );

    // Test balance was reverted
    expect(await ethers.provider.getBalance(tables.address)).to.equal(
      BigNumber.from(0)
    );
    expect(await ethers.provider.getBalance(controllerV0.address)).to.equal(
      BigNumber.from(0)
    );

    // Mint a Foo
    tx = await foos.connect(caller).mint();
    await tx.wait();

    // Still gated (need a Bar too)
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement, {
        value,
      })
    ).to.be.revertedWithCustomError(
      queryablePolicyLib,
      "ERC721AQueryablePoliciesUnauthorized"
    );

    // Mint a Bar
    tx = await bars.connect(caller).mint();
    await tx.wait();

    // Caller should be able to run SQL now
    tx = await tables
      .connect(caller)
      .runSQL(caller.address, tableId, runStatement, { value });
    receipt = await tx.wait();
    let [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy.allowInsert).to.equal(false);
    expect(runEvent.args!.policy.allowUpdate).to.equal(true);
    expect(runEvent.args!.policy.allowDelete).to.equal(false);
    expect(runEvent.args!.policy.whereClause).to.equal(
      "foo_id in(0) and bar_id in(0)"
    );
    expect(runEvent.args!.policy.withCheck).to.equal("baz > 0");
    expect(runEvent.args!.policy.updatableColumns.length).to.equal(1);
    expect(runEvent.args!.policy.updatableColumns).to.include("baz");

    // Test balance was taken by controller
    expect(await ethers.provider.getBalance(tables.address)).to.equal(
      BigNumber.from(0)
    );
    expect(await ethers.provider.getBalance(controllerV0.address)).to.equal(
      value
    );

    // Mint some more
    tx = await foos.connect(caller).mint();
    await tx.wait();
    tx = await bars.connect(caller).mint();
    await tx.wait();
    tx = await bars.connect(caller).mint();
    await tx.wait();

    // Where clause should reflect all owned tokens
    tx = await tables
      .connect(caller)
      .runSQL(caller.address, tableId, runStatement, { value });
    receipt = await tx.wait();
    [runEvent] = receipt.events ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy.allowInsert).to.equal(false);
    expect(runEvent.args!.policy.allowUpdate).to.equal(true);
    expect(runEvent.args!.policy.allowDelete).to.equal(false);
    expect(runEvent.args!.policy.whereClause).to.equal(
      "foo_id in(0,1) and bar_id in(0,1,2)"
    );
    expect(runEvent.args!.policy.withCheck).to.equal("baz > 0");
    expect(runEvent.args!.policy.updatableColumns.length).to.equal(1);
    expect(runEvent.args!.policy.updatableColumns).to.include("baz");
  });

  it("Should reject raw controllers", async function () {
    const owner = accounts[4];
    let tx = await tables.createTable(
      owner.address,
      "create table testing (int a);"
    );
    const receipt = await tx.wait();
    const [, createEvent] = receipt.events ?? [];
    const tableId = createEvent.args!.tableId;
    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, rawController1.address);
    await tx.wait();

    // Test that run SQL on table is rejected (not implemented)
    const runStatement = "insert into testing values (0);";
    const caller = accounts[5];
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement)
    ).to.be.revertedWith("not implemented");

    tx = await tables
      .connect(owner)
      .setController(owner.address, tableId, rawController2.address);
    await tx.wait();

    // Test that run SQL on table is rejected (w/o reason string)
    await expect(
      tables.connect(caller).runSQL(caller.address, tableId, runStatement)
    ).to.be.revertedWithoutReason();
  });
});
