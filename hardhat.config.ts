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
import "hardhat-dependency-compiler";
import "solidity-coverage";
import { proxies, ProxyAddresses } from "./proxies";

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
  dependencyCompiler: {
    paths: ["contracts/utils/SQLHelpers.sol", "contracts/utils/URITemplate.sol"],
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

      // arbitrum
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumGoerli",
        chainId: 421613,
        urls: {
          apiURL: "https://goerli-rollup-explorer.arbiscan.io/api", // this may not be correct
          browserURL: "https://goerli-rollup-explorer.arbitrum.io/",
        },
      },
    ],
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
    "optimism-goerli": {
      url: `https://opt-goerli.g.alchemy.com/v2/${
        process.env.OPTIMISM_GOERLI_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_GOERLI_PRIVATE_KEY]
          : [],
    },
    "arbitrum-goerli": {
      url: `https://arb-goerli.g.alchemy.com/v2/${
        process.env.ARBITRUM_GOERLI_API_KEY ?? ""
      }`,
      accounts:
        process.env.ARBITRUM_GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.ARBITRUM_GOERLI_PRIVATE_KEY]
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
    "optimism-goerli-staging": {
      url: `https://opt-goerli.g.alchemy.com/v2/${
        process.env.OPTIMISM_GOERLI_STAGING_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_GOERLI_STAGING_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_GOERLI_STAGING_PRIVATE_KEY]
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
    ethereum: "https://testnet.tableland.network/chain/1/tables/",
    optimism: "https://testnet.tableland.network/chain/10/tables/",
    polygon: "https://testnet.tableland.network/chain/137/tables/",
    // testnets
    "ethereum-goerli": "https://testnet.tableland.network/chain/5/tables/",
    "optimism-kovan": "https://testnet.tableland.network/chain/69/tables/",
    "optimism-goerli": "https://testnet.tableland.network/chain/420/tables/",
    "arbitrum-goerli": "https://testnet.tableland.network/chain/421613/tables/", // nitro testnet
    "polygon-mumbai": "https://testnet.tableland.network/chain/80001/tables/",
    // devnets
    "optimism-kovan-staging":
      "https://staging.tableland.network/chain/69/tables/",
    "optimism-goerli-staging":
      "https://staging.tableland.network/chain/420/tables/",
    localhost: "http://localhost:8080/chain/31337/tables/",
  },
  proxies,
};

interface TablelandNetworkConfig {
  // mainnets
  ethereum: string;
  optimism: string;
  polygon: string;

  // testnets
  "ethereum-goerli": string;
  "optimism-kovan": string;
  "optimism-goerli": string;
  "arbitrum-goerli": string;
  "polygon-mumbai": string;

  // devnets
  "optimism-kovan-staging": string;
  "optimism-goerli-staging": string;
  localhost: string; // hardhat
}

declare module "hardhat/types/config" {
  // eslint-disable-next-line no-unused-vars
  interface HardhatUserConfig {
    baseURIs: TablelandNetworkConfig;
    proxies: ProxyAddresses;
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
