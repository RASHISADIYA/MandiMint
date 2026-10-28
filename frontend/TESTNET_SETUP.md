# MandiMint — MST Testnet Frontend Setup Guide

> **Audience**: Developer connecting the frontend after Agent 1 confirms the contract is deployed.

---

## Prerequisites

- Node.js >= 18
- A Privy account with an app created at https://dashboard.privy.io
  - SMS (phone) login enabled
  - For India (+91) numbers: BYO Twilio or another SMS provider configured
- The verified contract address from Agent 1 (on MST Testnet, chain 91562037)

---

## Step 1 — Fill in frontend/.env.local

The file already contains the MST Testnet network values.
Add the two remaining lines:

    VITE_PRIVY_APP_ID=<your Privy app ID from the dashboard>
    VITE_MANDIMINT_CONTRACT_ADDRESS=<verified address from Agent 1>

NEVER invent or guess the contract address. If Agent 1 has not yet
confirmed deployment, leave VITE_MANDIMINT_CONTRACT_ADDRESS commented out.
The frontend will show a clear Contract not configured notice and will make
zero blockchain calls.

---

## Step 2 — (Optional) Configure a role backend

Without a backend, users choose a local workspace role on the onboarding screen.
Local roles do NOT grant on-chain manager privileges; recordBatch still
requires isManager on the contract.

To enable server-verified roles, set:

    VITE_MANDIMINT_API_BASE_URL=https://your-backend.example.com

---

## Step 3 — Start the dev server

    cd frontend
    npm install
    npm run dev

---

## Step 4 — Verify the demo flow

### Wallet connection and network detection

1. Open the app at http://localhost:5173
2. Click Sign in -> enter phone number -> enter SMS OTP
3. The onboarding screen automatically:
   - Creates a Privy embedded wallet
   - Switches the wallet to MST Testnet (chain 91562037)
   - Verifies the chain ID via eth_chainId through the wallet's EIP-1193 provider
4. The Wallet Setup card shows "Wallet ready on MST Testnet"

If the network switch fails, a "Retry switch" button appears.

### Reading batches (no wallet required for reads)

1. Navigate to Find a batch
2. Enter a batch ID recorded on-chain
3. The page calls getBatch(batchId) and getBatchAllocations(batchId)
4. You see: batch ID, crop ID, quantity (kg), sale price (INR/tonne), manager, timestamp, and allocations
5. The manager address links to https://testnet.mstscan.com/address/<manager>

### Recording a batch (requires isManager on-chain)

1. Sign in as a wallet authorized via setManager by the contract owner
2. Navigate to Record a batch (FPO Admin workspace)
3. Fill in Batch ID, Crop ID, Total quantity, Sale price, and farmer allocations
4. Click Record batch on-chain
5. Approve the transaction in the Privy wallet prompt
6. The UI shows: signing -> pending (with tx hash) -> confirmed (block number + explorer link)

### Farmer history

1. Navigate to My allocation history (Farmer workspace)
2. The farmer's embedded wallet address is pre-filled
3. Calls getFarmerAllocations(address) on the contract
4. Each row shows batch ID and allocated kg, with a link to the full batch record

---

## Contract authorization (critical for demo)

The contract constructor sets isManager[msg.sender] = true for the deployer.
To authorize additional FPO manager wallets, the contract owner calls:

    setManager(<wallet_address>, true)

The FPO admin's embedded wallet address is shown on the onboarding screen
(copy button available). Provide this address to the contract owner so they
can authorize it before the demo.

---

## Environment variables — complete reference

