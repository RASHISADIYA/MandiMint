const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const MST_MAINNET_CHAIN_ID = 4646n;
const REQUIRED_NETWORK_NAME = "mstMainnet";

async function main() {
  console.log(`\n========================================================`);
  console.log(`       MandiMint MST Mainnet Deployment & Preflight     `);
  console.log(`========================================================\n`);

  // 1. Explicit network selection check
  if (network.name !== REQUIRED_NETWORK_NAME) {
    throw new Error(
      `Network safety violation: Hardhat network must be explicitly set to '--network ${REQUIRED_NETWORK_NAME}'. Currently on '${network.name}'.`
    );
  }

  // 2. Chain ID verification
  const liveNetwork = await ethers.provider.getNetwork();
  console.log(`1. Target Network:      ${REQUIRED_NETWORK_NAME}`);
  console.log(`2. Connected Chain ID:  ${liveNetwork.chainId}`);

  if (liveNetwork.chainId !== MST_MAINNET_CHAIN_ID) {
    throw new Error(
      `Chain mismatch: connected chain ID ${liveNetwork.chainId} does not match official MST Mainnet chain ID 4646.`
    );
  }

  // 3. Deployer signer check
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "Missing deployer: MST_MAINNET_DEPLOYER_PRIVATE_KEY is not configured in .env."
    );
  }

  console.log(`3. Deployer Address:    ${deployer.address}`);

  // 4. Deployer balance check
  const balance = await ethers.provider.getBalance(deployer.address);
  const formattedBalance = ethers.formatEther(balance);
  console.log(`4. Deployer Balance:    ${formattedBalance} MSTC`);

  // 5. Contract artifact verification
  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "MandiMint.sol",
    "MandiMint.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact missing at ${artifactPath}. Run 'npx hardhat compile' before deploying.`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  if (!artifact.bytecode || artifact.bytecode === "0x") {
    throw new Error("Artifact has invalid or empty bytecode.");
  }

  console.log(`5. Contract Artifact:   MandiMint.sol (Verified compiler artifact)`);

  const MandiMint = await ethers.getContractFactory("MandiMint");
  const deployTx = await MandiMint.getDeployTransaction();

  // 6. Preflight gas estimation
  let estimatedGas = 2500000n;
  try {
    estimatedGas = await ethers.provider.estimateGas(deployTx);
  } catch (err) {
    console.warn(`Gas estimation fallback: ${err.message || err}`);
  }

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 20000000000n; // 20 gwei default
  const estimatedCost = estimatedGas * gasPrice;

  console.log(`6. Estimated Gas:       ${estimatedGas.toString()}`);
  console.log(`7. Gas Price:           ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);
  console.log(`8. Estimated Cost:      ${ethers.formatEther(estimatedCost)} MSTC`);

  if (balance < estimatedCost) {
    throw new Error(
      `Insufficient funds: Deployer has ${formattedBalance} MSTC, but estimated deployment cost is ${ethers.formatEther(estimatedCost)} MSTC.`
    );
  }

  console.log(`\n--------------------------------------------------------`);
  console.log(`Preflight Safety Checks: ALL PASSED`);
  console.log(`--------------------------------------------------------\n`);

  // 7. Explicit confirmation requirement
  const isConfirmed = process.env.CONFIRM_MAINNET_DEPLOYMENT === "true";

  if (!isConfirmed) {
    console.log(`[PREFLIGHT MODE] Preflight completed successfully.`);
    console.log(`No transactions were broadcast to MST Mainnet.`);
    console.log(`\nTo broadcast a real deployment transaction, execute:`);
    console.log(`  $env:CONFIRM_MAINNET_DEPLOYMENT="true"`);
    console.log(`  npx hardhat run scripts/deploy-mainnet.js --network mstMainnet\n`);
    return;
  }

  // 8. Live deployment execution
  console.log(`Broadcasting MandiMint deployment transaction to MST Mainnet...`);
  const contract = await MandiMint.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  const receipt = await tx.wait();

  // 9. On-chain code verification
  const onChainCode = await ethers.provider.getCode(address);
  if (!onChainCode || onChainCode === "0x" || onChainCode.length <= 2) {
    throw new Error(`Deployment verification failed: no bytecode detected at ${address} on MST Mainnet.`);
  }

  console.log(`\n========================================================`);
  console.log(`         MandiMint Deployed Successfully to Mainnet!    `);
  console.log(`========================================================`);
  console.log(`Contract Address:       ${address}`);
  console.log(`Transaction Hash:       ${tx ? tx.hash : "N/A"}`);
  console.log(`Block Number:           ${receipt ? receipt.blockNumber : "N/A"}`);
  console.log(`Bytecode Length:        ${onChainCode.length} bytes`);
  console.log(`MSTScan Explorer:       https://mstscan.com/address/${address}`);

  // 10. Record deployment metadata
  const outDir = path.resolve(__dirname, "..", "deployments", "mstMainnet");
  fs.mkdirSync(outDir, { recursive: true });

  const record = {
    contractName: "MandiMint",
    network: "MST Mainnet",
    chainId: Number(MST_MAINNET_CHAIN_ID),
    address,
    transactionHash: tx ? tx.hash : null,
    blockNumber: receipt ? receipt.blockNumber : null,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    compiler: "0.8.24",
    verifiedOnChain: true,
    explorerUrl: `https://mstscan.com/address/${address}`,
  };

  fs.writeFileSync(
    path.join(outDir, "MandiMint.json"),
    JSON.stringify(record, null, 2),
    "utf8"
  );

  console.log(`Deployment record saved to deployments/mstMainnet/MandiMint.json\n`);
}

main().catch((err) => {
  console.error("\n❌ Mainnet Deployment / Preflight Failed:");
  console.error(err.message || err);
  process.exitCode = 1;
});
