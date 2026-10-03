"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  connectWallet,
} from "@/lib/blockchain/relieftrack";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);

  async function refreshWallet() {
    if (
      typeof window === "undefined" ||
      !window.ethereum
    ) {
      setWalletChecked(true);
      return;
    }

    try {
      const accounts =
        await window.ethereum.request({
          method: "eth_accounts",
        });

      const rawChainId =
        await window.ethereum.request({
          method: "eth_chainId",
        });

      setChainId(rawChainId);

      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress("");
      }
    } catch (err) {
      console.error(
        "Unable to check MetaMask:",
        err
      );
    } finally {
      setWalletChecked(true);
    }
  }

  async function connect() {
    try {
      setError("");
      setIsConnecting(true);

      const wallet =
        await connectWallet();

      setAddress(wallet.address);

      const network =
        await wallet.provider.getNetwork();

      setChainId(
        `0x${Number(network.chainId).toString(16)}`
      );

      return wallet;
    } catch (err) {
      console.error(
        "MetaMask connection error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect MetaMask."
      );

      throw err;
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    setAddress("");
    setError("");
  }

  useEffect(() => {
    refreshWallet();

    if (
      typeof window === "undefined" ||
      !window.ethereum
    ) {
      return;
    }

    function handleChainChanged(
      newChainId
    ) {
      console.log(
        "MetaMask chain changed:",
        newChainId
      );

      setChainId(newChainId);

      // Clear the current wallet until
      // the application confirms the
      // new network/account.
      setAddress("");
    }

    function handleAccountsChanged(
      accounts
    ) {
      console.log(
        "MetaMask accounts changed:",
        accounts
      );

      if (accounts.length === 0) {
        setAddress("");
      } else {
        setAddress(accounts[0]);
      }
    }

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );

      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  const value = {
    address,
    chainId,
    error,
    isConnecting,
    walletChecked,
    isConnected: Boolean(address),
    connect,
    disconnect,
    refreshWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context =
    useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}