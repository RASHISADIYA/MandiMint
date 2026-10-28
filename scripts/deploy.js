const { ethers, network, artifacts } = require("hardhat");
const {
  CANONICAL_ADDRESS_ENV_VAR,
  assertConfiguredMstTestnetChainId,
  assertLiveMstTestnetChainId,
  assertMstTestnetNetwork,
  assertNoDuplicateDeployment,
} = require("./deploy-guard");
const {
  readDeploymentRecord,
  writeDeploymentRecord,
} = require("./deployment-record");

function assertDeployerPrivateKeyIsUsable() {
  const raw = process.env.MST_TESTNET_DEPLOYER_PRIVATE_KEY;
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "MST_TESTNET_DEPLOYER_PRIVATE_KEY is not set. Export a funded MST Testnet deployer key in the shell before deploying. The key is never printed."
    );
  }
  try {
    // Format and range check only. The key is never printed or persisted.
    new ethers.Wallet(raw.trim());
  } catch {
    throw new Error(
      "MST_TESTNET_DEPLOYER_PRIVATE_KEY is malformed. Expected a 32-byte hex private key (0x followed by 64 hex characters). The value is never printed."
    );
  }
}

async function main() {
  assertMstTestnetNetwork(network.name);

  assertDeployerPrivateKeyIsUsable();

  const expectedChainIdRaw = process.env.MST_TESTNET_CHAIN_ID;
  // The MST Testnet chain ID is fixed; reject any other value.
  assertConfiguredMstTestnetChainId(expectedChainIdRaw);

  const liveNetwork = await ethers.provider.getNetwork();
  // Even though the env var is validated, also verify the live connection.
  assertLiveMstTestnetChainId(liveNetwork.chainId);

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account is configured.");
  }

  const record = readDeploymentRecord();
  const artifact = await artifacts.readArtifact("MandiMint");

  await assertNoDuplicateDeployment(ethers.provider, {
    canonicalAddress: process.env[CANONICAL_ADDRESS_ENV_VAR],
    recordedAddress: record ? record.address : null,
    deployerAddress: deployer.address,
    expectedRuntimeBytecode: artifact.deployedBytecode,
  });

  console.log(
    `Deploying MandiMint to MST Testnet (chain ID ${liveNetwork.chainId})`
  );
  console.log(`Deployer: ${deployer.address}`);

  const MandiMint = await ethers.getContractFactory("MandiMint");
  const mandiMint = await MandiMint.deploy();
  const deploymentTransaction = mandiMint.deploymentTransaction();
  await mandiMint.waitForDeployment();

  const address = await mandiMint.getAddress();
  const recordPath = writeDeploymentRecord({
    contractName: "MandiMint",
    address,
    transactionHash: deploymentTransaction ? deploymentTransaction.hash : null,
    deployer: deployer.address,
    chainId: Number(liveNetwork.chainId),
    deployedAt: new Date().toISOString(),
  });

  console.log(`MandiMint deployed at: ${address}`);
  console.log(`Deployment record written to: ${recordPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
