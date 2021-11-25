import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { Registry } from "../typechain/index";

describe("Proxy", function () {
  it(" Should be callable from deployed proxy contract", async function () {
    const Registry = await ethers.getContractFactory("Registry");

    const registry = (await upgrades.deployProxy(Registry, [], {
      kind: "uups",
    })) as Registry;
    await registry.deployed();

    const uri = await registry.uri(0);
    expect(uri).to.equal("https://tableland.textile.io/{id}.json");
  });
});
