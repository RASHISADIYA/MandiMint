const { isAddress, getAddress, getCreateAddress } = require("ethers");

const CANONICAL_ADDRESS_ENV_VAR = "MANDIMINT_CONTRACT_ADDRESS";
const MST_TESTNET_NETWORK_NAME = "mstTestnet";
const MST_TESTNET_CHAIN_ID = 91562037n;
const DEFAULT_DEPLOYER_SCAN_LIMIT = 100;

function assertMstTestnetNetwork(networkName) {
  if (networkName !== MST_TESTNET_NETWORK_NAME) {
    throw new Error("Deployment is restricted to the MST Testnet network.");
  }
}

function assertConfiguredMstTestnetChainId(configuredChainId) {
  if (!configuredChainId) {
    throw new Error(
      "MST_TESTNET_CHAIN_ID is required; the MST Testnet chain ID must be 91562037."
    );
  }

  let expectedChainId;
  try {
    expectedChainId = BigInt(configuredChainId);
  } catch {
    throw new Error("MST_TESTNET_CHAIN_ID must be a positive integer.");
  }

  if (expectedChainId <= 0n) {
    throw new Error("MST_TESTNET_CHAIN_ID must be a positive integer.");
  }

  if (expectedChainId !== MST_TESTNET_CHAIN_ID) {
    throw new Error(
      `MST_TESTNET_CHAIN_ID must be 91562037; received ${expectedChainId}.`
    );
  }
}

function assertLiveMstTestnetChainId(liveChainId) {
  if (BigInt(liveChainId) !== MST_TESTNET_CHAIN_ID) {
    throw new Error(
      `Refusing deployment: connected chain ID ${BigInt(liveChainId)} is not the MST Testnet chain ID 91562037.`
    );
  }
}

function normalizeAddress(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function hasBytecode(code) {
  return typeof code === "string" && code !== "0x" && code.length > 2;
}

function matchesDeployedRuntimeCode(
  compiledRuntimeCode,
  onChainCode,
  expectedOwner
) {
  if (
    typeof compiledRuntimeCode !== "string" ||
    typeof onChainCode !== "string" ||
    typeof expectedOwner !== "string" ||
    !isAddress(expectedOwner)
  ) {
    return false;
  }

  const compiled = Buffer.from(compiledRuntimeCode.replace(/^0x/, ""), "hex");
  const actual = Buffer.from(onChainCode.replace(/^0x/, ""), "hex");
  const owner = Buffer.from(getAddress(expectedOwner).replace(/^0x/, ""), "hex");

  if (compiled.length === 0 || compiled.length !== actual.length) {
    return false;
  }

  if (owner.length === 0) {
    return false;
  }

  const normalized = Buffer.from(actual);
  let index = normalized.indexOf(owner);
  while (index !== -1) {
    normalized.fill(0, index, index + owner.length);
    index = normalized.indexOf(owner, index + 1);
  }

  return normalized.equals(compiled);
}

async function findExistingDeploymentByCreator(
  provider,
  deployerAddress,
  expectedRuntimeBytecode,
  scanLimit
) {
  const creator = normalizeAddress(deployerAddress);

  if (creator === null || !isAddress(creator)) {
    return null;
  }

  if (
    typeof expectedRuntimeBytecode !== "string" ||
    expectedRuntimeBytecode.length <= 2
  ) {
    return null;
  }

  const creatorAddress = getAddress(creator);
  const nonce = Number(await provider.getTransactionCount(creatorAddress));

  if (nonce > scanLimit) {
    throw new Error(
      `The deployer account has sent ${nonce} transactions, which exceeds the duplicate-scan window of ${scanLimit}. Set ${CANONICAL_ADDRESS_ENV_VAR} to the canonical MandiMint address before deploying.`
    );
  }

  for (let index = 0; index < nonce; index++) {
    const candidate = getCreateAddress({ from: creatorAddress, nonce: index });
    const code = await provider.getCode(candidate);

    if (!hasBytecode(code)) {
      continue;
    }

    if (matchesDeployedRuntimeCode(expectedRuntimeBytecode, code, creator)) {
      return candidate;
    }
  }

  return null;
}

async function assertNoDuplicateDeployment(provider, options) {
  const {
    canonicalAddress,
    recordedAddress,
    deployerAddress,
    expectedRuntimeBytecode,
    scanLimit = DEFAULT_DEPLOYER_SCAN_LIMIT,
  } = options || {};

  const explicit = normalizeAddress(canonicalAddress);

  if (explicit !== null && !isAddress(explicit)) {
    throw new Error(
      `${CANONICAL_ADDRESS_ENV_VAR} is not a valid EVM address; refusing to deploy. Correct it, or unset it to perform a first deployment.`
    );
  }

  const recorded = normalizeAddress(recordedAddress);

  if (recorded !== null && !isAddress(recorded)) {
    throw new Error(
      "The recorded MandiMint deployment address is not a valid EVM address; refusing to deploy. Fix or delete the deployment record."
    );
  }

  if (explicit !== null && recorded !== null) {
    if (getAddress(explicit) !== getAddress(recorded)) {
      throw new Error(
        `${CANONICAL_ADDRESS_ENV_VAR} (${getAddress(explicit)}) does not match the recorded deployment (${getAddress(recorded)}); refusing to deploy.`
      );
    }
  }

  const configured =
    explicit !== null
      ? getAddress(explicit)
      : recorded !== null
        ? getAddress(recorded)
        : null;

  if (configured !== null) {
    const code = await provider.getCode(configured);

    if (hasBytecode(code)) {
      throw new Error(
        `MandiMint is already deployed at ${configured} on MST Testnet. Reuse the existing deployment; refusing to deploy a duplicate contract.`
      );
    }

    if (explicit !== null) {
      throw new Error(
        `No contract bytecode was found at the configured ${CANONICAL_ADDRESS_ENV_VAR} (${configured}) on MST Testnet. The canonical address is inconsistent, so no contract will be deployed at a different address. Unset ${CANONICAL_ADDRESS_ENV_VAR} to perform a first deployment.`
      );
    }

    throw new Error(
      `The deployment record points at ${configured}, but no contract bytecode was found there on MST Testnet. The record is stale, so no replacement contract will be deployed. Remove the deployment record to deploy again.`
    );
  }

  const scanned = await findExistingDeploymentByCreator(
    provider,
    deployerAddress,
    expectedRuntimeBytecode,
    scanLimit
  );

  if (scanned !== null) {
    throw new Error(
      `MandiMint was already deployed by this deployer at ${scanned} on MST Testnet. Reuse the existing deployment; refusing to deploy a duplicate contract.`
    );
  }

  return null;
}

module.exports = {
  CANONICAL_ADDRESS_ENV_VAR,
  DEFAULT_DEPLOYER_SCAN_LIMIT,
  MST_TESTNET_CHAIN_ID,
  MST_TESTNET_NETWORK_NAME,
  assertConfiguredMstTestnetChainId,
  assertLiveMstTestnetChainId,
  assertMstTestnetNetwork,
  assertNoDuplicateDeployment,
  findExistingDeploymentByCreator,
  matchesDeployedRuntimeCode,
};
