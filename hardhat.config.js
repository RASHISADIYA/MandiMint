require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

const { Wallet } = require("ethers");

// Official MST Testnet defaults. The environment variable may override the
// RPC URL; the chain ID is fixed by the MST Testnet.
const MST_TESTNET_RPC_URL = "https://testnetrpc.mstblockchain.com";
const MST_TESTNET_CHAIN_ID = 91562037;

// Official MST Mainnet defaults.
const MST_MAINNET_RPC_URL = "https://mariorpc.mstblockchain.com/";
const MST_MAINNET_CHAIN_ID = 4646;

function readDeployerPrivateKey(envKey = "MST_TESTNET_DEPLOYER_PRIVATE_KEY") {
  const raw = process.env[envKey];
  if (!raw || raw.trim().length === 0) {
    return null;
  }
  const candidate = raw.trim();
  try {
    // Format and range check only. The key is never logged or persisted.
    new Wallet(candidate);
  } catch {
    return null;
  }
  return candidate;
}

const mstTestnetPrivateKey = readDeployerPrivateKey("MST_TESTNET_DEPLOYER_PRIVATE_KEY");
const mstMainnetPrivateKey = readDeployerPrivateKey("MST_MAINNET_DEPLOYER_PRIVATE_KEY");

const networks = {
  localhost: {
    url: process.env.LOCAL_HARDHAT_RPC_URL || "http://127.0.0.1:8545",
  },
  mstTestnet: {
    url: process.env.MST_TESTNET_RPC_URL || MST_TESTNET_RPC_URL,
    chainId: MST_TESTNET_CHAIN_ID,
    accounts: mstTestnetPrivateKey ? [mstTestnetPrivateKey] : [],
  },
  mstMainnet: {
    url: process.env.MST_MAINNET_RPC_URL || MST_MAINNET_RPC_URL,
    chainId: MST_MAINNET_CHAIN_ID,
    accounts: mstMainnetPrivateKey ? [mstMainnetPrivateKey] : [],
  },
};

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks,
};
