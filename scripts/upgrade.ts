import { ethers, upgrades } from "hardhat";

const proxyAddress = "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C";

async function main() {
  const Registry = await ethers.getContractFactory("TablelandTables");
  await upgrades.upgradeProxy(proxyAddress, Registry, {
    kind: "uups",
  });
  console.log("Proxy upgraded");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
