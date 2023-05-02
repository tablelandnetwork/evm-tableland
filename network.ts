export interface TablelandNetworkConfig {
  // tableland testnet mainnets
  mainnet: string;
  homestead: string;
  optimism: string;
  arbitrum: string;
  "arbitrum-nova": string;
  matic: string;
  filecoin: string;
  // tableland testnet testnets
  sepolia: string;
  "optimism-goerli": string;
  "arbitrum-goerli": string;
  maticmum: string;
  "filecoin-hyperspace": string;
  // tableland staging testnets
  "optimism-goerli-staging": string;
  // local tableland
  localhost: string; // hardhat
  "local-tableland": string; // hardhat backed by a local validator
}

const homesteadAddr = "0x012969f7e3439a9B04025b5a049EB9BAD82A8C12";

export const proxies: TablelandNetworkConfig = {
  mainnet: homesteadAddr,
  homestead: homesteadAddr,
  optimism: "0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6",
  arbitrum: "0x9aBd75E8640871A5a20d3B4eE6330a04c962aFfd",
  "arbitrum-nova": "0x1A22854c5b1642760a827f20137a67930AE108d2",
  matic: "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA",
  filecoin: "0x59EF8Bf2d6c102B4c42AEf9189e1a9F0ABfD652d",
  sepolia: "0xc50C62498448ACc8dBdE43DA77f8D5D2E2c7597D",
  "optimism-goerli": "0xC72E8a7Be04f2469f8C2dB3F1BdF69A7D516aBbA",
  "arbitrum-goerli": "0x033f69e8d119205089Ab15D340F5b797732f646b",
  maticmum: "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68",
  "filecoin-hyperspace": "0x0B9737ab4B3e5303CB67dB031b509697e31c02d3",
  "optimism-goerli-staging": "0xfe79824f6E5894a3DD86908e637B7B4AF57eEE28",
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
  matic: "https://tableland.network/api/v1/tables/137/",
  filecoin: "https://tableland.network/api/v1/tables/314/",
  // testnets
  sepolia: "https://testnets.tableland.network/api/v1/tables/11155111/",
  "optimism-goerli": "https://testnets.tableland.network/api/v1/tables/420/",
  "arbitrum-goerli": "https://testnets.tableland.network/api/v1/tables/421613/",
  maticmum: "https://testnets.tableland.network/api/v1/tables/80001/",
  "filecoin-hyperspace":
    "https://testnets.tableland.network/api/v1/tables/3141/",
  "optimism-goerli-staging":
    "https://staging.tableland.network/api/v1/tables/420/",
  localhost: localTablelandURI,
  "local-tableland": localTablelandURI,
};
