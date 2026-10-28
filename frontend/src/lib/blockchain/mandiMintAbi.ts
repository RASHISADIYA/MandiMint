import type { InterfaceAbi } from "ethers";

/**
 * Exact ABI for contracts/MandiMint.sol (Solidity 0.8.24).
 * Keep this file in sync with the compiled contract artifact.
 */
export const MANDIMINT_ABI: InterfaceAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint256", name: "expectedKg", type: "uint256" },
      { internalType: "uint256", name: "actualKg", type: "uint256" },
    ],
    name: "AllocationTotalMismatch",
    type: "error",
  },
  { inputs: [], name: "ArrayLengthMismatch", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "batchId", type: "uint256" }],
    name: "BatchAlreadyExists",
    type: "error",
  },
  {
    inputs: [{ internalType: "uint256", name: "batchId", type: "uint256" }],
    name: "BatchNotFound",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "farmer", type: "address" }],
    name: "DuplicateFarmer",
    type: "error",
  },
  { inputs: [], name: "EmptyAllocations", type: "error" },
  { inputs: [], name: "NotManager", type: "error" },
  { inputs: [], name: "NotOwner", type: "error" },
  { inputs: [], name: "ZeroAddress", type: "error" },
  { inputs: [], name: "ZeroAllocation", type: "error" },
  { inputs: [], name: "ZeroBatchId", type: "error" },
  { inputs: [], name: "ZeroCropId", type: "error" },
  { inputs: [], name: "ZeroFarmerAddress", type: "error" },
  { inputs: [], name: "ZeroSalePrice", type: "error" },
  { inputs: [], name: "ZeroTotalQuantity", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "batchId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "cropId", type: "uint256" },
      { indexed: true, internalType: "address", name: "manager", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalQuantityKg",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "salePriceInrPerTonne",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "farmerCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
    ],
    name: "BatchRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "batchId", type: "uint256" },
      { indexed: true, internalType: "address", name: "farmer", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "quantityKg",
        type: "uint256",
      },
    ],
    name: "FarmerAllocated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "manager", type: "address" },
      {
        indexed: false,
        internalType: "bool",
        name: "authorized",
        type: "bool",
      },
    ],
    name: "ManagerUpdated",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "batchId", type: "uint256" }],
    name: "getBatch",
    outputs: [
      { internalType: "uint256", name: "batchId_", type: "uint256" },
      { internalType: "uint256", name: "cropId", type: "uint256" },
      { internalType: "uint256", name: "totalQuantityKg", type: "uint256" },
      { internalType: "uint256", name: "salePriceInrPerTonne", type: "uint256" },
      { internalType: "address", name: "manager", type: "address" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "batchId", type: "uint256" }],
    name: "getBatchAllocations",
    outputs: [
      { internalType: "address[]", name: "farmers", type: "address[]" },
      { internalType: "uint256[]", name: "quantitiesKg", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "batchId", type: "uint256" },
      { internalType: "address", name: "farmer", type: "address" },
    ],
    name: "getFarmerAllocation",
    outputs: [
      { internalType: "uint256", name: "quantityKg", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "farmer", type: "address" }],
    name: "getFarmerAllocations",
    outputs: [
      { internalType: "uint256[]", name: "batchIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "quantitiesKg", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "farmer", type: "address" }],
    name: "getFarmerBatches",
    outputs: [
      { internalType: "uint256[]", name: "batchIds", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isManager",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "batchId", type: "uint256" },
      { internalType: "uint256", name: "cropId", type: "uint256" },
      { internalType: "uint256", name: "totalQuantityKg", type: "uint256" },
      { internalType: "uint256", name: "salePriceInrPerTonne", type: "uint256" },
      { internalType: "address[]", name: "farmers", type: "address[]" },
      { internalType: "uint256[]", name: "quantitiesKg", type: "uint256[]" },
    ],
    name: "recordBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "manager", type: "address" },
      { internalType: "bool", name: "authorized", type: "bool" },
    ],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
