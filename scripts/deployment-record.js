const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEPLOYMENTS_ROOT = path.join(PROJECT_ROOT, "deployments");

const DEPLOYMENT_RECORD_DIRECTORY = path.join(
  DEPLOYMENTS_ROOT,
  "mstTestnet"
);
const DEPLOYMENT_RECORD_FILE = path.join(
  DEPLOYMENT_RECORD_DIRECTORY,
  "MandiMint.json"
);

function getNetworkDeploymentDirectory(networkName = "mstTestnet") {
  return path.join(DEPLOYMENTS_ROOT, networkName);
}

function recordFilePath(directoryOrNetwork) {
  if (!directoryOrNetwork) {
    return DEPLOYMENT_RECORD_FILE;
  }
  if (directoryOrNetwork.includes(path.sep) || directoryOrNetwork.includes("/")) {
    return path.join(directoryOrNetwork, "MandiMint.json");
  }
  return path.join(DEPLOYMENTS_ROOT, directoryOrNetwork, "MandiMint.json");
}

function readDeploymentRecord(directoryOrNetwork) {
  const file = recordFilePath(directoryOrNetwork);

  if (!fs.existsSync(file)) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error(
      `The deployment record at ${file} is not valid JSON. Fix or delete it before deploying.`
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.address !== "string" ||
    parsed.address.trim().length === 0
  ) {
    throw new Error(
      `The deployment record at ${file} does not contain a contract address. Fix or delete it before deploying.`
    );
  }

  return parsed;
}

function writeDeploymentRecord(record, directoryOrNetwork) {
  const file = recordFilePath(directoryOrNetwork);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return file;
}

module.exports = {
  DEPLOYMENTS_ROOT,
  DEPLOYMENT_RECORD_DIRECTORY,
  DEPLOYMENT_RECORD_FILE,
  getNetworkDeploymentDirectory,
  readDeploymentRecord,
  writeDeploymentRecord,
};
