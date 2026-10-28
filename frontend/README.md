# MandiMint frontend

React + Vite + TypeScript UI for MandiMint. The Solidity contract and Hardhat tooling remain in the repository root.

## Commands

From the repository root:

```bash
npm run dev               # Vite dev server (frontend/)
npm run build             # Production build
npm run lint              # ESLint
npm run test:frontend     # Vitest unit tests
npm run test:integration  # Hardhat + contract-client integration test
```

Or from this directory:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run test:integration
```

## Configuration

Copy `.env.example` to `.env.local`. Every `VITE_*` value is public in the client bundle; never put secrets or private keys there.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_PRIVY_APP_ID` | Yes for auth | Public Privy app ID |
| `VITE_PRIVY_CLIENT_ID` | Optional | Privy app client ID |
| `VITE_MST_TESTNET_CHAIN_ID` | Yes for wallet/contract | MST Testnet chain ID |
| `VITE_MST_TESTNET_RPC_URL` | Yes for wallet/contract | MST Testnet RPC URL; use `http://localhost:5173/hardhat-rpc` for local Hardhat |
| `VITE_MST_TESTNET_EXPLORER_URL` | Recommended | Explorer used for transaction/address links |
| `VITE_MST_TESTNET_CURRENCY_SYMBOL` | Optional | Defaults to `tMSTC` |
| `VITE_MST_TESTNET_CURRENCY_NAME` | Optional | Defaults to `MST Testnet` |
| `VITE_MST_TESTNET_CURRENCY_DECIMALS` | Optional | Defaults to `18` |
| `VITE_MANDIMINT_API_BASE_URL` | Optional | Enables backend-authoritative roles; without it, the app offers a clearly labelled local role || `VITE_MANDIMINT_CONTRACT_ADDRESS` | Yes for chain data | Deployed MandiMint contract address |

The app does not fall back to a mock network, mock contract, or mock wallet. Missing role API configuration enables an explicit local role preference, not a server-verified role. Missing MST/contract configuration disables the dependent feature and shows an explicit notice.

### MST Testnet values

This repository does not hardcode official MST values. The values commonly documented for MST Testnet are:

- Chain ID: `91562037`
- RPC: `https://testnetrpc.mstblockchain.com`
- Explorer: `https://testnet.mstscan.com/`

Verify these against official MST documentation before use. The legacy MST Testnet publishes a migration notice directing users to MST Coral Testnet after **31 January 2027**. Confirm the target testnet before production.

### Local Hardhat integration

Use three terminals from the repository root:

```bash
# Terminal 1
npm run compile
npm run node

# Terminal 2
npm run deploy:local
```

`deploy:local` prints the chain ID, contract address, and the values to put in `frontend/.env.local`. The deployer is the owner and initial manager.

The browser must not call the Hardhat RPC URL directly: the node does not allow browser `POST` requests through CORS. Use the Vite proxy URL instead:

```bash
VITE_MST_TESTNET_CHAIN_ID=31337
VITE_MST_TESTNET_RPC_URL=http://localhost:5173/hardhat-rpc
VITE_MANDIMINT_CONTRACT_ADDRESS=<address printed by deploy:local>
```

Then run `npm run dev` from the repository root. If Hardhat is on a different port, start Vite with `LOCAL_HARDHAT_RPC_URL=http://127.0.0.1:<port> npm run dev`.

To test writes, authorize the embedded wallet that appears after Privy onboarding:

```bash
MANAGER_ADDRESS=0x... MANDIMINT_CONTRACT_ADDRESS=0x... npm run authorize:local
```

The local UI still requires a real `VITE_PRIVY_APP_ID`; authentication, OTPs, and wallets are never simulated. Without Privy credentials, use the integration test and contract reads directly rather than bypassing auth.

`npm run test:integration` starts its own temporary Hardhat node, deploys the contract, and verifies ABI parity, reads, a successful write, unauthorized-manager handling, wrong-network rejection, and wallet rejection handling through the frontend contract client.

## Authentication and onboarding

`PhoneOtpAuthPanel` uses Privy SMS OTP:

1. The user enters an Indian number (10 digits, or with `+91`) or an international E.164 number.
2. MandiMint requests a real one-time code from Privy.
3. After verification, `/onboarding` restores or creates the user's Privy embedded wallet.
4. The wallet's active chain is verified through its EIP-1193 provider, not inferred from env vars.
5. If a role backend is configured, the app fetches the authoritative role. Otherwise, onboarding asks the user to choose a local Farmer or FPO Admin workspace role.
6. Only a completed onboarding flow grants access to `/app/farmer` or `/app/manager`.

No OTP, wallet, or transaction is simulated.

### Privy and SMS for India

Privy's standard international SMS coverage does not include India (`+91`). Production use requires an eligible Scale/Enterprise plan with BYO Twilio or another supported SMS provider. Enable SMS in the Privy dashboard and add `http://localhost:5173` plus the production origin to the allowed origins.

