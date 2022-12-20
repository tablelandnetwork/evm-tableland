export interface TablelandNetworkConfig {
  // tableland testnet mainnets
  mainnet: string;
  homestead: string;
  optimism: string;
  arbitrum: string;
  matic: string;
  // tableland testnet testnets
  goerli: string;
  "optimism-goerli": string;
  "arbitrum-goerli": string;
  maticmum: string;
  // tableland staging testnets
  "optimism-goerli-staging": string;
  // local tableland
  localhost: string; // hardhat
  "local-tableland": string; // hardhat backed by a local validator
}

const homesteadAddr = "0x012969f7e3439a9B04025b5a049EB9BAD82A8C12";
const localTablelandAddr = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
export const proxies: TablelandNetworkConfig = {
  mainnet: homesteadAddr,
  homestead: homesteadAddr,
  optimism: "0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6",
  arbitrum: "0x9aBd75E8640871A5a20d3B4eE6330a04c962aFfd",
  matic: "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA",
  goerli: "0xDA8EA22d092307874f30A1F277D1388dca0BA97a",
  "optimism-goerli": "0xC72E8a7Be04f2469f8C2dB3F1BdF69A7D516aBbA",
  "arbitrum-goerli": "0x033f69e8d119205089Ab15D340F5b797732f646b",
  maticmum: "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68",
  "optimism-goerli-staging": "0xfe79824f6E5894a3DD86908e637B7B4AF57eEE28",
  localhost: localTablelandAddr,
  "local-tableland": localTablelandAddr,
};

const homesteadURI = "https://tableland.network/api/v1/tables/1/";
const localTablelandURI = "http://localhost:8080/api/v1/tables/31337/";
export const baseURIs: TablelandNetworkConfig = {
  // mainnets
  mainnet: homesteadURI,
  homestead: homesteadURI,
  optimism: "https://tableland.network/api/v1/tables/10/",
  arbitrum: "https://tableland.network/api/v1/tables/42161/",
  matic: "https://tableland.network/api/v1/tables/137/",
  // testnets
  goerli: "https://testnets.tableland.network/api/v1/tables/5/",
  "optimism-goerli": "https://testnets.tableland.network/api/v1/tables/420/",
  "arbitrum-goerli": "https://testnets.tableland.network/api/v1/tables/421613/",
  maticmum: "https://testnets.tableland.network/api/v1/tables/80001/",
  "optimism-goerli-staging":
    "https://staging.tableland.network/api/v1/tables/420/",
  localhost: localTablelandURI,
  "local-tableland": localTablelandURI,
};
