const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MandiMint", function () {
  let contract;
  let owner;
  let manager;
  let farmer1;
  let farmer2;
  let outsider;

  beforeEach(async function () {
    [owner, manager, farmer1, farmer2, outsider] = await ethers.getSigners();

    const MandiMint = await ethers.getContractFactory("MandiMint");
    contract = await MandiMint.deploy();
    await contract.waitForDeployment();
    await contract.connect(owner).setManager(manager.address, true);
  });

  function makeBatch(overrides = {}) {
    return {
      batchId: 1n,
      cropId: 10n,
      totalQuantityKg: 1000n,
      salePriceInrPerTonne: 2500n,
      farmers: [farmer1.address, farmer2.address],
      quantitiesKg: [600n, 400n],
      ...overrides,
    };
  }

  async function recordBatch(args = makeBatch(), signer = manager) {
    return contract
      .connect(signer)
      .recordBatch(
        args.batchId,
        args.cropId,
        args.totalQuantityKg,
        args.salePriceInrPerTonne,
        args.farmers,
        args.quantitiesKg
      );
  }

  describe("deployment and authorization", function () {
    it("sets the deployer as owner and initial manager", async function () {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.isManager(owner.address)).to.equal(true);
      expect(await contract.isManager(manager.address)).to.equal(true);
    });

    it("lets only the owner authorize and revoke managers", async function () {
      await expect(
        contract.connect(manager).setManager(outsider.address, true)
      ).to.be.revertedWithCustomError(contract, "NotOwner");

      await expect(contract.connect(owner).setManager(outsider.address, true))
        .to.emit(contract, "ManagerUpdated")
        .withArgs(outsider.address, true);
      expect(await contract.isManager(outsider.address)).to.equal(true);

      await expect(contract.connect(owner).setManager(outsider.address, false))
        .to.emit(contract, "ManagerUpdated")
        .withArgs(outsider.address, false);
      expect(await contract.isManager(outsider.address)).to.equal(false);

      await expect(
        recordBatch(makeBatch({ batchId: 2n }), outsider)
      ).to.be.revertedWithCustomError(contract, "NotManager");
    });

    it("rejects the zero address as a manager", async function () {
      await expect(
        contract.connect(owner).setManager(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("keeps owner administration independent of manager status", async function () {
      await contract.connect(owner).setManager(owner.address, false);
      expect(await contract.isManager(owner.address)).to.equal(false);

      await expect(
        recordBatch(makeBatch(), owner)
      ).to.be.revertedWithCustomError(contract, "NotManager");

      await expect(contract.connect(owner).setManager(outsider.address, true))
        .to.emit(contract, "ManagerUpdated")
        .withArgs(outsider.address, true);
      expect(await contract.isManager(outsider.address)).to.equal(true);
    });

    it("stops batch recording after a manager is revoked", async function () {
      await contract.connect(owner).setManager(manager.address, false);
      await expect(
        recordBatch(makeBatch())
      ).to.be.revertedWithCustomError(contract, "NotManager");
    });
  });

  describe("successful batch recording", function () {
    it("records a valid batch and exposes details and allocations", async function () {
      const args = makeBatch();
      const tx = await recordBatch(args);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(contract, "BatchRecorded")
        .withArgs(
          args.batchId,
          args.cropId,
          manager.address,
          args.totalQuantityKg,
          args.salePriceInrPerTonne,
          2n,
          BigInt(block.timestamp)
        );
      await expect(tx)
        .to.emit(contract, "FarmerAllocated")
        .withArgs(args.batchId, farmer1.address, 600n);
      await expect(tx)
        .to.emit(contract, "FarmerAllocated")
        .withArgs(args.batchId, farmer2.address, 400n);

      const batch = await contract.getBatch(args.batchId);
      expect(batch.batchId_).to.equal(args.batchId);
      expect(batch.cropId).to.equal(args.cropId);
      expect(batch.totalQuantityKg).to.equal(args.totalQuantityKg);
      expect(batch.salePriceInrPerTonne).to.equal(
        args.salePriceInrPerTonne
      );
      expect(batch.manager).to.equal(manager.address);
      expect(batch.createdAt).to.equal(BigInt(block.timestamp));

      const allocations = await contract.getBatchAllocations(args.batchId);
      expect([...allocations.farmers]).to.deep.equal([
        farmer1.address,
        farmer2.address,
      ]);
      expect([...allocations.quantitiesKg]).to.deep.equal([600n, 400n]);

      expect(
        await contract.getFarmerAllocation(args.batchId, farmer1.address)
      ).to.equal(600n);
      expect(
        await contract.getFarmerAllocation(args.batchId, farmer2.address)
      ).to.equal(400n);
      expect([
        ...(await contract.getFarmerBatches(farmer1.address)),
      ]).to.deep.equal([args.batchId]);
    });

    it("maintains farmer history and quantities across multiple batches", async function () {
      await recordBatch(
        makeBatch({
          batchId: 1n,
          totalQuantityKg: 1000n,
          farmers: [farmer1.address, farmer2.address],
          quantitiesKg: [600n, 400n],
        })
      );
      await recordBatch(
        makeBatch({
          batchId: 2n,
          totalQuantityKg: 500n,
          farmers: [farmer1.address],
          quantitiesKg: [500n],
        })
      );

      expect([
        ...(await contract.getFarmerBatches(farmer1.address)),
      ]).to.deep.equal([1n, 2n]);
      expect([
        ...(await contract.getFarmerBatches(farmer2.address)),
      ]).to.deep.equal([1n]);

      const history = await contract.getFarmerAllocations(farmer1.address);
      expect([...history.batchIds]).to.deep.equal([1n, 2n]);
      expect([...history.quantitiesKg]).to.deep.equal([600n, 500n]);
    });

    it("returns empty histories and rejects unknown batch reads", async function () {
      await expect(contract.getBatch(999n))
        .to.be.revertedWithCustomError(contract, "BatchNotFound")
        .withArgs(999n);
      await expect(contract.getBatchAllocations(999n))
        .to.be.revertedWithCustomError(contract, "BatchNotFound")
        .withArgs(999n);
      await expect(
        contract.getFarmerAllocation(999n, farmer1.address)
      )
        .to.be.revertedWithCustomError(contract, "BatchNotFound")
        .withArgs(999n);

      expect([
        ...(await contract.getFarmerBatches(farmer1.address)),
      ]).to.deep.equal([]);
      const history = await contract.getFarmerAllocations(farmer1.address);
      expect([...history.batchIds]).to.deep.equal([]);
      expect([...history.quantitiesKg]).to.deep.equal([]);
    });
  });

  describe("rejected batch recording", function () {
    it("rejects an unauthorized caller", async function () {
      await expect(
        recordBatch(makeBatch(), outsider)
      ).to.be.revertedWithCustomError(contract, "NotManager");
    });

    it("rejects a zero batch ID", async function () {
      await expect(
        recordBatch(makeBatch({ batchId: 0n }))
      ).to.be.revertedWithCustomError(contract, "ZeroBatchId");
    });

    it("rejects a duplicate batch ID", async function () {
      await recordBatch(makeBatch());
      await expect(recordBatch(makeBatch()))
        .to.be.revertedWithCustomError(contract, "BatchAlreadyExists")
        .withArgs(1n);
    });

    it("rejects a zero crop identifier", async function () {
      await expect(
        recordBatch(makeBatch({ cropId: 0n }))
      ).to.be.revertedWithCustomError(contract, "ZeroCropId");
    });

    it("rejects zero total quantity", async function () {
      await expect(
        recordBatch(makeBatch({ totalQuantityKg: 0n }))
      ).to.be.revertedWithCustomError(contract, "ZeroTotalQuantity");
    });

    it("rejects a zero sale price", async function () {
      await expect(
        recordBatch(makeBatch({ salePriceInrPerTonne: 0n }))
      ).to.be.revertedWithCustomError(contract, "ZeroSalePrice");
    });

    it("rejects empty farmer and allocation arrays", async function () {
      await expect(
        recordBatch(makeBatch({ farmers: [], quantitiesKg: [] }))
      ).to.be.revertedWithCustomError(contract, "EmptyAllocations");

      await expect(
        recordBatch(
          makeBatch({ farmers: [farmer1.address], quantitiesKg: [] })
        )
      ).to.be.revertedWithCustomError(contract, "EmptyAllocations");
    });

    it("rejects mismatched array lengths", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [farmer1.address, farmer2.address],
            quantitiesKg: [1000n],
          })
        )
      ).to.be.revertedWithCustomError(contract, "ArrayLengthMismatch");
    });

    it("rejects a zero farmer address", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [ethers.ZeroAddress],
            quantitiesKg: [1000n],
          })
        )
      ).to.be.revertedWithCustomError(contract, "ZeroFarmerAddress");
    });

    it("rejects duplicate farmer addresses in one batch", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [farmer1.address, farmer1.address],
            quantitiesKg: [500n, 500n],
          })
        )
      )
        .to.be.revertedWithCustomError(contract, "DuplicateFarmer")
        .withArgs(farmer1.address);
    });

    it("rejects a zero allocation quantity", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [farmer1.address, farmer2.address],
            quantitiesKg: [0n, 1000n],
          })
        )
      ).to.be.revertedWithCustomError(contract, "ZeroAllocation");
    });

    it("rejects an allocation sum below the total", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [farmer1.address, farmer2.address],
            quantitiesKg: [300n, 600n],
          })
        )
      )
        .to.be.revertedWithCustomError(
          contract,
          "AllocationTotalMismatch"
        )
        .withArgs(1000n, 900n);
    });

    it("rejects an allocation sum above the total", async function () {
      await expect(
        recordBatch(
          makeBatch({
            farmers: [farmer1.address, farmer2.address],
            quantitiesKg: [600n, 500n],
          })
        )
      )
        .to.be.revertedWithCustomError(
          contract,
          "AllocationTotalMismatch"
        )
        .withArgs(1000n, 1100n);
    });

    it("reverts on allocation-sum overflow", async function () {
      await expect(
        recordBatch(
          makeBatch({
            batchId: 77n,
            totalQuantityKg: 1n,
            farmers: [farmer1.address, farmer2.address],
            quantitiesKg: [ethers.MaxUint256, 1n],
          })
        )
      ).to.be.revertedWithPanic(0x11);
    });

    it("leaves no state behind when validation fails", async function () {
      await expect(
        recordBatch(
          makeBatch({
            batchId: 42n,
            farmers: [farmer1.address, farmer1.address],
            quantitiesKg: [500n, 500n],
          })
        )
      )
        .to.be.revertedWithCustomError(contract, "DuplicateFarmer")
        .withArgs(farmer1.address);

      await expect(contract.getBatch(42n))
        .to.be.revertedWithCustomError(contract, "BatchNotFound")
        .withArgs(42n);
      await expect(contract.getBatchAllocations(42n))
        .to.be.revertedWithCustomError(contract, "BatchNotFound")
        .withArgs(42n);

      expect([
        ...(await contract.getFarmerBatches(farmer1.address)),
      ]).to.deep.equal([]);
      const history = await contract.getFarmerAllocations(farmer1.address);
      expect([...history.batchIds]).to.deep.equal([]);
      expect([...history.quantitiesKg]).to.deep.equal([]);
    });
  });
});
