import * as dotenv from "dotenv";

import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
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
    apiKey: {
      // ethereum
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",

      // optimism
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      optimisticKovan: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYSCAN_API_KEY || "",
    },
  },
  networks: {
    // mainnets
    ethereum: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${
        process.env.ETHEREUM_API_KEY ?? ""
      }`,
      accounts:
        process.env.ETHEREUM_PRIVATE_KEY !== undefined
          ? [process.env.ETHEREUM_PRIVATE_KEY]
          : [],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${
        process.env.OPTIMISM_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_PRIVATE_KEY]
          : [],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${
        process.env.POLYGON_API_KEY ?? ""
      }`,
      accounts:
        process.env.POLYGON_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_PRIVATE_KEY]
          : [],
    },
    // testnets
    "ethereum-goerli": {
      url: `https://eth-goerli.alchemyapi.io/v2/${
        process.env.ETHEREUM_GOERLI_API_KEY ?? ""
      }`,
      accounts:
        process.env.ETHEREUM_GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.ETHEREUM_GOERLI_PRIVATE_KEY]
          : [],
    },
    "optimism-kovan": {
      url: `https://opt-kovan.g.alchemy.com/v2/${
        process.env.OPTIMISM_KOVAN_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_KOVAN_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_KOVAN_PRIVATE_KEY]
          : [],
    },
    "polygon-mumbai": {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${
        process.env.POLYGON_MUMBAI_API_KEY ?? ""
      }`,
      accounts:
        process.env.POLYGON_MUMBAI_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_MUMBAI_PRIVATE_KEY]
          : [],
    },
    // devnets
    "optimism-kovan-staging": {
      url: `https://opt-kovan.g.alchemy.com/v2/${
        process.env.OPTIMISM_KOVAN_STAGING_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_KOVAN_STAGING_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_KOVAN_STAGING_PRIVATE_KEY]
          : [],
    },
    "optimism-kovan-staging-sqlite": {
      url: `https://opt-kovan.g.alchemy.com/v2/${
        process.env.OPTIMISM_KOVAN_STAGING_SQLITE_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_KOVAN_STAGING_SQLITE_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_KOVAN_STAGING_SQLITE_PRIVATE_KEY]
          : [],
    },
    hardhat: {
      mining: {
        auto: !(process.env.HARDHAT_DISABLE_AUTO_MINING === "true"),
        interval: [100, 3000],
      },
    },
  },
  baseURIs: {
    // mainnets
    ethereum: "https://tableland.network/chain/1/tables/",
    optimism: "https://tableland.network/chain/10/tables/",
    polygon: "https://tableland.network/chain/137/tables/",
    // testnets
    "ethereum-rinkeby": "",
    "ethereum-goerli": "https://testnetv2.tableland.network/chain/5/tables/",
    "optimism-kovan": "https://testnetv2.tableland.network/chain/69/tables/",
    "polygon-mumbai": "https://testnetv2.tableland.network/chain/80001/tables/",
    // devnets
    "ethereum-rinkeby-staging": "",
    "optimism-kovan-staging":
      "https://staging.tableland.network/chain/69/tables/",
    "optimism-kovan-staging-sqlite":
      "https://staging-sqlite.tableland.network/chain/69/tables/",
    localhost: "http://localhost:8080/chain/31337/tables/",
  },
  proxies: {
    // tableland mainnet mainnets
    ethereum: "",
    optimism: "",
    polygon: "",
    // tableland testnet testnets
    "ethereum-rinkeby": "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C", // deprecating: do not upgrade!
    "ethereum-goerli": "0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25",
    "optimism-kovan": "0xf9C3530C03D335a00163382366a72cc1Ebbd39fF",
    "polygon-mumbai": "0x70364D26743851d4FE43eCb065811402D06bf4AD",
    // tableland staging testnets
    "ethereum-rinkeby-staging": "0x847645b7dAA32eFda757d3c10f1c82BFbB7b41D0", // deprecating: do not upgrade!
    "optimism-kovan-staging": "0x322F01e81c38B4211529f334864fA630F6aeA408",
    "optimism-kovan-staging-sqlite":
      "0x2b51D72F210A96B6aB8EfB02dF8802363dcC83Dd",
    localhost: "",
  },
};

interface TablelandNetworkConfig {
  // mainnets
  ethereum: string;
  optimism: string;
  polygon: string;

  // testnets
  "ethereum-rinkeby": string; // deprecating
  "ethereum-goerli": string;
  "optimism-kovan": string;
  "polygon-mumbai": string;

  // devnets
  "ethereum-rinkeby-staging": string; // deprecating
  "optimism-kovan-staging": string;
  "optimism-kovan-staging-sqlite": string;
  localhost: string; // hardhat
}

declare module "hardhat/types/config" {
  // eslint-disable-next-line no-unused-vars
  interface HardhatUserConfig {
    baseURIs: TablelandNetworkConfig;
    proxies: TablelandNetworkConfig;
  }
}

declare module "hardhat/types/runtime" {
  // eslint-disable-next-line no-unused-vars
  interface HardhatRuntimeEnvironment {
    baseURI: string;
    proxy: string;
  }
}

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  // Get base URI for user-selected network
  const uris = hre.userConfig.baseURIs as any;
  hre.baseURI = uris[hre.network.name];

  // Get proxy address for user-selected network
  const proxies = hre.userConfig.proxies as any;
  hre.proxy = proxies[hre.network.name];
});

export default config;
