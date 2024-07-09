import * as dotenv from "dotenv";

import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";
import { baseURIs, proxies, TablelandNetworkConfig } from "./network";

dotenv.config();

const homestead = {
  url: `https://eth-mainnet.alchemyapi.io/v2/${
    process.env.ETHEREUM_API_KEY ?? ""
  }`,
  accounts:
    process.env.ETHEREUM_PRIVATE_KEY !== undefined
      ? [process.env.ETHEREUM_PRIVATE_KEY]
      : [],
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 9999999,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: "none",
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
      sepolia: process.env.ETHERSCAN_API_KEY || "",

      // optimism
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",
      optimisticSepolia: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",

      // arbitrum
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumNova: process.env.ARBISCAN_NOVA_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",

      // base
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "optimisticSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
      {
        network: "arbitrumNova",
        chainId: 42170,
        urls: {
          apiURL: "https://api-nova.arbiscan.io/api",
          browserURL: "https://nova.arbiscan.io/",
        },
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
  networks: {
    // mainnets
    mainnet: homestead,
    homestead,
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${
        process.env.OPTIMISM_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_PRIVATE_KEY]
          : [],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${
        process.env.ARBITRUM_API_KEY ?? ""
      }`,
      accounts:
        process.env.ARBITRUM_PRIVATE_KEY !== undefined
          ? [process.env.ARBITRUM_PRIVATE_KEY]
          : [],
    },
    "arbitrum-nova": {
      url: `https://skilled-yolo-mountain.nova-mainnet.discover.quiknode.pro/${
        process.env.ARBITRUM_NOVA_API_KEY ?? ""
      }`,
      accounts:
        process.env.ARBITRUM_NOVA_PRIVATE_KEY !== undefined
          ? [process.env.ARBITRUM_NOVA_PRIVATE_KEY]
          : [],
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${
        process.env.BASE_API_KEY ?? ""
      }`,
      accounts:
        process.env.BASE_PRIVATE_KEY !== undefined
          ? [process.env.BASE_PRIVATE_KEY]
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
    filecoin: {
      url: `https://rpc.ankr.com/filecoin/${
        process.env.FILECOIN_API_KEY ?? ""
      }`,
      accounts:
        process.env.FILECOIN_PRIVATE_KEY !== undefined
          ? [process.env.FILECOIN_PRIVATE_KEY]
          : [],
    },
    // testnets
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${
        process.env.ETHEREUM_SEPOLIA_API_KEY ?? ""
      }`,
      accounts:
        process.env.ETHEREUM_SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.ETHEREUM_SEPOLIA_PRIVATE_KEY]
          : [],
    },
    "optimism-sepolia": {
      url: `https://opt-sepolia.g.alchemy.com/v2/${
        process.env.OPTIMISM_SEPOLIA_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_SEPOLIA_PRIVATE_KEY]
          : [],
    },
    "arbitrum-sepolia": {
      url: `https://arb-sepolia.g.alchemy.com/v2/${
        process.env.ARBITRUM_SEPOLIA_API_KEY ?? ""
      }`,
      accounts:
        process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY]
          : [],
    },
    "base-sepolia": {
      url: `https://base-sepolia.g.alchemy.com/v2/${
        process.env.BASE_SEPOLIA_API_KEY ?? ""
      }`,
      accounts:
        process.env.BASE_SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.BASE_SEPOLIA_PRIVATE_KEY]
          : [],
    },
    "polygon-amoy": {
      url: `https://polygon-amoy.g.alchemy.com/v2/${
        process.env.POLYGON_AMOY_API_KEY ?? ""
      }`,
      accounts:
        process.env.POLYGON_AMOY_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_AMOY_PRIVATE_KEY]
          : [],
    },
    "filecoin-calibration": {
      url: `https://api.calibration.node.glif.io/rpc/v1${
        process.env.FILECOIN_CALIBRATION_API_KEY ?? ""
      }`,
      accounts:
        process.env.FILECOIN_CALIBRATION_PRIVATE_KEY !== undefined
          ? [process.env.FILECOIN_CALIBRATION_PRIVATE_KEY]
          : [],
    },
    // devnets
    "optimism-sepolia-staging": {
      url: `https://opt-sepolia.g.alchemy.com/v2/${
        process.env.OPTIMISM_SEPOLIA_STAGING_API_KEY ?? ""
      }`,
      accounts:
        process.env.OPTIMISM_SEPOLIA_STAGING_PRIVATE_KEY !== undefined
          ? [process.env.OPTIMISM_SEPOLIA_STAGING_PRIVATE_KEY]
          : [],
    },
    hardhat: {
      mining: {
        auto: !(process.env.HARDHAT_DISABLE_AUTO_MINING === "true"),
        interval: [100, 3000],
      },
      allowUnlimitedContractSize:
        process.env.HARDHAT_UNLIMITED_CONTRACT_SIZE === "true",
    },
  },
  baseURIs,
  proxies,
};

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
