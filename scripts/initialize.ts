// Note: This script was added to manually initialize live implementation
// contracts before a constructor was added to TablelandTables with a call
// to _disableInitializers(). This disables calls to initialize on the
// implementation, making this script unnecessary after the next upgrade.

import { ethers, network, baseURI, proxy, upgrades } from "hardhat";

async function main() {
  console.log(`\nInitializing on '${network.name}'...`);

  // Get proxy owner account
  const [account] = await ethers.getSigners();
  if (account.provider === undefined) {
    throw Error("missing provider");
  }

  // Get proxy address
  if (proxy === undefined || proxy === "") {
    throw Error(`missing proxies entry for '${network.name}'`);
  }
  console.log(`Using proxy address '${proxy}'`);

  // Get implementation address
  const impl = await upgrades.erc1967.getImplementationAddress(proxy);
  console.log("Implementation address:", impl);

  // Get new base URI
  if (baseURI === undefined || baseURI === "") {
    throw Error(`missing baseURIs entry for '${network.name}'`);
  }
  console.log(`Using base URI '${baseURI}'`);

  // Initialize
  const tables = (await ethers.getContractFactory("TablelandTables")).attach(
    impl
  );
  const tx = await tables.initialize(baseURI);
  const receipt = await tx.wait();
  console.log(`initialized with tx '${receipt.transactionHash}'`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
