require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

const { Wallet } = require("ethers");

// Official MST Testnet defaults. The environment variable may override the
// RPC URL; the chain ID is fixed by the MST Testnet.
const MST_TESTNET_RPC_URL = "https://testnetrpc.mstblockchain.com";
const MST_TESTNET_CHAIN_ID = 91562037;

function readDeployerPrivateKey() {
  const raw = process.env.MST_TESTNET_DEPLOYER_PRIVATE_KEY;
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

const mstTestnetPrivateKey = readDeployerPrivateKey();

const networks = {
  localhost: {
    url: process.env.LOCAL_HARDHAT_RPC_URL || "http://127.0.0.1:8545",
  },
  mstTestnet: {
    url: process.env.MST_TESTNET_RPC_URL || MST_TESTNET_RPC_URL,
    chainId: MST_TESTNET_CHAIN_ID,
    accounts: mstTestnetPrivateKey ? [mstTestnetPrivateKey] : [],
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
