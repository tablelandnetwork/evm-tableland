import { run, ethers, upgrades, network, proxy } from "hardhat";

async function main() {
  console.log(`\nVerifying on '${network.name}'...`);

  // Ensure deployments
  if (proxy === "") {
    throw Error(`no proxy entry for '${network.name}'`);
  }

  // Verify implementation
  const tables = (await ethers.getContractFactory("TablelandTables")).attach(
    proxy
  );
  const impl = await upgrades.erc1967.getImplementationAddress(tables.address);
  await run("verify:verify", {
    address: impl,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
