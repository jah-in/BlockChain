"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  User,
  LogIn,
  Boxes,
  MapPinned,
  Link2,
  Activity,
  ArrowRight,
  Wallet,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { login } from "@/lib/auth";

import {
  connectWallet,
  reliefTrackContract,
} from "@/lib/blockchain/relieftrack";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  const [walletAddress, setWalletAddress] = useState("");
  const [walletAuthorized, setWalletAuthorized] = useState(false);

 

  // =========================================================
  // USERNAME + PASSWORD LOGIN
  // =========================================================

  function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const success = login(
      username.trim(),
      password
    );

    if (success) {
      router.replace("/dashboard");
      return;
    }

    setError("Invalid username or password.");
    setLoading(false);
  }

  // =========================================================
  // METAMASK LOGIN
  // =========================================================

  async function handleMetaMaskLogin() {
    try {
      setError("");
      setWalletLoading(true);
      setWalletAuthorized(false);
      setWalletAddress("");

      if (
        typeof window === "undefined" ||
        !window.ethereum
      ) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask and try again."
        );
      }

      // Connect MetaMask and switch to Anvil.
      const wallet = await connectWallet();

      const address = wallet.address;

      setWalletAddress(address);

      console.log(
        "MetaMask login wallet:",
        address
      );

      // Check the connected wallet against
      // the ReliefTrack smart contract.
      const isAdmin =
        await reliefTrackContract.isAdmin(
          address
        );

      console.log(
        "ReliefTrack admin status:",
        isAdmin
      );

      if (!isAdmin) {
        throw new Error(
          "This MetaMask wallet is not an authorized ReliefTrack administrator."
        );
      }

      setWalletAuthorized(true);

      /*
       * Prototype authentication:
       *
       * We store the wallet address separately so
       * the dashboard can recognize that MetaMask
       * authentication was completed.
       *
       * The existing username/password authentication
       * remains untouched.
       */
      localStorage.setItem(
        "relieftrack-wallet-auth",
        JSON.stringify({
          authenticated: true,
          address,
          chainId: 31337,
          authenticatedAt:
            new Date().toISOString(),
        })
      );

      console.log(
        "MetaMask authentication successful."
      );

      // Give the user a short moment to see
      // the successful authentication state.
      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (err) {
      console.error(
        "MetaMask login error:",
        err
      );

      setWalletAuthorized(false);

      setError(
        err?.message ||
          "Unable to authenticate with MetaMask."
      );
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-6 transition-colors dark:bg-slate-950 sm:px-6">

      {/* Background Decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-500/10" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/10" />

      </div>

      <div className="relative w-full max-w-5xl">

        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">

          {/* =====================================================
              LEFT SIDE
          ====================================================== */}

          <section className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:min-h-[600px] lg:flex-col lg:justify-between xl:p-10">

            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(59,130,246,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.18) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />

            {/* Glow */}
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10">

              {/* Logo */}
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-blue-400">
                  <ShieldCheck
                    size={25}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight">
                    Relief
                    <span className="text-blue-400">
                      Track
                    </span>
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Disaster Relief Management
                  </p>
                </div>

              </div>

              {/* Main Branding */}
              <div className="mt-20">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                  <Activity size={13} />
                  Relief Operations Platform
                </div>

                <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-[42px]">
                  Track relief.
                  <br />

                  <span className="text-blue-400">
                    Verify distribution.
                  </span>
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
                  Manage relief inventory, warehouses,
                  distributions, and blockchain-ready
                  records from one centralized platform.
                </p>

              </div>

              {/* Feature Cards */}
              <div className="mt-10 grid grid-cols-3 gap-3">

                <FeatureCard
                  icon={<Boxes size={17} />}
                  title="Inventory"
                  description="Track supplies"
                />

                <FeatureCard
                  icon={<MapPinned size={17} />}
                  title="Distribution"
                  description="Monitor deliveries"
                />

                <FeatureCard
                  icon={<Link2 size={17} />}
                  title="Blockchain"
                  description="Verify records"
                />

              </div>

            </div>

            {/* Bottom */}
            <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-5">

              <div className="flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                <span className="text-xs text-slate-500">
                  System operational
                </span>

              </div>

              <span className="text-[10px] tracking-wider text-slate-600">
                RELIEFTRACK
              </span>

            </div>

          </section>

          {/* =====================================================
              RIGHT SIDE
          ====================================================== */}

          <section className="flex min-h-[600px] items-center justify-center bg-white px-6 py-8 transition-colors dark:bg-slate-900 sm:px-10">

            <div className="w-full max-w-sm">

              {/* Mobile Logo */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 text-white shadow-lg dark:bg-blue-700">
                  <ShieldCheck size={24} />
                </div>

                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    Relief
                    <span className="text-blue-600 dark:text-blue-400">
                      Track
                    </span>
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Disaster Relief Management
                  </p>
                </div>

              </div>

              {/* Heading */}
              <div className="mb-7">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                  <Lock size={22} />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Administrator Login
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Sign in to access the ReliefTrack
                  management dashboard.
                </p>

              </div>

              {/* =================================================
                  USERNAME / PASSWORD LOGIN
              ================================================== */}

              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >

                {/* Username */}
                <div>

                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Username
                  </label>

                  <div className="group relative">

                    <User
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
                    />

                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) =>
                        setUsername(
                          event.target.value
                        )
                      }
                      placeholder="Enter username"
                      autoComplete="username"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                    />

                  </div>

                </div>

                {/* Password */}
                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>

                  <div className="group relative">

                    <Lock
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
                    />

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                    />

                  </div>

                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/80 dark:bg-red-950/30 dark:text-red-300">

                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />

                    <span>{error}</span>

                  </div>
                )}

                {/* Password Login Button */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    walletLoading
                  }
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to ReliefTrack

                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              {/* =================================================
                  DIVIDER
              ================================================== */}

              <div className="my-6 flex items-center gap-3">

                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Or
                </span>

                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

              </div>

              {/* =================================================
                  METAMASK LOGIN
              ================================================== */}

              <button
                type="button"
                onClick={handleMetaMaskLogin}
                disabled={
                  loading ||
                  walletLoading
                }
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-700 dark:hover:bg-orange-950/20 dark:hover:text-orange-400"
              >

                {walletLoading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />

                    Checking MetaMask...
                  </>
                ) : walletAuthorized ? (
                  <>
                    <CheckCircle2
                      size={19}
                      className="text-green-600 dark:text-green-400"
                    />

                    Wallet Authorized
                  </>
                ) : (
                  <>
                    <Wallet
                      size={19}
                      className="text-orange-500"
                    />

                    Login with MetaMask
                  </>
                )}

              </button>

              {/* Connected Wallet */}
              {walletAddress && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-green-600 dark:text-green-400"
                    />

                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                      Authorized MetaMask wallet
                    </p>

                  </div>

                  <p className="mt-2 break-all font-mono text-[10px] text-green-700/80 dark:text-green-300/80">
                    {walletAddress}
                  </p>

                </div>
              )}

              {/* Security Information */}
              <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                />

                <div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Authorized Access
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    Only authorized ReliefTrack
                    administrators can authenticate
                    through MetaMask.
                  </p>

                </div>

              </div>

              {/* Footer */}
              <p className="mt-7 text-center text-[11px] text-slate-400 dark:text-slate-500">
                ReliefTrack Prototype • Disaster Relief
                Management System
              </p>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 backdrop-blur-sm">

      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <p className="text-xs font-semibold text-slate-200">
        {title}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-500">
        {description}
      </p>

    </div>
  );
}