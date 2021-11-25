# eth-storage-bridge

[![GitHub license](https://img.shields.io/github/license/textileio/eth-tableland.svg)](./LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/textileio/eth-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/textileio/eth-tableland.svg)](https://github.com/textileio/eth-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

![Tests](https://github.com/textileio/eth-tableland/workflows/Test/badge.svg)

> On-chain ETH registry and client components for Tableland

# Table of Contents

- [Background](#background)
- [Development](#development)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

This is the proof of concept on-chain ETH registry and client components
for Tableland. This is the first pass, and is subject to wild changes
without notice!

# Development

Get started with installing and building the project:

```shell
npm install
npx hardhard compile
npm run build
```

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Building the client

You can build the Typescript client locally:

```shell
npm install
npx hardhard compile
npm run build
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Rinkeby node URL (e.g., from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network rinkeby scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network rinkeby DEPLOYED_CONTRACT_ADDRESS
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# Maintainers

[@carsonfarmer](https://github.com/carsonfarmer)

# Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021-2022 Textile.io
