import { expect } from "chai";
import { ethers } from "hardhat";
import { v4 } from "uuid";
const { BigNumber } = ethers;

describe("Registry", function () {
  it("Should mint a new table", async function () {
    const accounts = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("Registry");
    const registry = await Registry.deploy();
    await registry.deployed();
    // Manually call initialize because we are "deploying" the contract directly.
    await registry.initialize();

    // Create a random uuid, strip out the -s and treat it like a hex value
    const uuid = "0x" + v4().replace(/-/g, "");

    const tx = await registry
      .connect(accounts[4]) // Use connect to test that _anyone_ can mint
      .mintOne(accounts[0].address, uuid);
    const receipt = await tx.wait();
    // Await for receipt and inspect events for token id etc.
    const [event] = receipt.events ?? [];
    expect(event.args!.id).to.equal(BigNumber.from(uuid));
    const balance = await registry.balanceOf(accounts[0].address, uuid);
    expect(1).to.equal(Number(balance.toString()));
  });
});
