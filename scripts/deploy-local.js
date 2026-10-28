const { ethers, network } = require("hardhat");

async function main() {
  if (network.name !== "localhost") {
    throw new Error("Local deployment must use the localhost network.");
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No local deployer account is available.");
  }

  const liveNetwork = await ethers.provider.getNetwork();
  const MandiMint = await ethers.getContractFactory("MandiMint");
  const mandiMint = await MandiMint.deploy();
  await mandiMint.waitForDeployment();

  const address = await mandiMint.getAddress();

  console.log(`Deployed MandiMint to local Hardhat (chain ID ${liveNetwork.chainId}).`);
  console.log(`Deployer and initial manager: ${deployer.address}`);
  console.log(`Contract address: ${address}`);
  console.log("");
  console.log("Use these values in frontend/.env.local:");
  console.log(`VITE_MST_TESTNET_CHAIN_ID=${liveNetwork.chainId}`);
  console.log("VITE_MST_TESTNET_RPC_URL=http://localhost:5173/hardhat-rpc");
  console.log(`VITE_MANDIMINT_CONTRACT_ADDRESS=${address}`);
  console.log("");
  console.log("Authorize a logged-in embedded wallet as a local manager:");
  console.log(
    `MANAGER_ADDRESS=0x... MANDIMINT_CONTRACT_ADDRESS=${address} npm run authorize:local`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
