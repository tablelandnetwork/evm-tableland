export interface TablelandNetworkConfig {
  // tableland testnet mainnets
  ethereum: string;
  optimism: string;
  arbitrum: string;
  polygon: string;
  // tableland testnet testnets
  "ethereum-goerli": string;
  "optimism-goerli": string;
  "arbitrum-goerli": string;
  "polygon-mumbai": string;
  // tableland staging testnets
  "optimism-goerli-staging": string;
  // local tableland
  localhost: string; // hardhat
}

export const proxies: TablelandNetworkConfig = {
  ethereum: "0x012969f7e3439a9B04025b5a049EB9BAD82A8C12",
  optimism: "0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6",
  arbitrum: "",
  polygon: "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA",
  "ethereum-goerli": "0xDA8EA22d092307874f30A1F277D1388dca0BA97a",
  "optimism-goerli": "0xC72E8a7Be04f2469f8C2dB3F1BdF69A7D516aBbA",
  "arbitrum-goerli": "0x033f69e8d119205089Ab15D340F5b797732f646b",
  "polygon-mumbai": "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68",
  "optimism-goerli-staging": "0xfe79824f6E5894a3DD86908e637B7B4AF57eEE28",
  localhost: "",
};

export const baseURIs: TablelandNetworkConfig = {
  ethereum: "https://testnet.tableland.network/chain/1/tables/",
  optimism: "https://testnet.tableland.network/chain/10/tables/",
  arbitrum: "https://testnet.tableland.network/chain/42161/tables/",
  polygon: "https://testnet.tableland.network/chain/137/tables/",
  "ethereum-goerli": "https://testnet.tableland.network/chain/5/tables/",
  "optimism-goerli": "https://testnet.tableland.network/chain/420/tables/",
  "arbitrum-goerli": "https://testnet.tableland.network/chain/421613/tables/",
  "polygon-mumbai": "https://testnet.tableland.network/chain/80001/tables/",
  "optimism-goerli-staging":
    "https://staging.tableland.network/chain/420/tables/",
  localhost: "http://localhost:8080/chain/31337/tables/",
};
