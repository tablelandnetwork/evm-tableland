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
      .safeMint(accounts[0].address);
    const balance = await registry.balanceOf(accounts[0].address);
    expect(1).to.equal(Number(balance.toString()));
  });
});
