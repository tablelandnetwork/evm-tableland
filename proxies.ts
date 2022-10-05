export interface ProxyAddresses {
  [key: string]: string;
}

export const proxies: ProxyAddresses = {
  // tableland testnet mainnets
  ethereum: "0x012969f7e3439a9B04025b5a049EB9BAD82A8C12",
  optimism: "0xfad44BF5B843dE943a09D4f3E84949A11d3aa3e6",
  polygon: "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA",
  // tableland testnet testnets
  "ethereum-goerli": "0xDA8EA22d092307874f30A1F277D1388dca0BA97a",
  "optimism-goerli": "0xC72E8a7Be04f2469f8C2dB3F1BdF69A7D516aBbA",
  "arbitrum-goerli": "0x033f69e8d119205089Ab15D340F5b797732f646b",
  "polygon-mumbai": "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68",
  // tableland staging testnets
  "optimism-goerli-staging": "0xfe79824f6E5894a3DD86908e637B7B4AF57eEE28",
  localhost: "",
};
