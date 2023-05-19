import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-web3";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },  
  networks: {
    hardhat: {},
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.API_KEY as string}`,
      accounts: [`${process.env.PKEY as string}`],
    },
    bscTestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545` ,
      accounts: [`${process.env.PKEY as string}`],
    },
    astar: {
      url: `https://astar.api.onfinality.io/public`,
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: `${process.env.SCAN_API as string}`,
    },
  },
  defaultNetwork: "hardhat",
};

export default config;
