# @tableland/evm

[![GitHub license](https://img.shields.io/github/license/tablelandnetwork/evm-tableland.svg)](./LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/tablelandnetwork/evm-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/evm-tableland.svg)](https://github.com/tablelandnetwork/evm-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

![Tests](https://github.com/tablelandnetwork/evm-tableland/workflows/Test/badge.svg)

> Tableland Tables EVM contracts and client components

# Table of Contents

- [Background](#background)
- [Development](#development)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

This is the Tableland Tables EVM contracts and client components.

# Development

## Building the client

You can build the Typescript client locally:

```shell
npm install
npx hardhat compile
npm run build
```

## Testing

Run the test suite:

```shell
npm test
```

Test with gas reporting:

```shell
REPORT_GAS=true npx hardhat test
```

## Deploying

Deployments are handled on a per-network basis:

```shell
npx hardhat run scripts/deploy.ts --network optimism
```

Network names may include context for the target Tableland network:

```shell
npx hardhat run scripts/deploy.ts --network optimism-kovan-staging
```

Where `optimism-kovan-staging` indicates a deployment to the Optimism Kovan testnet for the Tableland staging network.

Refer to the `proxies` entry in `hardhat.config.js` for the list of current deployments.

## Upgrading

The Tableland contracts are currently upgradeable at this early stage of development. Upgrades are handled much like deployments:

```shell
npx hardhat run scripts/upgrade.ts --network optimism
```

Upgrading on a network only works if a previous deployment already exists, referenced by a corresponding proxy address in the `proxies` entry in `hardhat.config.js`.

## Extacting the ABI and Bytecode

You can you grab the assets you need by compiling and then using some `jq` magic:

### ABI

```shell
cat artifacts/contracts/TablelandTables.sol/TablelandTables.json | jq '.abi' > abi.json
```

### Bytecode

```shell
cat artifacts/contracts/TablelandTables.sol/TablelandTables.json | jq -r '.bytecode' > bytecode.bin
```

### Generate the Go client!

You can use the above `abi.json` to build the Go client:

```shell
mkdir gobuild
abigen --abi ./abi.json --bin ./bytecode.bin --pkg contracts --out gobuild/Registry.go
```

## Etherscan verification

To perform Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Goerli:

```shell
npx hardhat run scripts/deploy.ts --network ethereum-goerli
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify DEPLOYED_CONTRACT_ADDRESS --network ethereum-goerli
```

## Speedier tests

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
