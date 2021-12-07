import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { Registry } from "../typechain/index";

describe("Proxy", function () {
  it(" Should be callable from deployed proxy contract", async function () {
    const Factory = await ethers.getContractFactory("Registry");

    const registry = (await upgrades.deployProxy(Factory, [], {
      kind: "uups",
    })) as Registry;
    await registry.deployed();

    const uri = await registry.uri(0);
    expect(uri).to.equal("https://tableland.com/table/{id}.json");
  });
});
