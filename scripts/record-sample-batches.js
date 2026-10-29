const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const SAMPLE_BATCHES = [
  {
    batchId: 101n,
    cropId: 1n, // Wheat (गेहूं - Sharbati)
    cropName: "Sharbati Wheat (गेहूं)",
    mandiName: "Khanna Grain Market, Punjab",
    totalQuantityKg: 5000n,
    salePriceInrPerTonne: 28500n,
    farmers: [
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    ],
    quantitiesKg: [2000n, 1800n, 1200n],
  },
  {
    batchId: 102n,
    cropId: 2n, // Basmati Rice (बासमती धान - 1121 Pusa)
    cropName: "1121 Basmati Paddy (बासमती धान)",
    mandiName: "Karnal Mandi, Haryana",
    totalQuantityKg: 8200n,
    salePriceInrPerTonne: 42000n,
    farmers: [
      "0x976EA74026E72CD55543b04AB426330b1a039750",
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    ],
    quantitiesKg: [2500n, 3000n, 2700n],
  },
  {
    batchId: 103n,
    cropId: 3n, // Soybean (सोयाबीन - Yellow JS-9560)
    cropName: "Yellow Soybean JS-9560 (सोयाबीन)",
    mandiName: "Indore APMC, Madhya Pradesh",
    totalQuantityKg: 3500n,
    salePriceInrPerTonne: 48000n,
    farmers: [
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
      "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
      "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
    ],
    quantitiesKg: [1500n, 1000n, 1000n],
  },
];

async function main() {
  console.log(`\n=== MandiMint Sample Batch Seeder ===`);
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

  if (!contractAddress || network.name === "hardhat") {
    if (network.name === "hardhat") {
      console.log("In-memory Hardhat network detected: deploying temporary MandiMint instance...");
      const [deployer] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("MandiMint", deployer);
      const inst = await Factory.deploy();
      await inst.waitForDeployment();
      contractAddress = await inst.getAddress();
    } else {
      contractAddress = "0x06289D9c452369abcb9bc1b5D6Adf80982C5679C";
    }
  }

  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error(
      "No signer configured. Set MST_TESTNET_DEPLOYER_PRIVATE_KEY in .env."
    );
  }

  console.log(`Signer:           ${signer.address}`);
  console.log(`Contract Address: ${contractAddress}`);

  const contract = await ethers.getContractAt("MandiMint", contractAddress, signer);

  // Verify manager status
  const isMgr = await contract.isManager(signer.address);
  if (!isMgr) {
    throw new Error(
      `Signer ${signer.address} is not an authorized manager on ${contractAddress}. Only authorized managers can record batches.`
    );
  }

  const results = [];

  for (const batch of SAMPLE_BATCHES) {
    console.log(`\nProcessing Batch #${batch.batchId.toString()} - ${batch.cropName}...`);

    let existing = null;
    try {
      existing = await contract.getBatch(batch.batchId);
    } catch {}

    if (existing && existing.createdAt > 0n) {
      console.log(`  -> Batch #${batch.batchId.toString()} already exists on-chain.`);
      results.push({
        batchId: Number(batch.batchId),
        cropId: Number(batch.cropId),
        cropName: batch.cropName,
        mandiName: batch.mandiName,
        totalQuantityKg: Number(batch.totalQuantityKg),
        salePriceInrPerTonne: Number(batch.salePriceInrPerTonne),
        createdAt: Number(existing.createdAt),
        manager: existing.manager,
        status: "already_recorded",
      });
      continue;
    }

    console.log(`  -> Recording batch on-chain (${batch.totalQuantityKg.toString()} kg across ${batch.farmers.length} farmers)...`);
    const normalizedFarmers = batch.farmers.map((f) => ethers.getAddress(f.toLowerCase()));
    const tx = await contract.recordBatch(
      batch.batchId,
      batch.cropId,
      batch.totalQuantityKg,
      batch.salePriceInrPerTonne,
      normalizedFarmers,
      batch.quantitiesKg
    );

    console.log(`  -> Tx submitted: ${tx.hash}`);
    if (network.name === "mstTestnet") {
      console.log(`  -> MSTScan: https://testnet.mstscan.com/tx/${tx.hash}`);
    }

    const receipt = await tx.wait();
    console.log(`  -> Confirmed in block ${receipt.blockNumber}!`);

    results.push({
      batchId: Number(batch.batchId),
      cropId: Number(batch.cropId),
      cropName: batch.cropName,
      mandiName: batch.mandiName,
      totalQuantityKg: Number(batch.totalQuantityKg),
      salePriceInrPerTonne: Number(batch.salePriceInrPerTonne),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      manager: signer.address,
      contractAddress,
      explorerUrl: `https://testnet.mstscan.com/tx/${tx.hash}`,
      status: "confirmed",
      farmers: batch.farmers.map((addr, idx) => ({
        address: addr,
        quantityKg: Number(batch.quantitiesKg[idx]),
      })),
    });
  }

  // Save results
  const outDir = path.resolve(__dirname, "..", "deployments", "mstTestnet");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "transactions.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  const frontendOutDir = path.resolve(__dirname, "..", "frontend", "src", "config");
  fs.mkdirSync(frontendOutDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendOutDir, "verifiedBatches.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Saved transaction records to deployments/mstTestnet/transactions.json`);
}

main().catch((err) => {
  console.error("Batch seeding failed:", err.message || err);
  process.exitCode = 1;
});
