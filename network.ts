export interface TablelandNetworkConfig {
  // tableland testnet mainnets
  mainnet: string | number;
  homestead: string | number;
  optimism: string | number;
  arbitrum: string | number;
  "arbitrum-nova": string | number;
  base: string | number;
  polygon: string | number;
  filecoin: string | number;
  // tableland testnet testnets
  sepolia: string | number;
  "optimism-sepolia": string | number;
  "arbitrum-sepolia": string | number;
  "base-sepolia": string | number;
  "polygon-amoy": string | number;
  "filecoin-calibration": string | number;
  // tableland testnet devnets (uncomment when needed for admin)
  // "optimism-sepolia-staging": string | number;
  // local tableland
  localhost: string | number; // hardhat
  "local-tableland": string | number; // hardhat backed by a local validator
}

const homesteadAddr = "0x012969f7e3439a9B04025b5a049EB9BAD82A8C12";

export const proxies: TablelandNetworkConfig = {
  // mainnets
  mainnet: homesteadAddr,
  homestead: homesteadAddr,
  optimism: "0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6",
  arbitrum: "0x9aBd75E8640871A5a20d3B4eE6330a04c962aFfd",
  "arbitrum-nova": "0x1A22854c5b1642760a827f20137a67930AE108d2",
  base: "0x8268F7Aba0E152B3A853e8CB4Ab9795Ec66c2b6B",
  polygon: "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA",
  filecoin: "0x59EF8Bf2d6c102B4c42AEf9189e1a9F0ABfD652d",
  // testnets
  sepolia: "0xc50C62498448ACc8dBdE43DA77f8D5D2E2c7597D",
  "optimism-sepolia": "0x68A2f4423ad3bf5139Db563CF3bC80aA09ed7079",
  "arbitrum-sepolia": "0x223A74B8323914afDC3ff1e5005564dC17231d6e",
  "base-sepolia": "0xA85aAE9f0Aec5F5638E5F13840797303Ab29c9f9",
  "polygon-amoy": "0x170fb206132b693e38adFc8727dCfa303546Cec1",
  "filecoin-calibration": "0x030BCf3D50cad04c2e57391B12740982A9308621",
  // devnets (uncomment when needed for admin)
  // "optimism-sepolia-staging": "0xinternal",
  // localhost is a stand alone node
  localhost: "",
  // local-tableland implies that a validator is also running. the proxy address will always be
  // "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" because of the order of contract deployment
  "local-tableland": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
};

const homesteadURI = "https://tableland.network/api/v1/tables/1/";
const localTablelandURI = "http://localhost:8080/api/v1/tables/31337/";
export const baseURIs: TablelandNetworkConfig = {
  // mainnets
  mainnet: homesteadURI,
  homestead: homesteadURI,
  optimism: "https://tableland.network/api/v1/tables/10/",
  arbitrum: "https://tableland.network/api/v1/tables/42161/",
  "arbitrum-nova": "https://tableland.network/api/v1/tables/42170/",
  base: "https://tableland.network/api/v1/tables/8453/",
  polygon: "https://tableland.network/api/v1/tables/137/",
  filecoin: "https://tableland.network/api/v1/tables/314/",
  // testnets
  sepolia: "https://testnets.tableland.network/api/v1/tables/11155111/",
  "optimism-sepolia":
    "https://testnets.tableland.network/api/v1/tables/11155420/",
  "arbitrum-sepolia":
    "https://testnets.tableland.network/api/v1/tables/421614/",
  "base-sepolia": "https://testnets.tableland.network/api/v1/tables/84532/",
  "polygon-amoy": "https://testnets.tableland.network/api/v1/tables/80002/",
  "filecoin-calibration":
    "https://testnets.tableland.network/api/v1/tables/314159/",
  // devnets (uncomment when needed for admin)
  // "optimism-sepolia-staging":
  //   "https://testnets.tableland.network/api/v1/tables/11155420/",
  // local
  localhost: localTablelandURI,
  "local-tableland": localTablelandURI,
};

// Block polling periods in milliseconds. Takes into account the chain's block
// time, validator block depth, and an additional block for a margin of safety.
// See validator config for more details:
// Mainnets: https://github.com/tablelandnetwork/go-tableland/blob/main/docker/deployed/mainnet/api/config.json
// Testnets: https://github.com/tablelandnetwork/go-tableland/blob/main/docker/deployed/testnet/api/config.json
export const validatorPollingTimeouts: TablelandNetworkConfig = {
  // mainnets
  mainnet: 40_000,
  homestead: 40_000,
  optimism: 10_000,
  arbitrum: 10_000,
  "arbitrum-nova": 10_000,
  base: 10_000,
  polygon: 15_000,
  filecoin: 210_000,
  // testnets
  sepolia: 40_000,
  "optimism-sepolia": 10_000,
  "arbitrum-sepolia": 10_000,
  "base-sepolia": 10_000,
  "polygon-amoy": 15_000,
  "filecoin-calibration": 210_000,
  // devnets (uncomment when needed for admin)
  // "optimism-sepolia-staging": 10_000,
  // local
  localhost: 5_000,
  "local-tableland": 5_000,
};
