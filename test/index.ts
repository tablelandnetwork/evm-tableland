import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { v4 } from "uuid";
import { Registry } from "../typechain";
const { BigNumber } = ethers;

describe("Registry", function () {
  let registry: Registry;
  let accounts: SignerWithAddress[];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Registry");
    registry = await Factory.deploy();
    await registry.deployed();
    // Manually call initialize because we are "deploying" the contract directly.
    await registry.initialize();
  });

  it("Should mint a new table", async function () {
    // Create a random uuid, strip out the -s and treat it like a hex value
    const uuid = "0x" + v4().replace(/-/g, "");

    const tx = await registry
      .connect(accounts[4]) // Use connect to test that _anyone_ can mint
      .mintOne(accounts[4].address, uuid);
    const receipt = await tx.wait();
    // Await for receipt and inspect events for token id etc.
    const [event] = receipt.events ?? [];
    expect(event.args!.id).to.equal(BigNumber.from(uuid));
    const balance = await registry.balanceOf(accounts[4].address, uuid);
    expect(1).to.equal(Number(balance.toString()));
  });

  it("Should not be able to mint the same token twice", async function () {
    // Create a random uuid, strip out the -s and treat it like a hex value
    const uuid = "0x" + v4().replace(/-/g, "");

    const tx = await registry
      .connect(accounts[2])
      .mintOne(accounts[2].address, uuid);
    await tx.wait();
    let totalSupply = await registry.totalSupply(uuid);
    expect(totalSupply).to.equal(BigNumber.from(1));

    await expect(
      registry.connect(accounts[3]).mintOne(accounts[3].address, uuid)
    ).to.be.revertedWith("Cannot mint token more than once");

    totalSupply = await registry.totalSupply(uuid);
    expect(totalSupply).to.equal(BigNumber.from(1));
  });

  it("Should not be able to mint multiples of a token", async function () {
    // Create a random uuid, strip out the -s and treat it like a hex value
    const uuid = "0x" + v4().replace(/-/g, "");
    const two = BigNumber.from(2);

    await expect(
      registry.mint(accounts[3].address, uuid, two, [])
    ).to.be.revertedWith("Cannot mint token more than once");

    const totalSupply = await registry.totalSupply(uuid);
    expect(totalSupply).to.equal(BigNumber.from(0));
  });

  it("Should not be able to mint the same token twice in a batch", async function () {
    // Create a random uuid, strip out the -s and treat it like a hex value
    const uuid = "0x" + v4().replace(/-/g, "");
    const one = BigNumber.from(1);

    await expect(
      registry.mintBatch(accounts[3].address, [uuid, uuid], [one, one], [])
    ).to.be.revertedWith("Cannot mint token more than once");

    const totalSupply = await registry.totalSupply(uuid);
    expect(totalSupply).to.equal(BigNumber.from(0));
  });
});
