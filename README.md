# MandiMint

Minimal Solidity smart contract for recording crop sale batches and farmer quantity allocations on the MST Testnet.

MandiMint is an auditable recordkeeping system. It does not transfer funds or tokens, hold escrow, calculate gross sale values, settle payments, or guarantee that a sale has been paid. Farmer wallet addresses are public blockchain identifiers; no names, phone numbers, email addresses, Aadhaar numbers, bank details, or other personal information are stored on-chain.

## Requirements

- Node.js 22
- npm 10

The project was set up with Node.js `22.23.2` and npm `10.9.8`.

## Frontend (Person B)

React + Vite app in `frontend/`. Phone/SMS OTP, embedded wallet onboarding, backend-authoritative roles with an explicit local fallback, MST Testnet verification, and contract integration are documented in **`frontend/README.md`**.

```bash
npm run dev               # Vite dev server
npm run build             # Frontend production build
npm run test:frontend     # Vitest unit tests
npm run test:integration  # Local Hardhat + frontend contract-client test
```

The frontend does not simulate authentication, wallets, or transactions. If `VITE_MANDIMINT_API_BASE_URL` is configured, roles are backend-authoritative; otherwise onboarding offers a clearly labelled local role preference. Batch writes always require an on-chain authorized manager wallet.

## Setup and tests

```bash
npm install
npm run compile
npm test
```

Useful commands:

| Command | Purpose |
|---|---|
| `npm run compile` | Compile contracts with Solidity `0.8.24` |
| `npm test` | Run the Hardhat test suite |
| `npm run node` | Start a local Hardhat JSON-RPC node |
| `npm run deploy:local` | Deploy to the running local Hardhat node |
| `npm run authorize:local` | Authorize a local wallet as a manager |
| `npm run test:integration` | Run the frontend/client integration suite against a temporary local node |
| `npm run deploy:mst` | Deploy to the configured MST Testnet network |

The Hardhat and frontend integration suites run against local Hardhat networks. No live network is required for compilation or tests.

## Local frontend integration

From the repository root:

```bash
npm run compile
npm run node
```

In a second terminal:

```bash
npm run deploy:local
```

Use the printed address in `frontend/.env.local`:

```bash
VITE_MST_TESTNET_CHAIN_ID=31337
VITE_MST_TESTNET_RPC_URL=http://localhost:5173/hardhat-rpc
VITE_MANDIMINT_CONTRACT_ADDRESS=<address printed by deploy:local>
```

`VITE_MST_TESTNET_RPC_URL` must point at the Vite proxy, not directly at `127.0.0.1:8545`, because the Hardhat node blocks browser `POST` requests through CORS. Start the UI with `npm run dev`.

A Privy embedded wallet is not the local deployer. After onboarding, copy its address and run:

```bash
MANAGER_ADDRESS=0x... MANDIMINT_CONTRACT_ADDRESS=0x... npm run authorize:local
```

The UI still needs a real `VITE_PRIVY_APP_ID`; authentication and wallets are not simulated. Without Privy credentials, the local contract client can be verified with `npm run test:integration`.

## Project structure

```text
contracts/MandiMint.sol        MandiMint contract
scripts/deploy.js              MST Testnet deployment script
scripts/deploy-local.js        Local Hardhat deployment script
scripts/authorize-local-manager.js  Local manager authorization helper
test/MandiMint.test.js         Automated contract tests
frontend/                      React/Vite frontend and integration tests
hardhat.config.js              Hardhat and Solidity configuration
package.json                   Pinned dependencies and scripts
```

## Contract overview

### Batch data

Each batch stores:

- `batchId`: unique nonzero identifier.
- `cropId`: nonzero crop identifier.
- `totalQuantityKg`: total crop quantity in whole kilograms.
- `salePriceInrPerTonne`: sale price in whole INR per metric tonne.
- `createdAt`: block timestamp when the batch was recorded.
- `manager`: authorized manager that recorded the batch.
- `exists`: explicit existence indicator.

Farmer allocations are stored separately by wallet address and quantity in kilograms.

### Functions

| Function | Access | Purpose |
|---|---|---|
| `setManager(address manager, bool authorized)` | Owner | Authorize or revoke a batch manager |
| `recordBatch(uint256 batchId, uint256 cropId, uint256 totalQuantityKg, uint256 salePriceInrPerTonne, address[] farmers, uint256[] quantitiesKg)` | Manager | Record a batch and all farmer allocations |
| `getBatch(uint256 batchId)` | Anyone | Return batch details |
| `getBatchAllocations(uint256 batchId)` | Anyone | Return all farmer addresses and quantities for a batch |
| `getFarmerAllocation(uint256 batchId, address farmer)` | Anyone | Return one farmer's quantity within a batch |
| `getFarmerBatches(address farmer)` | Anyone | Return the batch IDs in a farmer's history |
| `getFarmerAllocations(address farmer)` | Anyone | Return a farmer's batch IDs and quantities together |

`getBatch`, `getBatchAllocations`, and `getFarmerAllocation` revert with `BatchNotFound` for an unknown batch.

## Authorization

- The deployer is the immutable `owner`.
- The deployer is also the initial manager.
- Only the owner can authorize or revoke managers through `setManager`.
- Only authorized managers can call `recordBatch`.
- Owner administration is independent of the owner's manager status. Revoking the owner's manager role does not prevent the owner from managing managers.
- There is no ownership-transfer function in this MVP.

## Validation rules

`recordBatch` reverts unless all of the following are true:

