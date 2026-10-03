"use client";

import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Link2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import BlockchainWallet from "@/components/BlockchainWallet";
import { useEffect, useState } from "react";
import {
  getData,
  subscribeToData,
} from "@/lib/relieftrack-store";
import {
  reliefTrackContract,
} from "@/lib/blockchain/relieftrack";

export default function DashboardPage() {
  const [inventory, setInventory] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const [blockchainDistribution, setBlockchainDistribution] =
    useState(null);

  const [blockchainLoading, setBlockchainLoading] =
    useState(true);

  const [blockchainError, setBlockchainError] =
    useState("");

  // =========================================================
  // LOAD LOCALSTORAGE DATA
  // =========================================================
  useEffect(() => {
    function loadData() {
      const data = getData();

      setInventory(data.inventory || []);
      setDistributions(data.distributions || []);
    }

    loadData();

    const unsubscribe = subscribeToData(loadData);

    return unsubscribe;
  }, []);

  // =========================================================
  // VERIFY BLOCKCHAIN DISTRIBUTIONS
  // =========================================================
  useEffect(() => {
    let cancelled = false;

    async function loadBlockchainDistributions() {
      setBlockchainLoading(true);
      setBlockchainError("");

      try {
        const data = getData();

        const verifiedDistributions =
          Array.isArray(data?.distributions)
            ? data.distributions.filter(
                (distribution) =>
                  distribution.blockchainVerified === true &&
                  distribution.blockchainTransactionHash
              )
            : [];

        // No locally verified distributions yet.
        if (verifiedDistributions.length === 0) {
          if (!cancelled) {
            setBlockchainDistribution(null);
            setBlockchainLoading(false);
          }

          return;
        }

        const blockchainRecords = [];

        // Check every locally verified distribution against
        // the CURRENT ReliefTrack smart contract.
        for (const verifiedDistribution of verifiedDistributions) {
          const reference =
            verifiedDistribution.reference;

          if (!reference) {
            continue;
          }

          try {
            const result =
              await reliefTrackContract.getDistribution(
                String(reference)
              );

            const blockchainRecord = {
              distributionId: result[0],
              reference: result[0],
              warehouseId: result[1],
              item: result[2],
              quantity: Number(result[3]),
              unit: result[4],
              destination: result[5],
              timestamp: Number(result[6]),
              recordedBy: result[7],

              // Keep local information too.
              transactionHash:
                verifiedDistribution.blockchainTransactionHash,

              blockNumber:
                verifiedDistribution.blockchainBlockNumber,

              wallet:
                verifiedDistribution.blockchainWallet,

              recordedAt:
                verifiedDistribution.blockchainRecordedAt,
            };

            blockchainRecords.push(
              blockchainRecord
            );
          } catch (error) {
            /*
             * This can happen when a distribution was recorded
             * on an OLD contract but the frontend now points
             * to a NEW contract.
             *
             * Do not crash the dashboard.
             */
            console.warn(
              `Blockchain record not found for ${reference}.`,
              error
            );
          }
        }

        if (cancelled) {
          return;
        }

        // Sort newest blockchain record first.
        blockchainRecords.sort(
          (a, b) =>
            Number(b.timestamp || 0) -
            Number(a.timestamp || 0)
        );

        if (blockchainRecords.length > 0) {
          setBlockchainDistribution(
            blockchainRecords[0]
          );
          setBlockchainError("");
        } else {
          /*
           * LocalStorage may still say "blockchainVerified",
           * but the current smart contract has no matching
           * record. This is NOT treated as a valid blockchain
           * verification.
           */
          setBlockchainDistribution(null);

          setBlockchainError(
            "A locally verified distribution was found, but no matching record exists on the current ReliefTrack smart contract. The distribution may have been recorded on an older contract deployment."
          );
        }
      } catch (error) {
        console.error(
          "Unable to load blockchain distributions:",
          error
        );

        if (!cancelled) {
          setBlockchainDistribution(null);

          setBlockchainError(
            error?.message ||
              "Unable to read the ReliefTrack smart contract."
          );
        }
      } finally {
        if (!cancelled) {
          setBlockchainLoading(false);
        }
      }
    }

    loadBlockchainDistributions();

    return () => {
      cancelled = true;
    };
  }, [distributions]);

  // =========================================================
  // DASHBOARD STATISTICS
  // =========================================================

  const activeDistributions =
    distributions.filter(
      (distribution) =>
        distribution.status === "In Transit"
    ).length;

  const completedDeliveries =
    distributions.filter(
      (distribution) =>
        distribution.status === "Delivered"
    ).length;

  const pendingDeliveries =
    distributions.filter(
      (distribution) =>
        distribution.status === "Pending"
    ).length;

  const stats = [
    {
      title: "Total Relief Items",
      value: inventory.length.toLocaleString(),
      note: "Different inventory item types",
      icon: Package,
    },
    {
      title: "Active Distributions",
      value: activeDistributions.toLocaleString(),
      note: "Currently in transit",
      icon: Truck,
    },
    {
      title: "Completed Deliveries",
      value: completedDeliveries.toLocaleString(),
      note: "Marked as delivered",
      icon: CheckCircle,
    },
    {
      title: "Pending Deliveries",
      value: pendingDeliveries.toLocaleString(),
      note: "Awaiting dispatch or delivery",
      icon: Clock,
    },
  ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-100">

      {/* =====================================================
          WELCOME BANNER
      ====================================================== */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-950 to-blue-700 p-6 text-white sm:p-8">
        <p className="text-sm font-medium tracking-wide text-blue-200">
          RELIEF OPERATIONS OVERVIEW
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Welcome to ReliefTrack
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          Monitor relief goods inventory, manage distributions,
          and review transaction records in one place.
        </p>
      </section>

      {/* =====================================================
          OPERATIONS SUMMARY
      ====================================================== */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Operations Summary
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Current overview based on the relief inventory and
          distribution records saved in the prototype.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Icon
                      size={23}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {stat.note}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          BLOCKCHAIN VERIFICATION
      ====================================================== */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40 sm:p-6">
        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Link2
              size={22}
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0 flex-1">

            <h2 className="font-bold text-blue-950 dark:text-blue-200">
              Blockchain Transaction Verification
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-300">
              This section reads a verified distribution
              directly from the deployed ReliefTrack smart contract.
            </p>

            {/* =================================================
                LOADING
            ================================================== */}
            {blockchainLoading && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 text-sm text-slate-600 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-300">
                Checking blockchain record...
              </div>
            )}

            {/* =================================================
                ERROR
            ================================================== */}
            {!blockchainLoading &&
              blockchainError && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">

                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-semibold">
                      Blockchain verification notice
                    </p>

                    <p className="mt-1 leading-6">
                      {blockchainError}
                    </p>

                    <p className="mt-2 text-xs leading-5 opacity-90">
                      If this distribution was recorded
                      before the smart contract was redeployed,
                      record the Delivered distribution again
                      from the Distribution Management page.
                    </p>
                  </div>
                </div>
              )}

            {/* =================================================
                NO RECORD
            ================================================== */}
            {!blockchainLoading &&
              !blockchainError &&
              !blockchainDistribution && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">

                  <div className="flex items-center gap-3">

                    <Clock
                      size={20}
                      className="text-blue-600 dark:text-blue-400"
                    />

                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        No blockchain distribution recorded yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Complete a distribution and mark it
                        as Delivered, then use the Record on
                        Blockchain button from the Distribution
                        Management page.
                      </p>
                    </div>

                  </div>

                </div>
              )}

            {/* =================================================
                VERIFIED BLOCKCHAIN RECORD
            ================================================== */}
            {blockchainDistribution &&
              !blockchainLoading && (
                <div className="mt-4 rounded-lg border border-green-200 bg-white p-4 dark:border-green-900 dark:bg-slate-900">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />

                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Blockchain record verified
                    </p>

                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

                    {/* Distribution ID */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Distribution ID
                      </p>

                      <p className="font-semibold">
                        {blockchainDistribution.distributionId ||
                          blockchainDistribution.reference ||
                          "N/A"}
                      </p>
                    </div>

                    {/* Warehouse */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Warehouse
                      </p>

                      <p className="font-semibold">
                        {blockchainDistribution.warehouseId}
                      </p>
                    </div>

                    {/* Item */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Item
                      </p>

                      <p className="font-semibold">
                        {blockchainDistribution.item}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Quantity
                      </p>

                      <p className="font-semibold">
                        {blockchainDistribution.quantity}{" "}
                        {blockchainDistribution.unit}
                      </p>
                    </div>

                    {/* Destination */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Destination
                      </p>

                      <p className="font-semibold">
                        {blockchainDistribution.destination}
                      </p>
                    </div>

                    {/* Recorded By */}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Recorded By
                      </p>

                      <p className="break-all font-mono text-xs font-semibold">
                        {blockchainDistribution.recordedBy}
                      </p>
                    </div>

                  </div>

                  {/* Transaction information */}
                  {blockchainDistribution.transactionHash && (
                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">

                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Transaction Hash
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                        {blockchainDistribution.transactionHash}
                      </p>

                    </div>
                  )}

                </div>
              )}

          </div>
        </div>
      </section>

      {/* =====================================================
          BLOCKCHAIN WALLET
      ====================================================== */}
      <BlockchainWallet />

      {/* =====================================================
          STORAGE NOTICE
      ====================================================== */}
      <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">
        Prototype demonstration: dashboard statistics are
        calculated from browser localStorage data. The blockchain
        verification section reads directly from the ReliefTrack
        smart contract running on the local Anvil blockchain.
      </p>

    </div>
  );
}