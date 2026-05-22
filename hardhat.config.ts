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
    bsc: {
      chainId: 56,
      url: "https://bsc-dataseed.binance.org/",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    eth: {
      chainId: 1,
      url: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
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
    keep: true,
  },
  etherscan: {
    apiKey: {
      polygon: "JT3V5H3AZRFKEBK8W8NGWA7G17AR3IQC2W",
      bsc: "JT3V5H3AZRFKEBK8W8NGWA7G17AR3IQC2W",
      eth: "JT3V5H3AZRFKEBK8W8NGWA7G17AR3IQC2W"
    },
    customChains: [
      {
        network: "eth",
        chainId: 1,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=1",
          browserURL: "https://etherscan.io"
        }
      },
      {
        network: "polygon",
        chainId: 137,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=137",
          browserURL: "https://polygonscan.com"
        }
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=56",
          browserURL: "https://bscscan.com"
        }
      },
    ]
  }
};

export default config;



