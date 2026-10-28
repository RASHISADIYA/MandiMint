const { ethers, network } = require("hardhat");
const { isAddress } = require("ethers");

async function main() {
  if (network.name !== "localhost") {
    throw new Error("Manager authorization must use the localhost network.");
  }

  const contractAddress = process.env.MANDIMINT_CONTRACT_ADDRESS;
  const managerAddress = process.env.MANAGER_ADDRESS;

  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error("MANDIMINT_CONTRACT_ADDRESS must be a valid contract address.");
  }
  if (!managerAddress || !isAddress(managerAddress)) {
    throw new Error("MANAGER_ADDRESS must be a valid wallet address.");
  }

  const [owner] = await ethers.getSigners();
  if (!owner) {
    throw new Error("No local owner account is available.");
  }

  const contract = await ethers.getContractAt("MandiMint", contractAddress);
  const contractOwner = await contract.owner();

  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(
      `The configured local signer ${owner.address} is not the contract owner ${contractOwner}.`,
    );
  }

  if (await contract.isManager(managerAddress)) {
    console.log(`${managerAddress} is already an authorized manager.`);
    return;
  }

  const transaction = await contract.setManager(managerAddress, true);
  console.log(`Authorization transaction: ${transaction.hash}`);
  await transaction.wait();
  console.log(`${managerAddress} is now an authorized local manager.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
