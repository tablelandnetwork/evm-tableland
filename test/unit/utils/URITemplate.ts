import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TestURITemplate, TestURITemplateLib } from "../../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

let contract: TestURITemplate;
let lib: TestURITemplateLib;
let accounts: SignerWithAddress[];

describe("URITemplate", function () {
  // Deploy the contract and get signers
  beforeEach(async function () {
    const UriTemplate = await ethers.getContractFactory("TestURITemplate");
    contract = (await UriTemplate.deploy()) as TestURITemplate;
    await contract.deployed();
    accounts = await ethers.getSigners();
  });

  it("Should not create invalid template URI", async function () {
    // Check that empty strings do not set a new URI
    await expect(contract.setURITemplateSingle("")).to.be.rejectedWith(
      "InvalidTemplate()"
    );
    await expect(contract.setURITemplateMultiple("")).to.be.rejectedWith(
      "InvalidTemplate()"
    );
  });

  it("Should return empty strings for unset token URI", async function () {
    // Mint an NFT
    const minter = accounts[1];
    const tx = await contract.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    // Check that empty strings are returned
    expect(await contract.tokenURI(tokenId)).to.equal(``);
  });

  it("Should create template URI with single 'id'", async function () {
    // Set token URI
    await contract.setURITemplateSingle("https://foo.xyz/{id}/bar");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await contract.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar`
    );

    await contract.setURITemplateMultiple("https://foo.xyz/{id}/asdf");
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/asdf`
    );
  });

  it("Should fail to create URI with multiple 'id' using the 'single' method", async function () {
    // Set token URI
    await contract.setURITemplateSingle("https://foo.xyz/{id}/bar={id}/foo");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await contract.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    // Check the token URI is the incorrect format
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar={id}/foo`
    );
  });

  it("Should create template URI with multiple 'id'", async function () {
    // Set token URI
    await contract.setURITemplateMultiple("https://foo.xyz/{id}/bar={id}/foo");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await contract.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    // Check the token URI is the correct format
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar=${tokenId}/foo`
    );
    // Set the URI again, with a longer string and another 'id' substring
    await contract.setURITemplateMultiple(
      `https://foo.xyz/{id}/bar={id}/foo={id}/bar`
    );
    // Check the token URI is the correct format
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar=${tokenId}/foo=${tokenId}/bar`
    );
  });
});

describe("URITemplateLib", function () {
  // Deploy the contract and get signers
  beforeEach(async function () {
    const UriTemplateLib = await ethers.getContractFactory(
      "TestURITemplateLib"
    );
    lib = (await UriTemplateLib.deploy()) as TestURITemplateLib;
    await contract.deployed();
    accounts = await ethers.getSigners();
  });

  it("Should not create invalid template URI", async function () {
    // Check that empty strings do not set a new URI
    await expect(lib.setURITemplateSingle("")).to.be.rejectedWith(
      "InvalidTemplate()"
    );
    await expect(lib.setURITemplateMultiple("")).to.be.rejectedWith(
      "InvalidTemplate()"
    );
  });

  it("Should return empty strings for unset token URI", async function () {
    // Mint an NFT
    const minter = accounts[1];
    const tx = await lib.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    // Check that empty strings are returned
    expect(await lib.tokenURI(tokenId)).to.equal(``);
  });

  it("Should create template URI with single 'id'", async function () {
    // Set token URI
    await lib.setURITemplateSingle("https://foo.xyz/{id}/bar");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await lib.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    expect(await lib.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar`
    );
    // Set the URI again, with a longer string and another 'id' substring
    await lib.setURITemplateMultiple("https://foo.xyz/{id}/asdf");
    // Check the token URI is the correct format
    expect(await lib.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/asdf`
    );
  });

  it("Should fail to create URI with multiple 'id' using the 'single' method", async function () {
    // Set token URI
    await contract.setURITemplateSingle("https://foo.xyz/{id}/bar={id}/foo");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await contract.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    // Check the token URI is the incorrect format
    expect(await contract.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar={id}/foo`
    );
  });

  it("Should create template URI with multiple 'id'", async function () {
    // Set token URI
    await lib.setURITemplateMultiple("https://foo.xyz/{id}/bar={id}/foo");
    // Mint an NFT
    const minter = accounts[1];
    const tx = await lib.connect(minter).mint();
    const receipt = await tx.wait();
    const [event] = receipt.events ?? [];
    const tokenId = event.args?.tokenId;
    expect(await lib.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar=${tokenId}/foo`
    );
    // Set the URI again, with a longer string and another 'id' substring
    await lib.setURITemplateMultiple(
      `https://foo.xyz/{id}/bar={id}/foo={id}/bar`
    );
    // Check the token URI is the correct format
    expect(await lib.tokenURI(tokenId)).to.equal(
      `https://foo.xyz/${tokenId}/bar=${tokenId}/foo=${tokenId}/bar`
    );
  });
});
