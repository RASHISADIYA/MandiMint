const { ethers, network } = require("hardhat");
const { isAddress } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`\n=== MandiMint Manager Authorization ===`);
  console.log(`Network: ${network.name}`);

  let contractAddress = process.env.MANDIMINT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    const recordFile = path.resolve(
      __dirname,
      "..",
      "deployments",
      network.name === "localhost" ? "localhost" : "mstTestnet",
      "MandiMint.json"
    );
    if (fs.existsSync(recordFile)) {
      try {
        const record = JSON.parse(fs.readFileSync(recordFile, "utf8"));
        contractAddress = record.address;
      } catch {}
    }
  }

  // Fallback to verified address
  if (!contractAddress) {
    contractAddress = "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
  }

  const managerAddress = process.env.MANAGER_ADDRESS || process.argv[2];

  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: "${contractAddress}"`);
  }
  if (!managerAddress || !isAddress(managerAddress)) {
    throw new Error(
      `Please provide a valid manager address via MANAGER_ADDRESS=0x... or as first argument.`
    );
  }

  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error(
      `No signer available. Set MST_TESTNET_DEPLOYER_PRIVATE_KEY in .env before running.`
    );
  }

  console.log(`Signer/Owner:     ${signer.address}`);
  console.log(`Contract:         ${contractAddress}`);
  console.log(`Target Manager:   ${managerAddress}`);

  const contract = await ethers.getContractAt("MandiMint", contractAddress, signer);
  const owner = await contract.owner();

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is not the contract owner (${owner}). Only the contract owner can authorize managers.`
    );
  }

  const alreadyAuthorized = await contract.isManager(managerAddress);
  if (alreadyAuthorized) {
    console.log(`\nAddress ${managerAddress} is ALREADY an authorized manager on-chain.`);
    return;
  }

  console.log(`\nSubmitting setManager transaction...`);
  const tx = await contract.setManager(managerAddress, true);
  console.log(`Transaction submitted: ${tx.hash}`);
  if (network.name === "mstTestnet") {
    console.log(`View on MSTScan: https://testnet.mstscan.com/tx/${tx.hash}`);
  }

  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}!`);
  console.log(`Successfully authorized ${managerAddress} as manager.`);
}

main().catch((err) => {
  console.error("Authorization failed:", err.message || err);
  process.exitCode = 1;
});
