export interface ProxyAddresses {
  [key: string]: string;
}

export const proxies: ProxyAddresses = {
  // tableland testnet mainnets
  ethereum: "",
  optimism: "",
  polygon: "",
  // tableland testnet testnets
  "ethereum-goerli": "0xDA8EA22d092307874f30A1F277D1388dca0BA97a",
  "optimism-kovan": "0xf2C9Fc73884A9c6e6Db58778176Ab67989139D06",
  "optimism-goerli": "",
  "arbitrum-goerli": "",
  "polygon-mumbai": "0x4b48841d4b32C4650E4ABc117A03FE8B51f38F68",
  // tableland staging testnets
  "optimism-kovan-staging": "0x7E57BaA6724c7742de6843094002c4e58FF6c7c3",
  "optimism-goerli-staging": "",
  localhost: "",
};
