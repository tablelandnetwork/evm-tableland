import { ethers, upgrades } from "hardhat";

const testnetProxy = "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C";
const stagingProxy = "0x847645b7dAA32eFda757d3c10f1c82BFbB7b41D0";

async function main() {
  const Registry = await ethers.getContractFactory("TablelandTables");
  await upgrades.upgradeProxy(testnetProxy, Registry, {
    kind: "uups",
  });
  console.log("Testnet proxy upgraded");

  await upgrades.upgradeProxy(stagingProxy, Registry, {
    kind: "uups",
  });
  console.log("Staging proxy upgraded");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
