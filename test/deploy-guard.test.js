const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");
const {
  CANONICAL_ADDRESS_ENV_VAR,
  assertConfiguredMstTestnetChainId,
  assertLiveMstTestnetChainId,
  assertMstTestnetNetwork,
  assertNoDuplicateDeployment,
  findExistingDeploymentByCreator,
  matchesDeployedRuntimeCode,
} = require("../scripts/deploy-guard");

const CHECKSUMMED_ADDRESS = "0xEDe9ca4BfA8e06A1fB832F2F19686b329863CEF0";
const LOWERCASE_ADDRESS = CHECKSUMMED_ADDRESS.toLowerCase();
const DIGITS_ADDRESS = "0x1111111111111111111111111111111111111111";
const BAD_CHECKSUM_ADDRESS = "0xedE9ca4bfa8e06a1fb832f2f19686b329863cef0";
const DEPLOYED_BYTECODE = "0x60806040523480156100";
const UNUSED_SIGNER_INDEX = 5;
const SECOND_UNUSED_SIGNER_INDEX = 6;
const THIRD_UNUSED_SIGNER_INDEX = 7;

function getCreateAddressFor(from, nonce) {
  return ethers.getCreateAddress({ from, nonce });
}

function fakeProvider(code, transactionCount) {
  const calls = [];
  const countCalls = [];
  return {
    calls,
    countCalls,
    getCode: async (address) => {
      calls.push(address);
      return code;
    },
    getTransactionCount: async (address) => {
      countCalls.push(address);
      return transactionCount || 0;
    },
  };
}