1. The caller is an authorized manager.
2. `batchId` is nonzero and has never been recorded.
3. `cropId` is nonzero.
4. `totalQuantityKg` is nonzero.
5. `salePriceInrPerTonne` is nonzero.
6. Both array arguments are nonempty and have equal lengths.
7. Every farmer address is nonzero.
8. Every allocation quantity is nonzero.
9. No farmer address appears more than once in the batch.
10. The allocation sum equals `totalQuantityKg` exactly.

All addresses, quantities, duplicates, and the exact allocation sum are validated before persistent batch or allocation data is written. The EVM reverts the entire transaction on failure, so no partial batch, allocation, history entry, or event is retained.

Duplicate detection compares each farmer against previously seen farmers, making validation quadratic in the number of allocations. Keep batch sizes operationally reasonable.

## Units and integer arithmetic

- Quantity: whole kilograms.
- Price: whole INR per metric tonne.
- `1 metric tonne = 1,000 kg`.

The contract does not calculate a gross sale value. Off-chain consumers should use exact integer numerator/denominator arithmetic:

```text
numerator   = totalQuantityKg * salePriceInrPerTonne
denominator = 1000
gross INR   = numerator / 1000
remainder   = numerator % 1000
```

The remainder must be preserved. Do not silently round or truncate a fractional rupee. Display the exact quotient and remainder, normally as up to three decimal places of INR.

Examples:

- `1,000 kg × ₹2,500/tonne = ₹2,500`
- `1,500 kg × ₹2,500/tonne = ₹3,750`
- `1 kg × ₹2,500/tonne = ₹2.500` (not a whole rupee)
- `1 kg × ₹2,501/tonne = ₹2.501` (not representable in whole paise)

JavaScript consumers should use `BigInt` for off-chain price arithmetic when values may exceed the safe integer range. Solidity does not support native floating-point arithmetic.

## Events

- `BatchRecorded(batchId indexed, cropId indexed, manager indexed, totalQuantityKg, salePriceInrPerTonne, farmerCount, createdAt)`
- `FarmerAllocated(batchId indexed, farmer indexed, quantityKg)`
- `ManagerUpdated(manager indexed, authorized)`

## Security assumptions and limitations

- No external calls, token transfers, payments, or payable functions exist, so there is no reentrancy surface.
- Managers are trusted to submit accurate operational records. The contract validates structure, uniqueness, and allocation totals, not the real-world truth of the data.
- Records are append-only. There are no update or delete functions.
- Farmer history and batch allocation reads return unbounded arrays. They are inexpensive for off-chain `view` calls, but RPC providers may impose result-size limits for very large histories.
- Large batch arrays can exceed block gas limits. The transaction reverts and no state is written.
- `createdAt` is a block timestamp, not a legally authoritative timestamp.
- The contract has no upgrade mechanism.
- Anyone can read the public batch and allocation data, including farmer addresses.

## MST Testnet deployment prerequisites

Deployment is configured with the official MST Testnet values as documented defaults. The `mstTestnet` Hardhat network is always defined, so it no longer depends on an environment variable being present:

- MST Testnet RPC URL: `https://testnetrpc.mstblockchain.com` (override with `MST_TESTNET_RPC_URL`).
- MST Testnet chain ID: `91562037` (fixed in `hardhat.config.js`).

A funded deployer private key is still required. It is read only from `MST_TESTNET_DEPLOYER_PRIVATE_KEY` and is never printed, logged, or written to disk.

Export the required environment variables in the shell:

```bash
export MST_TESTNET_RPC_URL="https://testnetrpc.mstblockchain.com"
export MST_TESTNET_CHAIN_ID="91562037"
export MST_TESTNET_DEPLOYER_PRIVATE_KEY="<deployer private key>"
```

After the first successful deployment, record the canonical contract address:

```bash
export MANDIMINT_CONTRACT_ADDRESS="<deployed contract address>"
```

The deployment script:

- Refuses to run unless the selected network is `mstTestnet`.
- Refuses to run when `MST_TESTNET_DEPLOYER_PRIVATE_KEY` is missing or malformed, before any transaction is attempted.
- Requires `MST_TESTNET_CHAIN_ID`.
- Compares the configured chain ID with the live provider chain ID and aborts on mismatch.
- Writes a deployment record to `deployments/mstTestnet/MandiMint.json` after a successful deployment. The record holds the public contract address, deployment transaction hash, deployer address, and chain ID. It contains no private key and is excluded from version control by `.gitignore`.
- Reads `MANDIMINT_CONTRACT_ADDRESS` before deploying. If it is set and already holds contract bytecode on MST Testnet, the script aborts and reports that the existing deployment must be reused. If it is set but holds no bytecode, or is not a valid address, the script also aborts.
- Reads the deployment record when `MANDIMINT_CONTRACT_ADDRESS` is unset, so forgetting that variable after the first deployment cannot create a second contract.
- Scans the deployer's own prior contract creations on chain and aborts if it already created a MandiMint contract, so a duplicate is still prevented when both the variable and the record file are missing.
- Never deploys a replacement or duplicate contract, and never guesses an address.
- Prints the deployer address and deployed contract address, but never prints the private key.

The deployment record is a local safety net. The portable record of the deployment is the address and transaction hash published in this README and in `frontend/.env.local`.

Compilation and the full test suite run without `MST_TESTNET_DEPLOYER_PRIVATE_KEY`.

Deploy only after the funded deployer account has been verified:

```bash
npm run deploy:mst
```

Never commit a `.env` file, private key, or other deployment credentials. The repository `.gitignore` excludes environment files, keys, dependencies, build artifacts, caches, coverage output, and deployment records.

## License

MIT
