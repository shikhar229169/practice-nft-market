/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: "0.8.18",

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {},

    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      blockConfirmations: 3
    }
  },

  namedAccounts: {
    deployer: {
      default: 0
    },

    player: {
      default: 1
    }
  },

  gasReporter: {
    enabled: false
  },

  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },

  mocha: {
    timeout: 300000
  }
};
