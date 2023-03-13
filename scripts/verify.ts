import { run, network, proxy } from "hardhat";

async function main() {
  console.log(`\nVerifying on '${network.name}'...`);

  // Ensure deployments
  if (proxy === undefined || proxy === "") {
    throw Error(`no proxy entry for '${network.name}'`);
  }

  // Verify proxy and implementation
  // This will also link the proxy to the implementation in the explorer UI
  await run("verify:verify", {
    address: proxy,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
