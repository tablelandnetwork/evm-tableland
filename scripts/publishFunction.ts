import { ethers, network, proxy } from "hardhat";

async function main() {
  console.log(`\nPublishing function on '${network.name}'...`);

  // Get proxy owner account
  const [account] = await ethers.getSigners();
  if (account.provider === undefined) {
    throw Error("missing provider");
  }

  // Publish function
  const tables = (await ethers.getContractFactory("TablelandTables")).attach(
    proxy
  );
  const tx = await tables.publishFunction(account.address, "function cid");
  const receipt = await tx.wait();
  console.log(`published function with tx '${receipt.transactionHash}'`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
