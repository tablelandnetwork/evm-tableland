import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import type {
  TablelandTables,
  TestERC721Enumerable,
  TestERC721AQueryable,
  TestTablelandController,
} from "../../typechain-types";
import { isEventLog } from "../../scripts/utils";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TablelandTablesProxy", function () {
  let accounts: SignerWithAddress[];
  let Factory: ContractFactory;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    Factory = await ethers.getContractFactory("TablelandTables");
  });

  it("Should not be initializable more than once", async function () {
    const tables = await deploy(Factory, "https://foo.xyz/");
    await expect(tables.initialize("https://foo.xyz/")).to.be.revertedWith(
      "ERC721A__Initializable: contract is already initialized"
    );
  });

  it("Should block implementation initialize", async function () {
    const tables = await deploy(Factory, "https://foo.xyz/");
    const impl = Factory.attach(
      await upgrades.erc1967.getImplementationAddress(await tables.getAddress())
    );
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    await expect(impl.initialize("https://foo.xyz/")).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("Should have set implementation owner to deployer address", async function () {
    const tables = await deploy(Factory, "https://foo.xyz/");
    const owner = await tables.owner();
    expect(owner).to.equal(accounts[0].address);
  });

  it("Should only allow owner to upgrade", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    const badUpdater = accounts[1];
    const Factory2 = await ethers.getContractFactory(
      "TablelandTables",
      badUpdater
    );
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    await expect(upgrade(tables1, Factory2)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should not re-deploy proxy or implementation if unchanged", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    const tables2 = await upgrade(tables1, Factory);
    expect(
      await upgrades.erc1967.getImplementationAddress(
        await tables1.getAddress()
      )
    ).to.equal(
      await upgrades.erc1967.getImplementationAddress(
        await tables2.getAddress()
      )
    );
    expect(await tables1.getAddress()).to.equal(await tables2.getAddress());
  });

  it("Should be able to deploy multiple proxies with different baseURI", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    const tables2 = await deploy(Factory, "https://bar.xyz/");

    const owner = accounts[1];
    const createStatement = "create table testing (int a);";
    let tx = await tables1
      .connect(owner)
      .createTable(owner.address, createStatement);
    await tx.wait();
    tx = await tables2
      .connect(owner)
      .createTable(owner.address, createStatement);
    await tx.wait();

    expect(await tables1.tokenURI(1)).to.include("https://foo.xyz/");
    expect(await tables2.tokenURI(1)).to.include("https://bar.xyz/");
  });

  it("Should allow implementation to be upgraded", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    const impl1 = await upgrades.erc1967.getImplementationAddress(
      await tables1.getAddress()
    );
    const owner = accounts[1];
    const tx = await tables1
      .connect(owner)
      .createTable(owner.address, "create table testing (int a);");
    await tx.wait();

    const Factory2 = await ethers.getContractFactory(
      "TestTablelandTablesUpgrade"
    );
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    const tables2 = await upgrade(tables1, Factory2);
    const impl2 = await upgrades.erc1967.getImplementationAddress(
      await tables2.getAddress()
    );

    // Test implementation was upgraded
    expect(impl1).to.not.equal(impl2);
    expect(await tables1.getAddress()).to.equal(await tables2.getAddress());

    // Test storage has not changed
    expect(await tables2.balanceOf(owner.address)).to.equal(BigInt(1));
  });

  it("Should allow implementation to be upgraded to constructor with _disableInitializers() call", async function () {
    const FactoryNoConstructor = await ethers.getContractFactory(
      "TestTablelandTablesNoConstructor"
    );
    const tables1 = await deployNoConstructor(
      FactoryNoConstructor,
      "https://foo.xyz/"
    );
    const impl1 = await upgrades.erc1967.getImplementationAddress(
      await tables1.getAddress()
    );
    const owner = accounts[1];
    const tx = await tables1
      .connect(owner)
      .createTable(owner.address, "create table testing (int a);");
    await tx.wait();

    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    const tables2 = await upgrade(tables1, Factory);
    const impl2 = await upgrades.erc1967.getImplementationAddress(
      await tables2.getAddress()
    );

    // Test implementation was upgraded
    expect(impl1).to.not.equal(impl2);
    expect(await tables1.getAddress()).to.equal(await tables2.getAddress());

    // Test storage has not changed
    expect(await tables2.balanceOf(owner.address)).to.equal(BigInt(1));

    // Test second upgrade to new storage
    const FactoryUpgrade = await ethers.getContractFactory(
      "TestTablelandTablesUpgrade"
    );
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    const tables3 = await upgrade(tables1, FactoryUpgrade);
    const impl3 = await upgrades.erc1967.getImplementationAddress(
      await tables3.getAddress()
    );

    // Test implementation was upgraded
    expect(impl1).to.not.equal(impl3);
    expect(impl2).to.not.equal(impl3);
    expect(await tables2.getAddress()).to.equal(await tables3.getAddress());

    // Test storage has not changed
    expect(await tables3.balanceOf(owner.address)).to.equal(BigInt(1));
  });

  it("Should allow existing controllers to function after upgrade", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");

    // Deploy test erc721 contracts
    const enumPolicyLib = (await (
      await ethers.getContractFactory("ERC721EnumerablePolicies")
    ).deploy()) as TestTablelandController;
    await enumPolicyLib.waitForDeployment();
    const foos = (await (
      await ethers.getContractFactory("TestERC721Enumerable")
    ).deploy()) as TestERC721Enumerable;
    await foos.waitForDeployment();
    const bars = (await (
      await ethers.getContractFactory("TestERC721AQueryable")
    ).deploy()) as TestERC721AQueryable;
    await bars.waitForDeployment();

    // Deploy test controllers
    const controller = (await (
      await ethers.getContractFactory("TestTablelandController")
    ).deploy()) as TestTablelandController;
    await controller.waitForDeployment();

    // Setup controller
    await (await controller.setFoos(await foos.getAddress())).wait();
    await (await controller.setBars(await bars.getAddress())).wait();

    // Create table
    const owner = accounts[1];
    let tx = await tables1
      .connect(owner)
      .createTable(owner.address, "create table testing (int a);");
    let receipt = await tx.wait();
    const [, createEvent] = receipt?.logs.filter(isEventLog) ?? [];
    const tableId = createEvent.args!.tableId;

    // Set controller
    tx = await tables1
      .connect(owner)
      .setController(owner.address, tableId, await controller.getAddress());
    await tx.wait();

    // Mint required tokens
    const caller = accounts[2];
    tx = await foos.connect(caller).mint();
    await tx.wait();
    tx = await bars.connect(caller).mint();
    await tx.wait();

    // Run sql
    const runStatement = "insert into testing values (0);";
    const value = ethers.parseEther("1");
    tx = await tables1
      .connect(caller)
      ["mutate(address,uint256,string)"](
        caller.address,
        tableId,
        runStatement,
        { value }
      );
    receipt = await tx.wait();
    let [runEvent] = receipt?.logs.filter(isEventLog) ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy).to.not.equal(undefined);

    const Factory2 = await ethers.getContractFactory(
      "TestTablelandTablesUpgrade"
    );
    // @ts-expect-error ignore `Conversion of type 'Contract'` error since
    // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
    const tables2 = await upgrade(tables1, Factory2);

    // Run sql again against new tables implementation
    tx = await tables2
      .connect(caller)
      ["mutate(address,uint256,string)"](
        caller.address,
        tableId,
        runStatement,
        { value }
      );
    receipt = await tx.wait();
    [runEvent] = receipt?.logs.filter(isEventLog) ?? [];
    expect(runEvent.args!.caller).to.equal(caller.address);
    expect(runEvent.args!.isOwner).to.equal(false);
    expect(runEvent.args!.tableId).to.equal(tableId);
    expect(runEvent.args!.statement).to.equal(runStatement);
    expect(runEvent.args!.policy).to.not.equal(undefined);

    // Run sql one more time with caller that does not own required tokens
    const caller2 = accounts[3];
    await expect(
      tables2
        .connect(caller2)
        ["mutate(address,uint256,string)"](
          caller2.address,
          tableId,
          runStatement,
          { value }
        )
    ).to.be.revertedWithCustomError(
      enumPolicyLib,
      "ERC721EnumerablePoliciesUnauthorized"
    );
  });
});

async function deploy(
  Factory: ContractFactory,
  baseURI: string
): Promise<TablelandTables> {
  // @ts-expect-error ignore `Conversion of type 'Contract'` error since
  // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
  const tables = (await upgrades.deployProxy(Factory, [baseURI], {
    kind: "uups",
  })) as TablelandTables;
  return await tables.waitForDeployment();
}

async function deployNoConstructor(
  Factory: ContractFactory,
  baseURI: string
): Promise<TablelandTables> {
  // @ts-expect-error ignore `Conversion of type 'Contract'` error since
  // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
  const tables = (await upgrades.deployProxy(Factory, [baseURI], {
    kind: "uups",
  })) as TablelandTables;
  return await tables.waitForDeployment();
}

async function upgrade(
  proxy: Contract,
  Factory: ContractFactory
): Promise<TablelandTables> {
  // @ts-expect-error ignore `Conversion of type 'Contract'` error since
  // `Contract` is subclass of `BaseContract` of which `TablelandTables` extends
  const tables = (await upgrades.upgradeProxy(
    await proxy.getAddress(),
    Factory,
    {
      kind: "uups",
    }
  )) as TablelandTables;
  return await tables.waitForDeployment();
}
