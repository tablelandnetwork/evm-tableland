import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { TestURITemplate } from "../../../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

let contract: TestURITemplate;
let accounts: SignerWithAddress[];

describe("URITemplate", function () {
  // Deploy the contract and get signers
  beforeEach(async function () {
    const UriTemplate = await ethers.getContractFactory("TestURITemplate");
    contract = (await UriTemplate.deploy()) as TestURITemplate;
    await contract.deployed();
    accounts = await ethers.getSigners();
  });

  describe("_setURITemplate", function () {
    it("Should return empty string for unset URI", async function () {
      // Mint an NFT
      const minter = accounts[1];
      const tx = await contract.connect(minter).mint();
      const receipt = await tx.wait();
      const [event] = receipt.events ?? [];
      const tokenId = event.args?.tokenId;
      // Check that empty strings are returned
      expect(await contract.tokenURI(tokenId)).to.equal(``);
    });

    it("Should set, update, and get URI with no '{id}' substring", async function () {
      // Set token URI
      let uriString = "https://foo.xyz/";
      await contract.setURITemplate([uriString]);
      // Mint an NFT
      const minter = accounts[1];
      const tx = await contract.connect(minter).mint();
      const receipt = await tx.wait();
      const [event] = receipt.events ?? [];
      const tokenId = event.args?.tokenId;
      // Get the token URI, which uses the template URI
      expect(await contract.tokenURI(tokenId)).to.equal(uriString + tokenId);
      // Set a new token URI
      uriString = "https://foo.xyz/asdf/";
      await contract.setURITemplate([uriString]);
      expect(await contract.tokenURI(tokenId)).to.equal(uriString + tokenId);
    });

    it("Should set, update, and get URI with a single '{id}' substring", async function () {
      // Set token URI
      let uriString = "https://foo.xyz/{id}/bar";
      const uri = uriString.split("{id}");
      await contract.setURITemplate(uri);
      // Mint an NFT
      const minter = accounts[1];
      const tx = await contract.connect(minter).mint();
      const receipt = await tx.wait();
      const [event] = receipt.events ?? [];
      const tokenId = event.args?.tokenId;
      // Get the token URI, which uses the template URI
      expect(await contract.tokenURI(tokenId)).to.equal(uri.join(tokenId));
      // Set a new token URI
      uriString = "https://foo.xyz/{id}/asdf";
      await contract.setURITemplate(uri);
      expect(await contract.tokenURI(tokenId)).to.equal(uri.join(tokenId));
    });

    it("Should set, update, and get URI with multiple '{id}' substrings", async function () {
      // Set token URI
      let uriString = "https://foo.xyz/{id}/bar/{id}";
      const uri = uriString.split("{id}");
      await contract.setURITemplate(uri);
      // Mint an NFT
      const minter = accounts[1];
      const tx = await contract.connect(minter).mint();
      const receipt = await tx.wait();
      const [event] = receipt.events ?? [];
      const tokenId = event.args?.tokenId;
      // Get the token URI, which uses the template URI
      expect(await contract.tokenURI(tokenId)).to.equal(uri.join(tokenId));
      // Set a new token URI
      uriString = "https://foo.xyz/{id}/asdf/{id}";
      await contract.setURITemplate(uri);
      expect(await contract.tokenURI(tokenId)).to.equal(uri.join(tokenId));
    });
  });
});
