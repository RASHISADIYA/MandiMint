import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, Contract, formatEther, type Eip1193Provider, type Signer } from "ethers";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { MANDIMINT_ABI } from "../lib/blockchain/mandiMintAbi";
import { isPrivyConfigured } from "../config/env";
import { getEmbeddedEthersSigner } from "../lib/ethers/embeddedSigner";
import {
  getNetworkConfig,
  getNetworkConfigByChainId,
  MST_MAINNET_CONFIG,
  MST_TESTNET_CONFIG,
  type NetworkConfig,
  type NetworkId,
} from "../config/networks";
import { parseAddress } from "../lib/format";

export const MST_TESTNET_CHAIN_ID = 91562037;
export const MST_MAINNET_CHAIN_ID = 4646;

export const MST_NETWORKS = {
  testnet: {
    chainId: MST_TESTNET_CONFIG.chainId,
    hexChainId: MST_TESTNET_CONFIG.hexChainId,
    name: MST_TESTNET_CONFIG.name,
    rpcUrl: MST_TESTNET_CONFIG.rpcUrl,
    symbol: MST_TESTNET_CONFIG.currency.symbol,
    decimals: MST_TESTNET_CONFIG.currency.decimals,
    explorerUrl: MST_TESTNET_CONFIG.explorerUrl,
    faucetUrl: MST_TESTNET_CONFIG.faucetUrl,
  },
  mainnet: {
    chainId: MST_MAINNET_CONFIG.chainId,
    hexChainId: MST_MAINNET_CONFIG.hexChainId,
    name: MST_MAINNET_CONFIG.name,
    rpcUrl: MST_MAINNET_CONFIG.rpcUrl,
    symbol: MST_MAINNET_CONFIG.currency.symbol,
    decimals: MST_MAINNET_CONFIG.currency.decimals,
    explorerUrl: MST_MAINNET_CONFIG.explorerUrl,
    faucetUrl: MST_MAINNET_CONFIG.faucetUrl,
  },
} as const;

export interface Web3WalletContextType {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  networkName: string | null;
  isTestnet: boolean;
  isMainnet: boolean;
  isCorrectNetwork: boolean;
  selectedNetwork: NetworkId;
  setSelectedNetwork: (networkId: NetworkId) => void;
  selectedNetworkConfig: NetworkConfig;
  isNetworkMismatch: boolean;
  isContractConfigured: boolean;
  balance: string | null;
  rawBalance: bigint | null;
  isManager: boolean;
  isOwner: boolean;
  signer: Signer | null;
  browserProvider: BrowserProvider | null;
  walletType: "bridgekey" | "metamask" | "injected" | "privy" | null;
  isBridgeKeyInstalled: boolean;
  isConnecting: boolean;
  error: string | null;
  connectBridgeKey: () => Promise<void>;
  connectInjected: () => Promise<void>;
  disconnect: () => void;
  switchToMstTestnet: () => Promise<void>;
  switchToMstMainnet: () => Promise<void>;
  switchWalletToSelectedNetwork: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const Web3WalletContext = createContext<Web3WalletContextType | null>(null);

export interface ExtendedEthereumProvider extends Eip1193Provider {
  isBridgeKey?: boolean;
  isBridgekey?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    bridgekey?: ExtendedEthereumProvider;
  }
}

function getWindowEthereum(): ExtendedEthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as { ethereum?: unknown }).ethereum;
  return eth ? (eth as ExtendedEthereumProvider) : null;
}

const STORAGE_KEY_SELECTED_NETWORK = "mandimint.selected_network";

function getInitialSelectedNetwork(): NetworkId {
  if (typeof window === "undefined") return "mstTestnet";
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_NETWORK);
    if (saved === "mstMainnet" || saved === "mstTestnet") {
      return saved;
    }
  } catch {
    // Ignore localStorage access failures
  }
  return "mstTestnet";
}

