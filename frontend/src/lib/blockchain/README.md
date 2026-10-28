# Blockchain integration

The frontend reads and writes the MandiMint contract on MST Testnet through ethers v6.

## Files

- `mandiMintAbi.ts` — exact ABI for `contracts/MandiMint.sol`.
- `mandiMintContract.ts` — public reads, `recordBatch` writes, explorer URLs, and contract error mapping.
- `../../hooks/useMandiMintReads.ts` — React loading/error/success states for batch, farmer-history, and manager reads.

## Configuration

Set these public Vite variables:

```bash
VITE_MANDIMINT_CONTRACT_ADDRESS=0x...
VITE_MST_TESTNET_CHAIN_ID=...
VITE_MST_TESTNET_RPC_URL=https://...
VITE_MST_TESTNET_EXPLORER_URL=https://...
```

If the address or chain configuration is missing or invalid, reads and writes are disabled and no blockchain call is made. There is no mock contract or mock data.

For local Hardhat, use the Vite proxy URL rather than the node URL directly:

```bash
VITE_MST_TESTNET_CHAIN_ID=31337
VITE_MST_TESTNET_RPC_URL=http://localhost:5173/hardhat-rpc
VITE_MANDIMINT_CONTRACT_ADDRESS=<deploy:local output>
```

The Vite proxy avoids the Hardhat node's CORS restriction on browser `POST` requests. Run `npm run test:integration` from the repository root to exercise the client against a temporary local node.

## Reads

Reads use a shared `JsonRpcProvider` with `staticNetwork: true`:

- `getBatch(batchId)`
- `getBatchAllocations(batchId)`
- `getFarmerAllocation(batchId, farmer)`
- `getFarmerAllocations(farmer)`
- `isManager(address)`
- `owner()`

Farmer history and batch allocations are unbounded arrays in the contract. Large histories may hit RPC result-size limits.

## Writes

`recordBatch` requires a Privy embedded wallet that is:

1. On the configured MST chain, verified through its EIP-1193 provider.
2. Authorized on-chain as a manager through `isManager`.

The UI validates IDs, quantities, prices, duplicate farmers, zero addresses, and the exact allocation total before calling the contract. The contract independently enforces the same structural rules.

`setManager` is owner-only and is not exposed in the UI. There is no payment, escrow, update, or delete function.

## Units

- Quantity: whole kilograms.
- Sale price: whole INR per metric tonne.
- Gross value is computed off-chain with BigInt: `quantityKg * salePriceInrPerTonne / 1000`, preserving the remainder.
