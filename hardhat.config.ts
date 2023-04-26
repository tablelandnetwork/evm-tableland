import * as dotenv from "dotenv";

import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
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
      optimisticGoerli: process.env.OPTIMISM_ETHERSCAN_API_KEY || "",

      // arbitrum
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumNova: process.env.ARBISCAN_NOVA_API_KEY || "",
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",

      // polygon
      polygon: process.env.POLYSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumNova",
        chainId: 42170,
        urls: {
          apiURL: "https://api-nova.arbiscan.io/api",
          browserURL: "https://nova.arbiscan.io/",
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
    matic: {
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
    maticmum: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${
        process.env.POLYGON_MUMBAI_API_KEY ?? ""
      }`,
      accounts:
        process.env.POLYGON_MUMBAI_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_MUMBAI_PRIVATE_KEY]
          : [],
    },
    "filecoin-hyperspace": {
      url: `https://rpc.ankr.com/filecoin_testnet/${
        process.env.FILECOIN_HYPERSPACE_API_KEY ?? ""
      }`,
      accounts:
        process.env.FILECOIN_HYPERSPACE_PRIVATE_KEY !== undefined
          ? [process.env.FILECOIN_HYPERSPACE_PRIVATE_KEY]
          : [],
    },
    // devnets
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
