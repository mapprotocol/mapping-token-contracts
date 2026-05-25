import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "solidity-coverage";
import "hardhat-abi-exporter";
import 'hardhat-deploy';
require('./tasks');

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          "evmVersion": "london"
        }
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {

    Makalu: {
      chainId: 212,
      url:"https://testnet-rpc.maplabs.io",
      zksync: false,
      accounts: process.env.TESTNET_PRIVATE_KEY !== undefined ? [process.env.TESTNET_PRIVATE_KEY] : [],
    },
    Map: {
      chainId: 22776,
      url: "https://rpc.maplabs.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Polygon: {
      chainId: 137,
      url: "https://rpc-mainnet.matic.quiknode.pro",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Bsc: {
      chainId: 56,
      url: "https://bsc-dataseed.binance.org/",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Eth: {
      chainId: 1,
      url: "https://eth-mainnet.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Merlin: {
      url: `https://rpc.merlinchain.io`,
      chainId : 4200,
      gasPrice: 50000000,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Sepolia: {
      url: `https://1rpc.io/sepolia`,
      chainId : 11155111,
      accounts: process.env.TESTNET_PRIVATE_KEY !== undefined ? [process.env.TESTNET_PRIVATE_KEY] : [],
    }

  },
  // sourcify: {
  //   enabled: true,
  //   // Optional: specify a different Sourcify server
  //   apiUrl: "https://sourcify.dev/server",
  //   // Optional: specify a different Sourcify repository
  //   browserUrl: "https://repo.sourcify.dev",
  // },
  etherscan: {
    // Etherscan V2 multichain API: one key covers all supported chains
    // (Eth, Polygon, BSC, Arbitrum, Base, Op, ...). hardhat-verify reads
    // the chainId from each network's config automatically.
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: ["^contracts/"],
  }
};

export default config;



