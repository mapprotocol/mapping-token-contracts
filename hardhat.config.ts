import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import 'hardhat-dependency-compiler'
// import "@nomicfoundation/hardhat-verify";
import 'hardhat-storage-layout';
import "hardhat-gas-reporter";
import "solidity-coverage";
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
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Map: {
      chainId: 22776,
      url: "https://rpc.maplabs.io",
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
    Polygon: {
      chainId: 137,
      url: "https://rpc-mainnet.matic.quiknode.pro",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    MaticTest: {
      url: `https://polygon-mumbai.blockpi.network/v1/rpc/public`,
      chainId : 80001,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    Merlin: {
      url: `https://rpc.merlinchain.io`,
      chainId : 4200,
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },




    Bevm: {
      url: `https://rpc-canary-2.bevm.io/`,
      chainId : 1501,
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },

    Gnosis: {
      url: `https://1rpc.io/gnosis`,
          chainId : 100,
          accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },

    Sepolia: {
      url: `https://1rpc.io/sepolia`,
      chainId : 11155111,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Holesky: {
      url: `https://1rpc.io/holesky`,
      chainId : 17000,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

  },
  // sourcify: {
  //   enabled: true,
  //   // Optional: specify a different Sourcify server
  //   apiUrl: "https://sourcify.dev/server",
  //   // Optional: specify a different Sourcify repository
  //   browserUrl: "https://repo.sourcify.dev",
  // },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
    ],
  },
  etherscan: {
    apiKey: {
      polygon: "NMW25E1J3FB2TN8SYWN19UXC5FN8T4K7IG",
      MaticTest: "JT3V5H3AZRFKEBK8W8NGWA7G17AR3IQC2W"
    },
    customChains: [
      {
        network: "polygon",
        chainId: 137,
        urls: {
          apiURL: "https://api.polygonscan.com/api",
          browserURL: "https://api.polygonscan.com"
        }
      },
      {
        network: "MaticTest",
        chainId: 80001,
        urls: {
          apiURL: "https://api-testnet.polygonscan.com/api",
          browserURL: "https://mumbai.polygonscan.com/",
        },
      },
    ]
  }
};

export default config;




