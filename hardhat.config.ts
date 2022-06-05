import * as dotenv from "dotenv";

import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
    only: [],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  networks: {
    "optimism-kovan": {
      url: `https://opt-kovan.g.alchemy.com/v2/${
        process.env.API_KEY_OPT_KOVAN ?? ""
      }`,
      accounts:
        process.env.OPT_KOVAN_PK !== undefined
          ? [process.env.OPT_KOVAN_PK]
          : [],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${
        process.env.API_KEY_ETH_GOERLI ?? ""
      }`,
      accounts:
        process.env.ETH_GOERLI_PK !== undefined
          ? [process.env.ETH_GOERLI_PK]
          : [],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${
        process.env.API_KEY_POLY_MUMBAI ?? ""
      }`,
      accounts:
        process.env.POLY_MUMBAI_PK !== undefined
          ? [process.env.POLY_MUMBAI_PK]
          : [],
    },
    hardhat: {
      mining: {
        auto: false,
        interval: [100, 3000],
      },
    },
  },
  baseURIs: {
    "optimism-kovan": "https://testnet.tableland.network/tables/",
    goerli: "https://testnet.tableland.network/tables/",
    mumbai: "https://testnet.tableland.network/tables/",
    localhost: "http://localhost:8080/tables/",
  },
};

type BaseURIConfig = {
  [networkName: string]: string;
};

declare module "hardhat/types/config" {
  // eslint-disable-next-line no-unused-vars
  interface HardhatUserConfig {
    baseURIs?: BaseURIConfig;
  }
}

declare module "hardhat/types/runtime" {
  // eslint-disable-next-line no-unused-vars
  interface HardhatRuntimeEnvironment {
    baseURI?: string;
  }
}

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  const uris = hre.userConfig.baseURIs;
  hre.baseURI = uris ? uris[hre.network.name] : undefined;
});

export default config;
