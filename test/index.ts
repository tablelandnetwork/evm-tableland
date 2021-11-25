import { expect } from "chai";
import { ethers } from "hardhat";

describe("Registry", function () {
  it("Should mint a new table", async function () {
    const accounts = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("Registry");
    const registry = await Registry.deploy();
    await registry.deployed();
    // Manually call initialize because we are "deploying" the contract directly.
    await registry.initialize();

    await registry
      .connect(accounts[0]) // Use connect just to test things out
      .mint(accounts[0].address, 0, 1, "0x00");
    const balance = await registry.balanceOf(accounts[0].address, 0);
    expect(1).to.equal(Number(balance.toString()));
  });
});
