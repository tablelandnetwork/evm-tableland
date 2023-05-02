# @tableland/evm

[![GitHub license](https://img.shields.io/github/license/tablelandnetwork/evm-tableland.svg)](./LICENSE)
[![Release](https://img.shields.io/github/release/tablelandnetwork/evm-tableland.svg)](https://github.com/tablelandnetwork/evm-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)
[![Test](https://github.com/tablelandnetwork/evm-tableland/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/tablelandnetwork/evm-tableland/actions/workflows/test.yml)

> Tableland Tables EVM contracts and client components

# Table of Contents

- [Background](#background)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

# Background

This is the Tableland Tables EVM contracts and client components.

## Currently supported chains

| Chain               | Chain ID | Contract                                   |
| ------------------- | -------- | ------------------------------------------ |
| homestead           | 1        | 0x012969f7e3439a9B04025b5a049EB9BAD82A8C12 |
| optimism            | 10       | 0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6 |
| arbitrum            | 42161    | 0x9aBd75E8640871A5a20d3B4eE6330a04c962aFfd |
| arbitrum-nova       | 42170    | 0x1A22854c5b1642760a827f20137a67930AE108d2 |
| matic               | 137      | 0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA |
| filecoin            | 314      | 0x59EF8Bf2d6c102B4c42AEf9189e1a9F0ABfD652d |
| sepolia             | 11155111 | 0xc50C62498448ACc8dBdE43DA77f8D5D2E2c7597D |
| optimism-goerli     | 420      | 0xC72E8a7Be04f2469f8C2dB3F1BdF69A7D516aBbA |
| arbitrum-goerli     | 421613   | 0x033f69e8d119205089Ab15D340F5b797732f646b |
| maticmum            | 80001    | 0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68 |
| filecoin-hyperspace | 3141     | 0x0B9737ab4B3e5303CB67dB031b509697e31c02d3 |

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
npx hardhat run scripts/deploy.ts --network optimism-goerli-staging
```

Where `optimism-goerli-staging` indicates a deployment to the Optimism Goerli testnet for the Tableland staging network.

Refer to `proxies` in `network.ts` for the list of current deployments.

## Upgrading

The Tableland contracts are currently upgradeable at this early stage of development. Upgrades are handled much like deployments:

```shell
npx hardhat run scripts/upgrade.ts --network optimism
```

Upgrading on a network only works if a previous deployment already exists, referenced by proxy address in `network.ts`.

## Extracting the ABI and Bytecode

You can grab the assets you need by compiling and then using some `jq` magic:

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

To perform Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Sepolia:

```shell
npx hardhat run scripts/deploy.ts --network ethereum-sepolia
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify DEPLOYED_CONTRACT_ADDRESS --network ethereum-sepolia
```

## Speedier tests

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