async function captureError(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("deploy guards", function () {
  describe("network and chain ID", function () {
    it("restricts deployment to the mstTestnet network", function () {
      expect(() => assertMstTestnetNetwork("mstTestnet")).to.not.throw();
      expect(() => assertMstTestnetNetwork("localhost")).to.throw(
        /restricted to the MST Testnet network/
      );
      expect(() => assertMstTestnetNetwork("mstMainnet")).to.throw(
        /restricted to the MST Testnet network/
      );
    });

    it("rejects a missing, non-numeric, non-positive, or wrong configured chain ID", function () {
      expect(() => assertConfiguredMstTestnetChainId(undefined)).to.throw(
        /MST_TESTNET_CHAIN_ID is required/
      );
      expect(() => assertConfiguredMstTestnetChainId("")).to.throw(
        /MST_TESTNET_CHAIN_ID is required/
      );
      expect(() => assertConfiguredMstTestnetChainId("not-a-number")).to.throw(
        /must be a positive integer/
      );
      expect(() => assertConfiguredMstTestnetChainId("0")).to.throw(
        /must be a positive integer/
      );
      expect(() => assertConfiguredMstTestnetChainId("-1")).to.throw(
        /must be a positive integer/
      );
      expect(() => assertConfiguredMstTestnetChainId("4646")).to.throw(
        /MST_TESTNET_CHAIN_ID must be 91562037/
      );
      expect(() => assertConfiguredMstTestnetChainId("91562037")).to.not.throw();
    });

    it("rejects a live chain ID that is not 91562037", function () {
      expect(() => assertLiveMstTestnetChainId(91562037n)).to.not.throw();
      expect(() => assertLiveMstTestnetChainId(4646n)).to.throw(
        /connected chain ID 4646 is not the MST Testnet chain ID 91562037/
      );
      expect(() => assertLiveMstTestnetChainId(1n)).to.throw(
        /is not the MST Testnet chain ID 91562037/
      );
    });
  });

  describe("duplicate-deployment guard", function () {
    it("uses a clearly named environment variable", function () {
      expect(CANONICAL_ADDRESS_ENV_VAR).to.equal("MANDIMINT_CONTRACT_ADDRESS");
    });

    it("allows the first deployment when nothing is configured", async function () {
      const provider = fakeProvider("0x", 0);

      expect(
        await assertNoDuplicateDeployment(provider, {
          canonicalAddress: undefined,
          recordedAddress: null,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      ).to.equal(null);

      expect(provider.calls).to.have.lengthOf(0);
      expect(provider.countCalls).to.deep.equal([CHECKSUMMED_ADDRESS]);
    });

    it("treats empty configuration as not configured", async function () {
      const provider = fakeProvider(DEPLOYED_BYTECODE, 0);

      expect(
        await assertNoDuplicateDeployment(provider, {
          canonicalAddress: "",
          recordedAddress: "   ",
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      ).to.equal(null);

      expect(provider.calls).to.have.lengthOf(0);
    });

    it("rejects a malformed canonical address without querying the chain", async function () {
      const provider = fakeProvider("0x", 0);

      for (const badAddress of ["0x123", "not-an-address", BAD_CHECKSUM_ADDRESS]) {
        const error = await captureError(
          assertNoDuplicateDeployment(provider, {
            canonicalAddress: badAddress,
            deployerAddress: CHECKSUMMED_ADDRESS,
            expectedRuntimeBytecode: DEPLOYED_BYTECODE,
          })
        );
        expect(error).to.not.equal(null);
        expect(error.message).to.match(
          /MANDIMINT_CONTRACT_ADDRESS is not a valid EVM address/
        );
      }

      expect(provider.calls).to.have.lengthOf(0);
    });

    it("rejects a malformed recorded address without querying the chain", async function () {
      const provider = fakeProvider("0x", 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          recordedAddress: "0x123",
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(
        /recorded MandiMint deployment address is not a valid EVM address/
      );
      expect(provider.calls).to.have.lengthOf(0);
    });

    it("aborts when bytecode already exists at the canonical address", async function () {
      const provider = fakeProvider(DEPLOYED_BYTECODE, 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: CHECKSUMMED_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/already deployed at/);
      expect(error.message).to.match(/Reuse the existing deployment/);
      expect(error.message).to.include(CHECKSUMMED_ADDRESS);
      expect(provider.calls).to.deep.equal([CHECKSUMMED_ADDRESS]);
    });

    it("aborts when the canonical address holds no bytecode", async function () {
      const provider = fakeProvider("0x", 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: DIGITS_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/No contract bytecode was found/);
      expect(error.message).to.include(DIGITS_ADDRESS);
      expect(provider.calls).to.deep.equal([DIGITS_ADDRESS]);
    });

    it("normalizes a lowercase canonical address before reading the chain", async function () {
      const provider = fakeProvider(DEPLOYED_BYTECODE, 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: LOWERCASE_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/already deployed at/);
      expect(provider.calls).to.deep.equal([CHECKSUMMED_ADDRESS]);
    });

    it("aborts when a deployment record exists but the canonical address was omitted", async function () {
      const provider = fakeProvider(DEPLOYED_BYTECODE, 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: undefined,
          recordedAddress: CHECKSUMMED_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/already deployed at/);
      expect(error.message).to.match(/Reuse the existing deployment/);
      expect(error.message).to.include(CHECKSUMMED_ADDRESS);
      expect(provider.calls).to.deep.equal([CHECKSUMMED_ADDRESS]);
    });

    it("aborts when the deployment record points at an address without bytecode", async function () {
      const provider = fakeProvider("0x", 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          recordedAddress: DIGITS_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/deployment record points at/);
      expect(error.message).to.match(/stale/);
    });

    it("aborts when the canonical address and the record disagree", async function () {
      const provider = fakeProvider(DEPLOYED_BYTECODE, 0);

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: CHECKSUMMED_ADDRESS,
          recordedAddress: DIGITS_ADDRESS,
          deployerAddress: CHECKSUMMED_ADDRESS,
          expectedRuntimeBytecode: DEPLOYED_BYTECODE,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/does not match the recorded deployment/);
    });

    it("aborts when the deployer already created a MandiMint contract on chain", async function () {
      const artifact = await artifacts.readArtifact("MandiMint");
      const signers = await ethers.getSigners();
      const deployer = signers[0];
      const creator = getCreateAddressFor(deployer.address, 0);

      const provider = {
        getCode: async (address) =>
          address === creator ? artifact.deployedBytecode : "0x",
        getTransactionCount: async () => 1,
      };

      const error = await captureError(
        assertNoDuplicateDeployment(provider, {
          canonicalAddress: undefined,
          recordedAddress: null,
          deployerAddress: deployer.address,
          expectedRuntimeBytecode: artifact.deployedBytecode,
        })
      );

      expect(error).to.not.equal(null);
      expect(error.message).to.match(/already deployed by this deployer/);
      expect(error.message).to.include(creator);
    });

    it("returns null when the deployer has never created a contract", async function () {
      const artifact = await artifacts.readArtifact("MandiMint");
      const signers = await ethers.getSigners();
      const deployer = signers[SECOND_UNUSED_SIGNER_INDEX];

      const found = await findExistingDeploymentByCreator(
        ethers.provider,
        deployer.address,
        artifact.deployedBytecode,
        100
      );

      expect(found).to.equal(null);
    });

    it("finds a real deployment created by the deployer on the local chain", async function () {
      const artifact = await artifacts.readArtifact("MandiMint");
      const signers = await ethers.getSigners();
      const deployer = signers[UNUSED_SIGNER_INDEX];

      const factory = await ethers.getContractFactory("MandiMint");
      const deployed = await factory.connect(deployer).deploy();
      await deployed.waitForDeployment();
      const address = await deployed.getAddress();

      const found = await findExistingDeploymentByCreator(
        ethers.provider,
        deployer.address,
        artifact.deployedBytecode,
        100
      );

      expect(found).to.equal(address);
    });

    it("matches runtime code with the owner immutable patched into its slot", async function () {
      const owner = "0xEDe9ca4BfA8e06A1fB832F2F19686b329863CEF0";
      const compiled = `0x600160005260206000f3${"00".repeat(20)}600052`;
      const patched = `0x600160005260206000f3${owner
        .slice(2)
        .toLowerCase()}600052`;

      expect(matchesDeployedRuntimeCode(compiled, compiled, owner)).to.equal(
        true
      );
      expect(matchesDeployedRuntimeCode(compiled, patched, owner)).to.equal(true);
      expect(
        matchesDeployedRuntimeCode(compiled, patched, DIGITS_ADDRESS)
      ).to.equal(false);
      expect(
        matchesDeployedRuntimeCode(compiled, `${patched}00`, owner)
      ).to.equal(false);
    });

    it("matches the real runtime code of a MandiMint deployment", async function () {
      const artifact = await artifacts.readArtifact("MandiMint");
      const signers = await ethers.getSigners();
      const deployer = signers[THIRD_UNUSED_SIGNER_INDEX];

      const factory = await ethers.getContractFactory("MandiMint");
      const deployed = await factory.connect(deployer).deploy();
      await deployed.waitForDeployment();
      const onChainCode = await ethers.provider.getCode(
        await deployed.getAddress()
      );

      expect(
        matchesDeployedRuntimeCode(
          artifact.deployedBytecode,
          onChainCode,
          deployer.address
        )
      ).to.equal(true);
      expect(
        matchesDeployedRuntimeCode(
          artifact.deployedBytecode,
          onChainCode,
          CHECKSUMMED_ADDRESS
        )
      ).to.equal(false);
    });
  });
});
