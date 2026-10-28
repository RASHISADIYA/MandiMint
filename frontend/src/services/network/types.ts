export type NetworkVerificationStatus =
  | "idle"
  | "unconfigured"
  | "wallet_unavailable"
  | "verifying"
  | "connected"
  | "wrong_network"
  | "unsupported_network"
  | "rpc_unavailable"
  | "provider_rejected"
  | "provider_unavailable";

export interface NetworkVerificationState {
  status: NetworkVerificationStatus;
  expectedChainId: number | null;
  actualChainId: number | null;
  message: string | null;
}
