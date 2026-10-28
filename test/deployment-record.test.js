const { expect } = require("chai");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  DEPLOYMENT_RECORD_DIRECTORY,
  DEPLOYMENT_RECORD_FILE,
  readDeploymentRecord,
  writeDeploymentRecord,
} = require("../scripts/deployment-record");

const ADDRESS = "0xEDe9ca4BfA8e06A1fB832F2F19686b329863CEF0";

function makeTemporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mandimint-record-"));
}

describe("deployment record", function () {
  it("stores the record outside version control", function () {
    expect(DEPLOYMENT_RECORD_DIRECTORY).to.include(path.join("deployments", "mstTestnet"));
    expect(DEPLOYMENT_RECORD_FILE.endsWith("MandiMint.json")).to.equal(true);

    const gitignore = fs.readFileSync(
      path.resolve(__dirname, "..", ".gitignore"),
      "utf8"
    );
    expect(gitignore).to.match(/^deployments\/$/m);
  });

  it("returns null when no record exists", function () {
    const directory = makeTemporaryDirectory();
    expect(readDeploymentRecord(directory)).to.equal(null);
  });

  it("round-trips a deployment record", function () {
    const directory = makeTemporaryDirectory();

    const file = writeDeploymentRecord(
      {
        contractName: "MandiMint",
        address: ADDRESS,
        transactionHash: "0xabc",
        deployer: ADDRESS,
        chainId: 91562037,
        deployedAt: "2026-10-27T00:00:00.000Z",
      },
      directory
    );

    expect(fs.existsSync(file)).to.equal(true);
    expect(file).to.include(directory);

    const record = readDeploymentRecord(directory);
    expect(record.address).to.equal(ADDRESS);
    expect(record.chainId).to.equal(91562037);
    expect(record.transactionHash).to.equal("0xabc");
  });

  it("rejects a record that is not valid JSON", function () {
    const directory = makeTemporaryDirectory();
    fs.writeFileSync(path.join(directory, "MandiMint.json"), "{not json", "utf8");

    expect(() => readDeploymentRecord(directory)).to.throw(/not valid JSON/);
  });

  it("rejects a record without a contract address", function () {
    const directory = makeTemporaryDirectory();
    fs.writeFileSync(
      path.join(directory, "MandiMint.json"),
      JSON.stringify({ contractName: "MandiMint" }),
      "utf8"
    );

    expect(() => readDeploymentRecord(directory)).to.throw(
      /does not contain a contract address/
    );
  });

  it("never stores a private key", function () {
    const directory = makeTemporaryDirectory();

    const file = writeDeploymentRecord(
      {
        contractName: "MandiMint",
        address: ADDRESS,
        deployer: ADDRESS,
        chainId: 91562037,
      },
      directory
    );

    const contents = fs.readFileSync(file, "utf8");
    expect(contents).to.not.match(/privateKey/i);
    expect(contents).to.not.match(/0x[0-9a-fA-F]{64}/);
  });
});