interface PrivyEmbeddedWalletSyncProps {
  onSync: (wallet: ConnectedWallet) => Promise<void>;
  onLogout: () => void;
  onError: (error: string) => void;
  privyLogoutRef: { current: (() => Promise<void>) | null };
  privySwitchChainRef: { current: ((chainId: number) => Promise<void>) | null };
  activeEmbeddedWalletRef: { current: ConnectedWallet | null };
}

function PrivyEmbeddedWalletSync({
  onSync,
  onLogout,
  onError,
  privyLogoutRef,
  privySwitchChainRef,
  activeEmbeddedWalletRef,
}: PrivyEmbeddedWalletSyncProps) {
  const { ready, authenticated, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const isCreatingRef = useRef(false);
  const prevAuthenticatedRef = useRef(false);
  const syncedAddressRef = useRef<string | null>(null);

  useEffect(() => {
    privyLogoutRef.current = logout;
    return () => {
      privyLogoutRef.current = null;
    };
  }, [logout, privyLogoutRef]);

  const embeddedWallet = useMemo(() => {
    return wallets.find((w) => w.walletClientType === "privy") ?? null;
  }, [wallets]);

  useEffect(() => {
    activeEmbeddedWalletRef.current = embeddedWallet;
    if (embeddedWallet) {
      privySwitchChainRef.current = async (chainId: number) => {
        await embeddedWallet.switchChain(chainId);
      };
      return () => {
        privySwitchChainRef.current = null;
      };
    }
  }, [embeddedWallet, privySwitchChainRef, activeEmbeddedWalletRef]);

  // Automatically trigger embedded wallet creation if authenticated user has none
  useEffect(() => {
    if (!ready || !authenticated || !walletsReady) {
      return;
    }
    if (embeddedWallet || isCreatingRef.current) {
      return;
    }
    isCreatingRef.current = true;
    createWallet()
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to create embedded wallet.";
        onError(msg);
      })
      .finally(() => {
        isCreatingRef.current = false;
      });
  }, [ready, authenticated, walletsReady, embeddedWallet, createWallet, onError]);

  // Sync embedded wallet into Web3WalletContext when authenticated and wallet is available
  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      if (prevAuthenticatedRef.current) {
        prevAuthenticatedRef.current = false;
        syncedAddressRef.current = null;
        onLogout();
      }
      return;
    }

    prevAuthenticatedRef.current = true;

    if (embeddedWallet?.address) {
      if (syncedAddressRef.current !== embeddedWallet.address) {
        syncedAddressRef.current = embeddedWallet.address;
        void onSync(embeddedWallet);
      }
    }
  }, [ready, authenticated, embeddedWallet, onSync, onLogout]);

  return null;
}

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const [selectedNetwork, setSelectedNetworkState] = useState<NetworkId>(getInitialSelectedNetwork);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [rawBalance, setRawBalance] = useState<bigint | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | null>(null);
  const [walletType, setWalletType] = useState<"bridgekey" | "metamask" | "injected" | "privy" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authRequestIdRef = useRef(0);
  const rawProviderRef = useRef<ExtendedEthereumProvider | null>(null);
  const activeEmbeddedWalletRef = useRef<ConnectedWallet | null>(null);
  const privyLogoutFnRef = useRef<(() => Promise<void>) | null>(null);
  const privySwitchChainFnRef = useRef<((chainId: number) => Promise<void>) | null>(null);
  const listenersRef = useRef<{
    onAccountsChanged?: (...args: unknown[]) => void;
    onChainChanged?: (...args: unknown[]) => void;
  }>({});

  const selectedNetworkConfig = useMemo(
    () => getNetworkConfig(selectedNetwork),
    [selectedNetwork]
  );

  const detachListeners = useCallback(() => {
    const raw = rawProviderRef.current;
    const { onAccountsChanged, onChainChanged } = listenersRef.current;
    if (raw && typeof raw.removeListener === "function") {
      if (onAccountsChanged) {
        raw.removeListener("accountsChanged", onAccountsChanged);
      }
      if (onChainChanged) {
        raw.removeListener("chainChanged", onChainChanged);
      }
    }
    rawProviderRef.current = null;
    listenersRef.current = {};
  }, []);

  useEffect(() => {
    return () => {
      detachListeners();
    };
  }, [detachListeners]);

  const setSelectedNetwork = useCallback((networkId: NetworkId) => {
    authRequestIdRef.current += 1;
    setIsManager(false);
    setIsOwner(false);
    setSelectedNetworkState(networkId);
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_NETWORK, networkId);
    } catch {
      // Ignore localStorage failure
    }
  }, []);

  const isBridgeKeyInstalled = typeof window !== "undefined" && Boolean(
    window.bridgekey || (getWindowEthereum() && (getWindowEthereum()?.isBridgeKey || getWindowEthereum()?.isBridgekey))
  );

  const getInjectedProvider = useCallback((preferBridgeKey = false): ExtendedEthereumProvider | null => {
    if (typeof window === "undefined") return null;
    if (preferBridgeKey && window.bridgekey) {
      return window.bridgekey;
    }
    return getWindowEthereum();
  }, []);

  const refreshState = useCallback(async () => {
    if (!address || !browserProvider) {
      setIsManager(false);
      setIsOwner(false);
      return;
    }

    const currentReqId = ++authRequestIdRef.current;

    try {
      const net = await browserProvider.getNetwork();
      if (authRequestIdRef.current !== currentReqId) return;

      const currentChainId = Number(net.chainId);
      setChainId(currentChainId);

      const bal = await browserProvider.getBalance(address);
      if (authRequestIdRef.current !== currentReqId) return;

      setRawBalance(bal);
      setBalance(Number(formatEther(bal)).toFixed(4));

      // Check on-chain manager & owner for the selected network's contract ONLY
      const contractAddr = selectedNetworkConfig.contractAddress;
      const isCorrectChain = currentChainId === selectedNetworkConfig.chainId;

      if (contractAddr && isCorrectChain) {
        const contract = new Contract(
          contractAddr,
          MANDIMINT_ABI,
          browserProvider
        );

        let mgr = false;
        let own = false;

        try {
          mgr = Boolean(await contract.isManager(address));
        } catch {
          mgr = false;
        }

        try {
          const ownerAddr = await contract.owner();
          own = typeof ownerAddr === "string" && ownerAddr.toLowerCase() === address.toLowerCase();
        } catch {
          own = false;
        }

        if (authRequestIdRef.current === currentReqId) {
          setIsManager(mgr);
          setIsOwner(own);
        }
      } else {
        // Contract not configured on this network or wallet is on wrong chain
        if (authRequestIdRef.current === currentReqId) {
          setIsManager(false);
          setIsOwner(false);
        }
      }
    } catch (err) {
      if (authRequestIdRef.current === currentReqId) {
        setIsManager(false);
        setIsOwner(false);
      }
      console.warn("Could not refresh Web3 wallet state:", err);
    }
  }, [address, browserProvider, selectedNetworkConfig]);

  const connectProvider = useCallback(
    async (rawProvider: ExtendedEthereumProvider | null, type: "bridgekey" | "injected") => {
      if (!rawProvider) {
        throw new Error(
          type === "bridgekey"
            ? "BridgeKey Wallet extension is not installed. Please install it from Chrome Web Store."
            : "No injected Web3 wallet found. Please install BridgeKey or MetaMask."
        );
      }

      setIsConnecting(true);
      setError(null);
      detachListeners();

      try {
        const accounts = (await rawProvider.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts authorized by user.");
        }

        const checksummed = parseAddress(accounts[0]);
        if (!checksummed) {
          throw new Error("Invalid EVM address returned by wallet provider.");
        }

        const provider = new BrowserProvider(rawProvider);
        const userSigner = await provider.getSigner();
        const network = await provider.getNetwork();
        const activeChainId = Number(network.chainId);

        // Immediately clear previous permissions and start request tracking
        const currentReqId = ++authRequestIdRef.current;
        setIsManager(false);
        setIsOwner(false);

        setAddress(checksummed);
        setChainId(activeChainId);
        setBrowserProvider(provider);
        setSigner(userSigner);
        setWalletType(type);

        // Fetch balance
        const bal = await provider.getBalance(checksummed);
        if (authRequestIdRef.current === currentReqId) {
          setRawBalance(bal);
          setBalance(Number(formatEther(bal)).toFixed(4));
        }

        // Check on-chain manager and owner
        const contractAddr = selectedNetworkConfig.contractAddress;
        const isCorrectChain = activeChainId === selectedNetworkConfig.chainId;

        if (contractAddr && isCorrectChain) {
          const contract = new Contract(contractAddr, MANDIMINT_ABI, provider);
          let mgr = false;
          let own = false;

          try {
            mgr = Boolean(await contract.isManager(checksummed));
          } catch {
            mgr = false;
          }

          try {
            const ownerAddr = await contract.owner();
            own = typeof ownerAddr === "string" && ownerAddr.toLowerCase() === checksummed.toLowerCase();
          } catch {
            own = false;
          }

          if (authRequestIdRef.current === currentReqId) {
            setIsManager(mgr);
            setIsOwner(own);
          }
        } else {
          if (authRequestIdRef.current === currentReqId) {
            setIsManager(false);
            setIsOwner(false);
          }
        }

        // Attach listeners with immediate state clearing
        if (typeof rawProvider.on === "function") {
          const onAccountsChanged = (...args: unknown[]) => {
            authRequestIdRef.current += 1;
            setIsManager(false);
            setIsOwner(false);

            const newAccounts = args[0] as string[];
            if (!newAccounts || newAccounts.length === 0) {
              setAddress(null);
              setSigner(null);
              setWalletType(null);
              setBalance(null);
              setRawBalance(null);
              setError(null);
            } else {
              const nextAddress = parseAddress(newAccounts[0]);
              setAddress(nextAddress);
              provider.getSigner().then((nextSigner) => {
                setSigner(nextSigner);
              }).catch(() => {
                setSigner(null);
              });
            }
          };

          const onChainChanged = (...args: unknown[]) => {
            authRequestIdRef.current += 1;
            setIsManager(false);
            setIsOwner(false);

            const hexChainId = args[0] as string;
            const newChainId = parseInt(hexChainId, 16);
            setChainId(newChainId);
            const matchedNetwork = getNetworkConfigByChainId(newChainId);
            if (matchedNetwork) {
              setSelectedNetworkState(matchedNetwork.id);
              try {
                localStorage.setItem(STORAGE_KEY_SELECTED_NETWORK, matchedNetwork.id);
              } catch {
                // Ignore storage failure
              }
            }
          };

          rawProvider.on("accountsChanged", onAccountsChanged);
          rawProvider.on("chainChanged", onChainChanged);

          rawProviderRef.current = rawProvider;
          listenersRef.current = {
            onAccountsChanged,
            onChainChanged,
          };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to connect wallet.";
        setError(message);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [detachListeners, selectedNetworkConfig]
  );

  const connectBridgeKey = useCallback(async () => {
    const raw = getInjectedProvider(true);
    await connectProvider(raw, "bridgekey");
  }, [connectProvider, getInjectedProvider]);

  const connectInjected = useCallback(async () => {
    const raw = getInjectedProvider(false);
    await connectProvider(raw, "injected");
  }, [connectProvider, getInjectedProvider]);

  const syncEmbeddedWallet = useCallback(
    async (wallet: ConnectedWallet) => {
      const checksummed = parseAddress(wallet.address);
      if (!checksummed) {
        setError("Invalid address returned by embedded wallet.");
        return;
      }

      setIsConnecting(true);
      setError(null);
      detachListeners();

      const currentReqId = ++authRequestIdRef.current;
      setIsManager(false);
      setIsOwner(false);

      try {
        const eip1193 = await wallet.getEthereumProvider();
        const provider = new BrowserProvider(eip1193);
        const userSigner = await getEmbeddedEthersSigner(wallet);
        const net = await provider.getNetwork();
        const activeChainId = Number(net.chainId);

        if (authRequestIdRef.current !== currentReqId) return;

        setAddress(checksummed);
        setChainId(activeChainId);
        setBrowserProvider(provider);
        setSigner(userSigner);
        setWalletType("privy");

        // Fetch balance
        try {
          const bal = await provider.getBalance(checksummed);
          if (authRequestIdRef.current === currentReqId) {
            setRawBalance(bal);
            setBalance(Number(formatEther(bal)).toFixed(4));
          }
        } catch {
          if (authRequestIdRef.current === currentReqId) {
            setRawBalance(0n);
            setBalance("0.0000");
          }
        }

        // Check on-chain manager and owner for selected network contract
        const contractAddr = selectedNetworkConfig.contractAddress;
        const isCorrectChain = activeChainId === selectedNetworkConfig.chainId;

        if (contractAddr && isCorrectChain) {
          const contract = new Contract(contractAddr, MANDIMINT_ABI, provider);
          let mgr = false;
          let own = false;

          try {
            mgr = Boolean(await contract.isManager(checksummed));
          } catch {
            mgr = false;
          }

          try {
            const ownerAddr = await contract.owner();
            own = typeof ownerAddr === "string" && ownerAddr.toLowerCase() === checksummed.toLowerCase();
          } catch {
            own = false;
          }

          if (authRequestIdRef.current === currentReqId) {
            setIsManager(mgr);
            setIsOwner(own);
          }
        } else {
          if (authRequestIdRef.current === currentReqId) {
            setIsManager(false);
            setIsOwner(false);
          }
        }

        // Attach listeners if provider supports .on
        const extProvider = eip1193 as ExtendedEthereumProvider;
        if (typeof extProvider.on === "function") {
          const onAccountsChanged = (...args: unknown[]) => {
            authRequestIdRef.current += 1;
            setIsManager(false);
            setIsOwner(false);

            const newAccounts = args[0] as string[];
            if (!newAccounts || newAccounts.length === 0) {
              setAddress(null);
              setSigner(null);
              setWalletType(null);
              setBalance(null);
              setRawBalance(null);
              setError(null);
            } else {
              const nextAddress = parseAddress(newAccounts[0]);
              setAddress(nextAddress);
              provider
                .getSigner()
                .then((nextSigner) => {
                  setSigner(nextSigner);
                })
                .catch(() => {
                  setSigner(null);
                });
            }
          };

          const onChainChanged = (...args: unknown[]) => {
            authRequestIdRef.current += 1;
            setIsManager(false);
            setIsOwner(false);

            const hexChainId = args[0] as string;
            const newChainId = parseInt(hexChainId, 16);
            setChainId(newChainId);
            const matchedNetwork = getNetworkConfigByChainId(newChainId);
            if (matchedNetwork) {
              setSelectedNetworkState(matchedNetwork.id);
              try {
                localStorage.setItem(STORAGE_KEY_SELECTED_NETWORK, matchedNetwork.id);
              } catch {
                // Ignore storage failure
              }
            }
          };

          extProvider.on("accountsChanged", onAccountsChanged);
          extProvider.on("chainChanged", onChainChanged);

          rawProviderRef.current = extProvider;
          listenersRef.current = {
            onAccountsChanged,
            onChainChanged,
          };
        }
      } catch (err: unknown) {
        if (authRequestIdRef.current === currentReqId) {
          const message = err instanceof Error ? err.message : "Failed to initialize embedded wallet.";
          setError(message);
        }
      } finally {
        if (authRequestIdRef.current === currentReqId) {
          setIsConnecting(false);
        }
      }
    },
    [detachListeners, selectedNetworkConfig],
  );

  const handlePrivyLogout = useCallback(() => {
    if (walletType === "privy") {
      authRequestIdRef.current += 1;
      detachListeners();
      activeEmbeddedWalletRef.current = null;
      setAddress(null);
      setChainId(null);
      setBalance(null);
      setRawBalance(null);
      setIsManager(false);
      setIsOwner(false);
      setSigner(null);
      setBrowserProvider(null);
      setWalletType(null);
      setError(null);
    }
  }, [detachListeners, walletType]);

  const disconnect = useCallback(() => {
    authRequestIdRef.current += 1;
    detachListeners();
    activeEmbeddedWalletRef.current = null;
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setRawBalance(null);
    setIsManager(false);
    setIsOwner(false);
    setSigner(null);
    setBrowserProvider(null);
    setWalletType(null);
    setError(null);

    if (privyLogoutFnRef.current) {
      privyLogoutFnRef.current().catch((err) => {
        console.warn("Privy logout error during disconnect:", err);
      });
    }
  }, [detachListeners]);

  const switchNetworkHelper = useCallback(
    async (targetConfig: NetworkConfig) => {
      if (walletType === "privy") {
        const embedded = activeEmbeddedWalletRef.current;
        if (!embedded) {
          throw new Error("No embedded wallet available to switch network.");
        }

        await embedded.switchChain(targetConfig.chainId);
        // Note: As specified in Privy docs, re-request ethereum provider after switchChain
        const eip1193 = await embedded.getEthereumProvider();
        const newProvider = new BrowserProvider(eip1193);
        const newSigner = await getEmbeddedEthersSigner(embedded);
        const net = await newProvider.getNetwork();
        const newChainId = Number(net.chainId);

        const currentReqId = ++authRequestIdRef.current;
        setIsManager(false);
        setIsOwner(false);

        setBrowserProvider(newProvider);
        setSigner(newSigner);
        setChainId(newChainId);

        if (address) {
          try {
            const bal = await newProvider.getBalance(address);
            if (authRequestIdRef.current === currentReqId) {
              setRawBalance(bal);
              setBalance(Number(formatEther(bal)).toFixed(4));
            }
          } catch {
            // ignore balance error
          }

          if (targetConfig.contractAddress && newChainId === targetConfig.chainId) {
            try {
              const contract = new Contract(targetConfig.contractAddress, MANDIMINT_ABI, newProvider);
              const mgr = Boolean(await contract.isManager(address));
              const ownerAddr = await contract.owner();
              const own = typeof ownerAddr === "string" && ownerAddr.toLowerCase() === address.toLowerCase();

              if (authRequestIdRef.current === currentReqId) {
                setIsManager(mgr);
                setIsOwner(own);
              }
            } catch {
              if (authRequestIdRef.current === currentReqId) {
                setIsManager(false);
                setIsOwner(false);
              }
            }
          }
        }
        return;
      }

      const raw = getInjectedProvider(walletType === "bridgekey");
      if (!raw) throw new Error("No wallet provider detected.");

      try {
        await raw.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetConfig.hexChainId }],
        });
      } catch (switchError: unknown) {
        const errObj = switchError as { code?: number; data?: { originalError?: { code?: number } } };
        // Error 4902 indicates chain has not been added yet
        if (errObj.code === 4902 || errObj.data?.originalError?.code === 4902) {
          await raw.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetConfig.hexChainId,
                chainName: targetConfig.name,
                rpcUrls: [targetConfig.rpcUrl],
                nativeCurrency: {
                  name: targetConfig.currency.name,
                  symbol: targetConfig.currency.symbol,
                  decimals: targetConfig.currency.decimals,
                },
                blockExplorerUrls: targetConfig.explorerUrl
                  ? [targetConfig.explorerUrl]
                  : undefined,
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    },
    [address, getInjectedProvider, walletType]
  );

  const switchToMstTestnet = useCallback(async () => {
    await switchNetworkHelper(MST_TESTNET_CONFIG);
    setSelectedNetwork("mstTestnet");
  }, [switchNetworkHelper, setSelectedNetwork]);

  const switchToMstMainnet = useCallback(async () => {
    await switchNetworkHelper(MST_MAINNET_CONFIG);
    setSelectedNetwork("mstMainnet");
  }, [switchNetworkHelper, setSelectedNetwork]);

  const switchWalletToSelectedNetwork = useCallback(async () => {
    await switchNetworkHelper(selectedNetworkConfig);
  }, [selectedNetworkConfig, switchNetworkHelper]);

  useEffect(() => {
    if (address && browserProvider) {
      refreshState();
    }
  }, [address, chainId, refreshState, browserProvider, selectedNetwork]);

  const isTestnet = chainId === MST_TESTNET_CHAIN_ID;
  const isMainnet = chainId === MST_MAINNET_CHAIN_ID;
  const isCorrectNetwork = isTestnet || isMainnet;
  const isNetworkMismatch = Boolean(address && chainId !== selectedNetworkConfig.chainId);
  const isContractConfigured = Boolean(selectedNetworkConfig.contractAddress);

  const networkName = useMemo(() => {
    if (isTestnet) return "MST Testnet";
    if (isMainnet) return "MST Mainnet";
    if (chainId) return `Chain #${chainId}`;
    return null;
  }, [chainId, isMainnet, isTestnet]);

  const value = useMemo<Web3WalletContextType>(
    () => ({
      connected: Boolean(address),
      address,
      chainId,
      networkName,
      isTestnet,
      isMainnet,
      isCorrectNetwork,
      selectedNetwork,
      setSelectedNetwork,
      selectedNetworkConfig,
      isNetworkMismatch,
      isContractConfigured,
      balance,
      rawBalance,
      isManager,
      isOwner,
      signer,
      browserProvider,
      walletType,
      isBridgeKeyInstalled,
      isConnecting,
      error,
      connectBridgeKey,
      connectInjected,
      disconnect,
      switchToMstTestnet,
      switchToMstMainnet,
      switchWalletToSelectedNetwork,
      refreshState,
    }),
    [
      address,
      balance,
      browserProvider,
      chainId,
      connectBridgeKey,
      connectInjected,
      disconnect,
      error,
      isBridgeKeyInstalled,
      isConnecting,
      isContractConfigured,
      isCorrectNetwork,
      isMainnet,
      isManager,
      isNetworkMismatch,
      isOwner,
      isTestnet,
      networkName,
      rawBalance,
      refreshState,
      selectedNetwork,
      selectedNetworkConfig,
      setSelectedNetwork,
      signer,
      switchToMstMainnet,
      switchToMstTestnet,
      switchWalletToSelectedNetwork,
      walletType,
    ]
  );

  return (
    <Web3WalletContext.Provider value={value}>
      {isPrivyConfigured() && (
        <PrivyEmbeddedWalletSync
          onSync={syncEmbeddedWallet}
          onLogout={handlePrivyLogout}
          onError={(msg) => setError(msg)}
          privyLogoutRef={privyLogoutFnRef}
          privySwitchChainRef={privySwitchChainFnRef}
          activeEmbeddedWalletRef={activeEmbeddedWalletRef}
        />
      )}
      {children}
    </Web3WalletContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWeb3Wallet(): Web3WalletContextType {
  const ctx = useContext(Web3WalletContext);
  if (!ctx) {
    throw new Error("useWeb3Wallet must be used within a Web3WalletProvider");
  }
  return ctx;
}
