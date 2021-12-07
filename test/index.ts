import { expect } from "chai";
import { ethers } from "hardhat";
const { BigNumber } = ethers;

describe("Registry", function () {
  it("Should mint a new table", async function () {
    const accounts = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("Registry");
    const registry = await Registry.deploy();
    await registry.deployed();
    // Manually call initialize because we are "deploying" the contract directly.
    await registry.initialize();

    const tx = await registry
      .connect(accounts[0]) // Use connect just to test things out
      .safeMint(accounts[0].address);
    const receipt = await tx.wait();
    // Await for receipt and inspect events for token id etc.
    const [event] = receipt.events ?? [];
    expect(event.args!.id).to.equal(BigNumber.from(0));
    const balance = await registry.balanceOf(accounts[0].address, 0);
    expect(1).to.equal(Number(balance.toString()));
  });
});