The frontend is intentionally SMS-only (`loginMethods: ["sms"]`), defaults to country `IN`, and does not create a wallet at login (`createOnLogin: "off"`). The onboarding hook creates an embedded wallet only when the authenticated user has none.

### Role source: backend or local fallback

If `VITE_MANDIMINT_API_BASE_URL` is set, backend roles are authoritative and local roles are ignored. If it is unset, authentication and contract features still work, but onboarding asks the user to select a local workspace role stored on the device. Local roles are clearly labelled **not server-verified** and must not be treated as an authorization boundary. FPO batch writes remain gated by the contract’s on-chain `isManager` check.

To enable backend-authoritative roles, implement:

```http
GET {VITE_MANDIMINT_API_BASE_URL}/api/users/me
Authorization: Bearer <Privy access token>
Accept: application/json
```

Expected response:

```json
{
  "privyUserId": "did:privy:...",
  "role": "farmer",
  "displayName": "Optional display name"
}
```

`role` must be `"farmer"`, `"fpo_admin"`, or `null`. Invalid or missing roles are treated as unassigned; there is no server default and no fallback to a local role when the API is configured. The backend is responsible for authenticating the Privy token. Do not trust a role supplied by the client.

FPO batch writes have a second, independent gate: the connected wallet must be authorized by the contract owner through `isManager`. Neither a backend role nor a local role is enough to write a batch.

### Logout

Logout calls Privy `logout()`, clears local role hints, resets onboarding state, and returns to the landing page. It does not delete the embedded wallet or sign the user out of any identity provider globally.

## Contract integration

The frontend uses ethers v6 and the exact ABI in `src/lib/blockchain/mandiMintAbi.ts`.

Reads:

- `getBatch`
- `getBatchAllocations`
- `getFarmerAllocation`
- `getFarmerAllocations`
- `isManager`
- `owner`

Writes:

- `recordBatch` from an authorized manager wallet

`setManager` is owner-only and is not exposed in the UI. There is no payment, escrow, update, or delete flow.

Displayed values follow the contract units:

- Quantities: whole kilograms.
- Prices: whole INR per metric tonne.
- Reference gross value: exact BigInt calculation `quantityKg * priceInrPerTonne / 1000`, with the remainder shown rather than rounded.

Contract reads require `VITE_MANDIMINT_CONTRACT_ADDRESS`, `VITE_MST_TESTNET_CHAIN_ID`, and `VITE_MST_TESTNET_RPC_URL`. Writes additionally require a verified wallet on MST Testnet and on-chain manager authorization.

## Privacy and scope

- Phone numbers and other personal data are never written to the blockchain.
- Only wallet addresses, batch data, and allocation quantities are public on-chain.
- MandiMint does not move money, hold escrow, settle payments, or prove that a sale was paid.
- The app targets MST Testnet only; no Mainnet configuration is provided.

## Tests

```bash
npm run test
npm run test:integration
```

The unit suite covers formatting, validation, phone normalization, local role mapping, network chain matching, and contract error decoding. The integration suite uses a local Hardhat node and the frontend ABI/client to verify batch writes, reads, manager checks, ABI parity, wrong-network rejection, and unauthorized-manager errors.

Live Privy OTP, wallet provisioning, MST connectivity, and browser UI transactions cannot be exercised without real credentials and a deployed contract. The local Hardhat setup exercises the contract client, not Privy authentication.

## Code map

| Area | Path |
| --- | --- |
| Routes | `src/App.tsx` |
| Env parsing | `src/config/env.ts` |
| MST chain (viem) | `src/config/mstTestnetChain.ts` |
| Privy config | `src/providers/privyConfig.ts`, `AppProviders.tsx` |
| Phone OTP | `src/components/auth/PhoneOtpAuthPanel.tsx` |
| Wallet/network hook | `src/hooks/useWalletOnboarding.ts` |
| Network verification | `src/services/network/verifyMstNetwork.ts` |
| Role verification | `src/services/role/userRoleService.ts`, `src/hooks/useAuthoritativeRole.ts` |
| Onboarding orchestration | `src/hooks/usePostLoginOnboarding.ts`, `src/pages/OnboardingPage.tsx` |
| Route guards | `src/components/workspace/RequireAuth.tsx`, `RequireOnboarding.tsx`, `RoleRoute.tsx` |
| Contract client | `src/lib/blockchain/mandiMintContract.ts` |
| Contract ABI | `src/lib/blockchain/mandiMintAbi.ts` |
| Contract integration test | `src/lib/blockchain/mandiMintContract.integration.test.ts` |
| ethers signer | `src/lib/ethers/embeddedSigner.ts` |
| Formatting and validation | `src/lib/format.ts`, `src/lib/validation.ts` |
| Design tokens | `src/styles/tokens.css` |
