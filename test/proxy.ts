import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { TablelandTables } from "../typechain/index";

describe("Proxy", function () {
  it(" Should be callable from deployed proxy contract", async function () {
    const Factory = await ethers.getContractFactory("TablelandTables");

    const registry = (await upgrades.deployProxy(Factory, [], {
      kind: "uups",
    })) as TablelandTables;
    await registry.deployed();

    const totalSupply = await registry.totalSupply();
    expect(0).to.equal(Number(totalSupply.toString()));
  });
});
