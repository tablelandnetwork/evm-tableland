import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { ContractFactory } from "ethers";
import type { TablelandTables } from "../typechain-types/index";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("TablelandTablesProxy", function () {
  let account: SignerWithAddress;
  let Factory: ContractFactory;

  beforeEach(async function () {
    [account] = await ethers.getSigners();
    Factory = await ethers.getContractFactory("TablelandTables");
  });

  it("Should have set implementation owner to deployer address", async function () {
    const tables = await deploy(Factory, "https://foo.xyz/");
    const owner = await tables.owner();
    expect(account.address).to.equal(owner);
  });

  it("Should not re-deploy proxy or implementation if unchanged", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    const tables2 = await update(tables1, Factory);
    expect(
      await upgrades.erc1967.getImplementationAddress(tables1.address)
    ).to.equal(
      await upgrades.erc1967.getImplementationAddress(tables2.address)
    );
    expect(tables1.address).to.equal(tables2.address);
  });

  it("Should be able to deploy multiple proxies with different baseURI", async function () {
    const tables1 = await deploy(Factory, "https://foo.xyz/");
    const tables2 = await deploy(Factory, "https://bar.xyz/");

    let tx = await tables1.createTable(
      account.address,
      "create table testing (int a);"
    );
    await tx.wait();
    tx = await tables2.createTable(
      account.address,
      "create table testing (int a);"
    );
    await tx.wait();

    expect(await tables1.tokenURI(1)).to.include("https://foo.xyz/");
    expect(await tables2.tokenURI(1)).to.include("https://bar.xyz/");
  });

  // test controllers are preserved
  // test new state can be added?
});

async function deploy(
  Factory: ContractFactory,
  baseURI: string
): Promise<TablelandTables> {
  const tables = (await upgrades.deployProxy(Factory, [baseURI], {
    kind: "uups",
  })) as TablelandTables;
  await tables.deployed();
  return tables;
}

async function update(
  proxy: TablelandTables,
  Factory: ContractFactory
): Promise<TablelandTables> {
  const tables = (await upgrades.upgradeProxy(proxy.address, Factory, {
    kind: "uups",
  })) as TablelandTables;
  await tables.deployed();
  return tables;
}
