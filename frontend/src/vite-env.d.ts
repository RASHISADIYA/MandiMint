/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_PRIVY_CLIENT_ID?: string;
  readonly VITE_MST_TESTNET_CHAIN_ID?: string;
  readonly VITE_MST_TESTNET_RPC_URL?: string;
  readonly VITE_MST_TESTNET_EXPLORER_URL?: string;
  readonly VITE_MST_TESTNET_CURRENCY_SYMBOL?: string;
  readonly VITE_MST_TESTNET_CURRENCY_NAME?: string;
  readonly VITE_MST_TESTNET_CURRENCY_DECIMALS?: string;
  readonly VITE_MANDIMINT_API_BASE_URL?: string;
  readonly VITE_MANDIMINT_CONTRACT_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
