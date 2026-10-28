// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title MandiMint
/// @notice Append-only record of crop sale batches and farmer quantity allocations.
/// @dev Quantities are whole kilograms and prices are whole INR per metric tonne.
///      The contract does not calculate gross sale values, transfer funds, settle
///      payments, or store personal information. Farmer wallet addresses are public
///      blockchain identifiers.
contract MandiMint {
    /// @notice Recorded crop sale batch details.
    /// @param batchId Unique, nonzero batch identifier.
    /// @param cropId Nonzero crop identifier.
    /// @param totalQuantityKg Total batch quantity in whole kilograms.
    /// @param salePriceInrPerTonne Sale price in whole INR per metric tonne.
    /// @param createdAt Block timestamp at which the batch was recorded.
    /// @param manager Address of the authorized manager that recorded the batch.
    /// @param exists Explicit existence indicator.
    struct Batch {
        uint256 batchId;
        uint256 cropId;
        uint256 totalQuantityKg;
        uint256 salePriceInrPerTonne;
        uint256 createdAt;
        address manager;
        bool exists;
    }

    /// @notice Contract owner and administrator of manager permissions.
    address public immutable owner;

    /// @notice Whether an address is authorized to record batches.
    mapping(address => bool) public isManager;

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => address[]) private _batchFarmers;
    mapping(uint256 => mapping(address => uint256)) private _farmerAllocationKg;
    mapping(address => uint256[]) private _farmerBatches;

    /// @notice Emitted when an authorized manager records a new batch.
    /// @param batchId Unique batch identifier.
    /// @param cropId Crop identifier.
    /// @param manager Manager that recorded the batch.
    /// @param totalQuantityKg Total quantity in whole kilograms.
    /// @param salePriceInrPerTonne Sale price in whole INR per metric tonne.
    /// @param farmerCount Number of farmer allocations in the batch.
    /// @param createdAt Block timestamp at which the batch was recorded.
    event BatchRecorded(
        uint256 indexed batchId,
        uint256 indexed cropId,
        address indexed manager,
        uint256 totalQuantityKg,
        uint256 salePriceInrPerTonne,
        uint256 farmerCount,
        uint256 createdAt
    );

    /// @notice Emitted for each farmer allocation in a recorded batch.
    /// @param batchId Batch identifier.
    /// @param farmer Farmer wallet address.
    /// @param quantityKg Allocated quantity in whole kilograms.
    event FarmerAllocated(
        uint256 indexed batchId,
        address indexed farmer,
        uint256 quantityKg
    );

    /// @notice Emitted when manager authorization changes.
    /// @param manager Address whose authorization changed.
    /// @param authorized New authorization status.
    event ManagerUpdated(address indexed manager, bool authorized);

    error NotOwner();
    error NotManager();
    error ZeroAddress();
    error ZeroBatchId();
    error BatchAlreadyExists(uint256 batchId);
    error BatchNotFound(uint256 batchId);
    error ZeroCropId();
    error ZeroTotalQuantity();
    error ZeroSalePrice();
    error EmptyAllocations();
    error ArrayLengthMismatch();
    error ZeroFarmerAddress();
    error DuplicateFarmer(address farmer);
    error ZeroAllocation();
    error AllocationTotalMismatch(uint256 expectedKg, uint256 actualKg);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyManager() {
        if (!isManager[msg.sender]) revert NotManager();
        _;
    }

    constructor() {
        owner = msg.sender;
        isManager[msg.sender] = true;
        emit ManagerUpdated(msg.sender, true);
    }

    /// @notice Authorizes or revokes a batch manager.
    /// @dev Only the owner can call this function. Ownership administration is
    ///      independent of whether the owner is currently an authorized manager.
    /// @param manager Manager address; must not be the zero address.
    /// @param authorized True to authorize, false to revoke.
    function setManager(address manager, bool authorized) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        isManager[manager] = authorized;
        emit ManagerUpdated(manager, authorized);
    }

    /// @notice Records a crop sale batch and its farmer quantity allocations.
    /// @dev All addresses, quantities, duplicates, and the exact allocation total
    ///      are validated before any batch or allocation data is written. Duplicate
    ///      detection is linear per farmer and therefore quadratic in the number of
    ///      allocations. Failed validation reverts the entire transaction.
    /// @param batchId Unique, nonzero batch identifier.
    /// @param cropId Nonzero crop identifier.
    /// @param totalQuantityKg Total batch quantity in whole kilograms; must be nonzero.
    /// @param salePriceInrPerTonne Sale price in whole INR per metric tonne; must be nonzero.
    /// @param farmers Farmer wallet addresses; must be nonempty and contain no zeros or duplicates.
    /// @param quantitiesKg Allocation quantities in whole kilograms; must match farmers and sum exactly to totalQuantityKg.
    function recordBatch(
        uint256 batchId,
        uint256 cropId,
        uint256 totalQuantityKg,
        uint256 salePriceInrPerTonne,
        address[] calldata farmers,
        uint256[] calldata quantitiesKg
    ) external onlyManager {
        if (batchId == 0) revert ZeroBatchId();
        if (_batches[batchId].exists) revert BatchAlreadyExists(batchId);
        if (cropId == 0) revert ZeroCropId();
        if (totalQuantityKg == 0) revert ZeroTotalQuantity();
        if (salePriceInrPerTonne == 0) revert ZeroSalePrice();

        uint256 farmerCount = farmers.length;

        if (farmerCount == 0 || quantitiesKg.length == 0) {
            revert EmptyAllocations();
        }
        if (farmerCount != quantitiesKg.length) revert ArrayLengthMismatch();

        uint256 allocatedTotalKg;

        for (uint256 i = 0; i < farmerCount; i++) {
            address farmer = farmers[i];
            uint256 quantityKg = quantitiesKg[i];

            if (farmer == address(0)) revert ZeroFarmerAddress();
            if (quantityKg == 0) revert ZeroAllocation();

            for (uint256 j = 0; j < i; j++) {
                if (farmers[j] == farmer) revert DuplicateFarmer(farmer);
            }

            allocatedTotalKg += quantityKg;
        }

        if (allocatedTotalKg != totalQuantityKg) {
            revert AllocationTotalMismatch(totalQuantityKg, allocatedTotalKg);
        }

        _batches[batchId] = Batch({
            batchId: batchId,
            cropId: cropId,
            totalQuantityKg: totalQuantityKg,
            salePriceInrPerTonne: salePriceInrPerTonne,
            createdAt: block.timestamp,
            manager: msg.sender,
            exists: true
        });

        emit BatchRecorded(
            batchId,
            cropId,
            msg.sender,
            totalQuantityKg,
            salePriceInrPerTonne,
            farmerCount,
            block.timestamp
        );

        _storeAllocations(batchId, farmers, quantitiesKg);
    }

    function _storeAllocations(
        uint256 batchId,
        address[] calldata farmers,
        uint256[] calldata quantitiesKg
    ) private {
        uint256 farmerCount = farmers.length;

        for (uint256 i = 0; i < farmerCount; i++) {
            address farmer = farmers[i];
            uint256 quantityKg = quantitiesKg[i];

            _farmerAllocationKg[batchId][farmer] = quantityKg;
            _batchFarmers[batchId].push(farmer);
            _farmerBatches[farmer].push(batchId);

            emit FarmerAllocated(batchId, farmer, quantityKg);
        }
    }

    /// @notice Returns recorded batch details.
    /// @param batchId Batch identifier to query.
    /// @return batchId_ Recorded batch identifier.
    /// @return cropId Crop identifier.
    /// @return totalQuantityKg Total quantity in whole kilograms.
    /// @return salePriceInrPerTonne Sale price in whole INR per metric tonne.
    /// @return manager Manager that recorded the batch.
    /// @return createdAt Block timestamp at which the batch was recorded.
    function getBatch(
        uint256 batchId
    )
        external
        view
        returns (
            uint256 batchId_,
            uint256 cropId,
            uint256 totalQuantityKg,
            uint256 salePriceInrPerTonne,
            address manager,
            uint256 createdAt
        )
    {
        Batch storage batch = _batches[batchId];
        if (!batch.exists) revert BatchNotFound(batchId);

        return (
            batch.batchId,
            batch.cropId,
            batch.totalQuantityKg,
            batch.salePriceInrPerTonne,
            batch.manager,
            batch.createdAt
        );
    }

    /// @notice Returns all farmer addresses and allocated quantities for a batch.
    /// @dev The returned arrays are unbounded. Off-chain calls are inexpensive, but
    ///      RPC providers may limit result sizes for very large batches.
    /// @param batchId Batch identifier to query.
    /// @return farmers Farmer wallet addresses in allocation order.
    /// @return quantitiesKg Allocated quantities in whole kilograms, parallel to farmers.
    function getBatchAllocations(
        uint256 batchId
    )
        external
        view
        returns (address[] memory farmers, uint256[] memory quantitiesKg)
    {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);

        address[] storage batchFarmers = _batchFarmers[batchId];
        uint256 count = batchFarmers.length;

        farmers = new address[](count);
        quantitiesKg = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            address farmer = batchFarmers[i];
            farmers[i] = farmer;
            quantitiesKg[i] = _farmerAllocationKg[batchId][farmer];
        }
    }

    /// @notice Returns one farmer's allocated quantity within a batch.
    /// @param batchId Batch identifier to query.
    /// @param farmer Farmer wallet address to query.
    /// @return quantityKg Allocated quantity in whole kilograms, or zero if none.
    function getFarmerAllocation(
        uint256 batchId,
        address farmer
    ) external view returns (uint256 quantityKg) {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        return _farmerAllocationKg[batchId][farmer];
    }

    /// @notice Returns the batch IDs recorded for a farmer.
    /// @dev The returned array is unbounded and empty for addresses with no history.
    /// @param farmer Farmer wallet address to query.
    /// @return batchIds Recorded batch identifiers in insertion order.
    function getFarmerBatches(
        address farmer
    ) external view returns (uint256[] memory batchIds) {
        return _farmerBatches[farmer];
    }

    /// @notice Returns a farmer's batch IDs and allocated quantities together.
    /// @dev The returned arrays are unbounded, parallel, and empty for addresses
    ///      with no history.
    /// @param farmer Farmer wallet address to query.
    /// @return batchIds Recorded batch identifiers in insertion order.
    /// @return quantitiesKg Allocated quantities in whole kilograms, parallel to batchIds.
    function getFarmerAllocations(
        address farmer
    )
        external
        view
        returns (uint256[] memory batchIds, uint256[] memory quantitiesKg)
    {
        uint256[] storage farmerBatchIds = _farmerBatches[farmer];
        uint256 count = farmerBatchIds.length;

        batchIds = new uint256[](count);
        quantitiesKg = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 batchId = farmerBatchIds[i];
            batchIds[i] = batchId;
            quantitiesKg[i] = _farmerAllocationKg[batchId][farmer];
        }
    }
}