| Variable                           | Required          | Example value                           | Purpose                              |
|------------------------------------|-------------------|-----------------------------------------|--------------------------------------|
| VITE_PRIVY_APP_ID                  | Yes (for auth)    | clxxxxxxxx                              | Privy dashboard app ID               |
| VITE_PRIVY_CLIENT_ID               | No                |                                         | Optional Privy client ID             |
| VITE_MST_TESTNET_CHAIN_ID          | Yes               | 91562037                                | MST Testnet chain ID                 |
| VITE_MST_TESTNET_RPC_URL           | Yes               | https://testnetrpc.mstblockchain.com    | MST Testnet JSON-RPC                 |
| VITE_MST_TESTNET_EXPLORER_URL      | Recommended       | https://testnet.mstscan.com             | Block explorer (enables tx links)    |
| VITE_MST_TESTNET_CURRENCY_SYMBOL   | No                | tMSTC                                   | Token symbol                         |
| VITE_MST_TESTNET_CURRENCY_NAME     | No                | MST Testnet                             | Token name                           |
| VITE_MST_TESTNET_CURRENCY_DECIMALS | No                | 18                                      | Token decimals                       |
| VITE_MANDIMINT_CONTRACT_ADDRESS    | Yes (for contract)| 0x...                                   | Deployed MandiMint address           |
| VITE_MANDIMINT_API_BASE_URL        | No                | https://api.example.com                 | Role verification backend            |

All values are public/client-side. NEVER put private keys or secrets here.

---

## Remaining blockers

### 1. Contract address not yet available
Status: Waiting on Agent 1.
Impact: All contract reads and recordBatch writes are disabled.
Fix: Set VITE_MANDIMINT_CONTRACT_ADDRESS=<address> and restart the dev server.

### 2. Privy app ID required for authentication
Status: Not configured in .env.local.
Impact: The /auth page shows "Authentication not configured".
The landing page and public batch lookup work without it.
Fix: Create a Privy app at https://dashboard.privy.io, enable SMS login, and
set VITE_PRIVY_APP_ID=<your-app-id>.
Note: Privy standard SMS does not include India (+91) on basic plans.
For an India-number demo, configure BYO Twilio in the Privy dashboard.

### 3. isManager authorization on-chain
Status: Depends on contract deployment and wallet setup.
Impact: recordBatch will revert with NotManager if wallet is not authorized.
Fix: Copy the embedded wallet address from onboarding and ask the contract
owner to call setManager(<address>, true).

---

## What is NOT implemented (honest feature status)

| Claimed feature                   | Status                                                      |
|-----------------------------------|-------------------------------------------------------------|
| Automatic mUSD payouts            | NOT implemented. The contract has no payment function.      |
| Tokenized harvest shares          | NOT implemented. No token contract.                         |
| SMS authentication for India +91  | Requires Privy BYO SMS provider configuration.              |
| Real-time batch list / streaming  | NOT implemented. Lookup is by ID only (no enumeration).     |
| Role management UI                | setManager is owner-only and not exposed in the UI.         |

What IS implemented and ready:
- Wallet connection with Privy (phone OTP) + MST Testnet network detection
- recordBatch write with real transaction receipt and block number
- getBatch / getBatchAllocations reads with full detail display
- getFarmerAllocations read for farmer history
- isManager on-chain check before showing the record form
- Explorer links for transactions and addresses (requires VITE_MST_TESTNET_EXPLORER_URL)
- Contract error decoding (NotManager, AllocationTotalMismatch, BatchAlreadyExists, etc.)
- Loading / success / error / empty states on every data-reading page
- Signing -> pending -> confirmed transaction lifecycle with real tx hash

---

## Running tests

    # Unit tests (pure logic, no network)
    npm test

    # Integration tests (requires npm run compile at repo root first)
    npm run test:integration

    # Lint
    npm run lint

    # Production build
    npm run build

---

## Checklist for the demo

- [ ] Agent 1 has confirmed the contract address on MST Testnet
- [ ] VITE_MANDIMINT_CONTRACT_ADDRESS set in frontend/.env.local
- [ ] VITE_PRIVY_APP_ID set in frontend/.env.local
- [ ] Privy SMS configured for India (+91) or a non-India demo phone used
- [ ] FPO Admin embedded wallet address authorized via setManager on the contract
- [ ] Demo phone numbers signed in and onboarded
- [ ] At least one test batch recorded on-chain before the demo
