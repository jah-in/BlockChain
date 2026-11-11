"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Boxes,
  MapPinned,
  Link2,
  Activity,
  Wallet,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import {
  connectWallet,
  reliefTrackContract,
} from "@/lib/blockchain/relieftrack";

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletAuthorized, setWalletAuthorized] = useState(false);

  async function handleMetaMaskLogin() {
    try {
      setError("");
      setWalletLoading(true);
      setWalletAuthorized(false);
      setWalletAddress("");

      // Connect MetaMask and switch to Sepolia if necessary
      const address = await connectWallet();

      setWalletAddress(address);

      // Read the contract owner
      const owner = await reliefTrackContract.owner();

      console.log("Connected wallet:", address);
      console.log("ReliefTrack contract owner:", owner);

      // Check whether connected wallet is the authorized owner
      if (address.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(
          "This MetaMask wallet is not authorized to access ReliefTrack."
        );
      }

      // Wallet is authorized
      setWalletAuthorized(true);

      // Save authentication state
      localStorage.setItem(
        "relieftrack-wallet-auth",
        JSON.stringify({
          authenticated: true,
          address: address,
          chainId: 11155111,
          authenticatedAt: new Date().toISOString(),
        })
      );

      // Give the success message a moment to display
      setTimeout(() => {
        router.replace("/dashboard");
      }, 700);
    } catch (err) {
      console.error("MetaMask login error:", err);

      setWalletAuthorized(false);

      setError(
        err?.message ||
          "Unable to connect to MetaMask. Please try again."
      );
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">

          {/* LEFT SIDE */}
          <div className="hidden lg:block">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <Boxes className="h-7 w-7 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  ReliefTrack
                </h1>

                <p className="text-sm text-slate-400">
                  Disaster Relief Distribution System
                </p>
              </div>
            </div>

            <h2 className="max-w-xl text-4xl font-bold leading-tight">
              Transparent disaster relief distribution powered by
              blockchain.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
              ReliefTrack provides a secure and transparent way to
              record the distribution of disaster relief goods using
              blockchain technology.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <ShieldCheck className="mb-3 h-6 w-6 text-blue-400" />

                <h3 className="font-semibold">
                  Secure
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Wallet-based authentication protects system access.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <Link2 className="mb-3 h-6 w-6 text-blue-400" />

                <h3 className="font-semibold">
                  Blockchain
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Distribution records can be verified on-chain.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <MapPinned className="mb-3 h-6 w-6 text-blue-400" />

                <h3 className="font-semibold">
                  Traceable
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Relief distribution records remain transparent and
                  traceable.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <Activity className="mb-3 h-6 w-6 text-blue-400" />

                <h3 className="font-semibold">
                  Verifiable
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Blockchain transactions provide verifiable records.
                </p>
              </div>

            </div>
          </div>

          {/* LOGIN CARD */}
          <div className="w-full max-w-md justify-self-center">

            {/* Mobile Logo */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
                <Boxes className="h-7 w-7 text-white" />
              </div>

              <h1 className="text-2xl font-bold">
                ReliefTrack
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Disaster Relief Distribution System
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">

              {/* Header */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10">
                  <Wallet className="h-7 w-7 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold">
                  Admin Login
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Connect your authorized MetaMask wallet to access
                  the ReliefTrack administration system.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm leading-6 text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Wallet Address */}
              {walletAddress && (
                <div className="mb-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Connected Wallet
                  </p>

                  <p className="break-all font-mono text-xs text-slate-300">
                    {walletAddress}
                  </p>
                </div>
              )}

              {/* Success */}
              {walletAuthorized && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />

                  <p className="text-sm text-green-400">
                    Wallet authorized. Redirecting to dashboard...
                  </p>
                </div>
              )}

              {/* Connect Button */}
              <button
                type="button"
                onClick={handleMetaMaskLogin}
                disabled={walletLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {walletLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    Connect with MetaMask
                  </>
                )}
              </button>

              {/* Security Information */}
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex gap-3">
                  <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />

                  <div>
                    <h3 className="text-sm font-semibold">
                      Secure Authentication
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your wallet address is checked against the
                      authorized ReliefTrack contract owner on the
                      Ethereum Sepolia network.
                    </p>
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="mt-5 text-center">
                <p className="text-xs text-slate-600">
                  Ethereum Sepolia • Chain ID 11155111
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-slate-600">
              ReliefTrack Blockchain Prototype
            </p>
          </div>
        </div>
      </div>
    </main>
  );

}