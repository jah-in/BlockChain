"use client";

import {
  useWallet,
} from "@/components/WalletProvider";

export default function BlockchainWallet() {
  const {
    address,
    chainId,
    error,
    isConnecting,
    connect,
  } = useWallet();

  async function handleConnect() {
    try {
      await connect();
    } catch {
      // Error is already handled
      // by WalletProvider.
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Blockchain Administrator
      </h2>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Connect the authorized MetaMask wallet to ReliefTrack.
      </p>

      {chainId && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            MetaMask Chain ID
          </p>

          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {chainId}
          </p>
        </div>
      )}

      {!address ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnecting
            ? "Connecting..."
            : "Connect MetaMask"}
        </button>
      ) : (
        <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            MetaMask Connected
          </p>

          <p className="mt-2 break-all font-mono text-xs text-slate-600 dark:text-slate-300">
            {address}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}