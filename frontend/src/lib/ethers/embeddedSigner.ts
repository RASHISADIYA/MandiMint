import { BrowserProvider, type Signer } from "ethers";
import type { ConnectedWallet } from "@privy-io/react-auth";

/**
 * Obtain an ethers v6 signer from a Privy embedded wallet (EIP-1193).
 */
export async function getEmbeddedEthersSigner(
  wallet: ConnectedWallet,
): Promise<Signer> {
  const eip1193 = await wallet.getEthereumProvider();
  const provider = new BrowserProvider(eip1193);
  return provider.getSigner();
}
