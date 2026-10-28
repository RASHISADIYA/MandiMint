const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEPLOYMENT_RECORD_DIRECTORY = path.join(
  PROJECT_ROOT,
  "deployments",
  "mstTestnet"
);
const DEPLOYMENT_RECORD_FILE = path.join(
  DEPLOYMENT_RECORD_DIRECTORY,
  "MandiMint.json"
);

function recordFilePath(directory) {
  return path.join(directory || DEPLOYMENT_RECORD_DIRECTORY, "MandiMint.json");
}

function readDeploymentRecord(directory) {
  const file = recordFilePath(directory);

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

function writeDeploymentRecord(record, directory) {
  const file = recordFilePath(directory);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return file;
}

module.exports = {
  DEPLOYMENT_RECORD_DIRECTORY,
  DEPLOYMENT_RECORD_FILE,
  readDeploymentRecord,
  writeDeploymentRecord,
};
