"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Blocks,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Link2,
  Package,
  ShieldCheck,
  Truck,
  Warehouse,
  ExternalLink,
} from "lucide-react";

import {
  getData,
  subscribeToData,
} from "@/lib/relieftrack-store";

import {
  RELIEFTRACK_CONTRACT_ADDRESS,
} from "@/lib/blockchain/relieftrack";

export default function BlockchainPage() {
  const [distributions, setDistributions] = useState([]);

  useEffect(() => {
    const loadData = () => {
      const data = getData();

      setDistributions(
        Array.isArray(data?.distributions)
          ? data.distributions
          : []
      );
    };

    loadData();

    const unsubscribe = subscribeToData(loadData);

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const summary = useMemo(() => {
    const total = distributions.length;

    const pending = distributions.filter(
      (record) => record.status === "Pending"
    ).length;

    const inTransit = distributions.filter(
      (record) => record.status === "In Transit"
    ).length;

    const delivered = distributions.filter(
      (record) => record.status === "Delivered"
    ).length;

    const blockchainVerified = distributions.filter(
      (record) =>
        record.blockchainVerified === true &&
        record.blockchainTransactionHash
    ).length;

    const totalWeight = distributions.reduce(
      (total, record) => {
        const weight = Number(
          record.storageWeightKg ??
            record.weightKg ??
            0
        );

        if (!Number.isFinite(weight)) {
          return total;
        }

        return total + weight;
      },
      0
    );

    return {
      total,
      pending,
      inTransit,
      delivered,
      blockchainVerified,
      totalWeight,
    };
  }, [distributions]);

  const formatNumber = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const formatKg = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return `${number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} kg`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const shortenHash = (hash) => {
    if (!hash) {
      return "—";
    }

    if (hash.length <= 18) {
      return hash;
    }

    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";

      case "In Transit":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";

      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300";

      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return (
          <CheckCircle2 className="h-3.5 w-3.5" />
        );

      case "In Transit":
        return (
          <Truck className="h-3.5 w-3.5" />
        );

      case "Pending":
        return (
          <Clock3 className="h-3.5 w-3.5" />
        );

      default:
        return (
          <Clock3 className="h-3.5 w-3.5" />
        );
    }
  };

  const isBlockchainVerified = (record) => {
    return (
      record.blockchainVerified === true &&
      Boolean(record.blockchainTransactionHash)
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 transition-colors sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">

        {/* =========================================================
            PAGE HEADER
        ========================================================== */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            <Blocks className="h-4 w-4" />

            <span>ReliefTrack</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Blockchain Records
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base dark:text-slate-300">
            Review disaster relief distribution records that have been
            recorded and verified through the ReliefTrack blockchain
            smart contract.
          </p>
        </div>

        {/* =========================================================
            BLOCKCHAIN STATUS NOTICE
        ========================================================== */}
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
              <ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>

            <div>
              <h2 className="font-semibold text-green-900 dark:text-green-300">
                Blockchain Integration Active
              </h2>

              <p className="mt-1 text-sm leading-6 text-green-800 dark:text-green-200">
                ReliefTrack uses the local Anvil blockchain for prototype
                verification. Delivered distributions can be submitted
                through MetaMask to the ReliefTrack smart contract. Confirmed
                transactions are stored with their transaction hash, block
                number, wallet address, and verification status.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Anvil Local
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  Chain ID: 31337
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            SUMMARY CARDS
        ========================================================== */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Total Records */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Distribution Records
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(summary.total)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950/50">
                <FileCheck2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Records in ReliefTrack
            </p>
          </div>

          {/* Total Weight */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Distributed Weight
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(summary.totalWeight)}

                  <span className="ml-1 text-base font-semibold">
                    kg
                  </span>
                </p>
              </div>

              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-950/50">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Total relief goods distributed
            </p>
          </div>

          {/* Delivered */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Delivered
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(summary.delivered)}
                </p>
              </div>

              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-950/50">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Completed distribution records
            </p>
          </div>

          {/* Blockchain */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Blockchain Verified
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(summary.blockchainVerified)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950/50">
                <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Records confirmed on-chain
            </p>
          </div>
        </div>

        {/* =========================================================
            STATUS SUMMARY
        ========================================================== */}
        {distributions.length > 0 && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribution Status
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Current status of relief distribution records and their
                blockchain verification.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Pending */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />

                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Pending
                    </p>

                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                      {summary.pending}
                    </p>
                  </div>
                </div>
              </div>

              {/* In Transit */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      In Transit
                    </p>

                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {summary.inTransit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivered */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />

                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Delivered
                    </p>

                    <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                      {summary.delivered}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blockchain Verified */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />

                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Blockchain Verified
                    </p>

                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {summary.blockchainVerified}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================================================
            RECORDS TABLE
        ========================================================== */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">

          {/* Section Header */}
          <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Distribution Record History
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Distribution records and their blockchain verification
                  status.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Blockchain Enabled
                </span>
              </div>
            </div>
          </div>

          {/* =======================================================
              EMPTY STATE
          ======================================================== */}
          {distributions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                <FileCheck2 className="h-7 w-7 text-gray-400 dark:text-slate-500" />
              </div>

              <h3 className="font-semibold text-gray-800 dark:text-slate-100">
                No distribution records yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-slate-400">
                Once a relief distribution is created, its record will appear
                here. Delivered records can then be submitted to the
                blockchain for verification.
              </p>
            </div>
          ) : (
            <>
              {/* =====================================================
                  DESKTOP TABLE
              ====================================================== */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Distribution
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Warehouse
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Relief Item
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Quantity
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Weight
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Destination
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Blockchain
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {distributions.map((record, index) => {
                      const distributionReference =
                        record.reference ??
                        `DIST-${record.id ?? index + 1}`;

                      const warehouseName =
                        record.warehouseName ??
                        record.warehouse ??
                        "—";

                      const itemName =
                        record.itemName ??
                        record.item ??
                        record.name ??
                        "—";

                      const verified =
                        isBlockchainVerified(record);

                      return (
                        <tr
                          key={record.id ?? index}
                          className="transition hover:bg-gray-50 dark:hover:bg-slate-800/60"
                        >
                          {/* Distribution */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {distributionReference}
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                              ID: {record.id ?? "—"}
                            </p>
                          </td>

                          {/* Warehouse */}
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2">
                              <Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />

                              <div>
                                <p className="font-medium text-gray-800 dark:text-slate-200">
                                  {warehouseName}
                                </p>

                                {record.warehouseId && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                    Warehouse #{record.warehouseId}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Item */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />

                              <span className="font-medium text-gray-800 dark:text-slate-200">
                                {itemName}
                              </span>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="whitespace-nowrap px-5 py-4 text-gray-700 dark:text-slate-300">
                            <span className="font-medium">
                              {formatNumber(record.quantity)}
                            </span>

                            {record.unit && (
                              <span className="ml-1 text-gray-500 dark:text-slate-400">
                                {record.unit}
                              </span>
                            )}
                          </td>

                          {/* Weight */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="font-semibold text-gray-800 dark:text-slate-200">
                              {formatKg(
                                record.storageWeightKg ??
                                  record.weightKg
                              )}
                            </span>

                            {record.weightKgPerUnit && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                {record.weightKgPerUnit} kg/unit
                              </p>
                            )}
                          </td>

                          {/* Destination */}
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-700 dark:text-slate-300">
                              {record.destination ?? "—"}
                            </p>

                            {record.recipient && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                {record.recipient}
                              </p>
                            )}
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-5 py-4 text-gray-700 dark:text-slate-300">
                            {formatDate(record.date)}
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                record.status
                              )}`}
                            >
                              {getStatusIcon(record.status)}

                              {record.status ?? "Unknown"}
                            </span>
                          </td>

                          {/* Blockchain */}
                          <td className="px-5 py-4">
                            {verified ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Verified
                                </span>

                                <p
                                  className="font-mono text-xs text-gray-500 dark:text-slate-400"
                                  title={
                                    record.blockchainTransactionHash
                                  }
                                >
                                  {shortenHash(
                                    record.blockchainTransactionHash
                                  )}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                <Link2 className="h-3.5 w-3.5" />
                                Not recorded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* =====================================================
                  MOBILE CARDS
              ====================================================== */}
              <div className="space-y-4 p-4 md:hidden">
                {distributions.map((record, index) => {
                  const distributionReference =
                    record.reference ??
                    `DIST-${record.id ?? index + 1}`;

                  const warehouseName =
                    record.warehouseName ??
                    record.warehouse ??
                    "—";

                  const itemName =
                    record.itemName ??
                    record.item ??
                    record.name ??
                    "—";

                  const verified =
                    isBlockchainVerified(record);

                  return (
                    <article
                      key={record.id ?? index}
                      className="rounded-xl border border-gray-200 p-4 transition-colors dark:border-slate-700 dark:bg-slate-900"
                    >
                      {/* Card Header */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Distribution
                          </p>

                          <p className="mt-1 break-all font-bold text-gray-900 dark:text-white">
                            {distributionReference}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            record.status
                          )}`}
                        >
                          {getStatusIcon(record.status)}

                          {record.status ?? "Unknown"}
                        </span>
                      </div>

                      {/* Warehouse */}
                      <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
                        <div className="flex items-start gap-3">
                          <Warehouse className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                              Warehouse
                            </p>

                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {warehouseName}
                            </p>

                            {record.warehouseId && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Warehouse #{record.warehouseId}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 text-sm">

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            Relief Item
                          </p>

                          <p className="mt-1 font-medium text-gray-800 dark:text-slate-200">
                            {itemName}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                              Quantity
                            </p>

                            <p className="mt-1 font-medium text-gray-800 dark:text-slate-200">
                              {formatNumber(record.quantity)}
                              {record.unit
                                ? ` ${record.unit}`
                                : ""}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                              Storage Weight
                            </p>

                            <p className="mt-1 font-semibold text-gray-800 dark:text-slate-200">
                              {formatKg(
                                record.storageWeightKg ??
                                  record.weightKg
                              )}
                            </p>
                          </div>
                        </div>

                        {record.weightKgPerUnit && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                              Weight per Unit
                            </p>

                            <p className="mt-1 text-gray-700 dark:text-slate-300">
                              {record.weightKgPerUnit} kg
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            Destination
                          </p>

                          <p className="mt-1 text-gray-700 dark:text-slate-300">
                            {record.destination ?? "—"}
                          </p>

                          {record.recipient && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                              Receiving Center:{" "}
                              {record.recipient}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            Distribution Date
                          </p>

                          <p className="mt-1 text-gray-700 dark:text-slate-300">
                            {formatDate(record.date)}
                          </p>
                        </div>
                      </div>

                      {/* Blockchain Status */}
                      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-gray-500 dark:text-slate-400" />

                          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            Blockchain Record
                          </p>
                        </div>

                        {verified ? (
                          <div className="mt-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />

                              <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                Blockchain Verified
                              </span>
                            </div>

                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                Transaction
                              </p>

                              <p
                                className="break-all font-mono text-xs text-gray-700 dark:text-slate-300"
                                title={
                                  record.blockchainTransactionHash
                                }
                              >
                                {record.blockchainTransactionHash}
                              </p>

                              {record.blockchainBlockNumber !==
                                undefined &&
                                record.blockchainBlockNumber !==
                                  null && (
                                  <p className="pt-1 text-xs text-gray-500 dark:text-slate-400">
                                    Block:{" "}
                                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                                      {
                                        record.blockchainBlockNumber
                                      }
                                    </span>
                                  </p>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                            <Database className="h-3.5 w-3.5" />
                            Not recorded on-chain
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* =========================================================
            HOW THE RECORD RELATES TO WAREHOUSE CAPACITY
        ========================================================== */}
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 transition-colors dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
              <Warehouse className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>

            <div>
              <h2 className="font-semibold text-blue-900 dark:text-blue-300">
                Warehouse Capacity and Distribution Records
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
                Each distribution record is connected to the warehouse from
                which the relief goods were released. The storage weight is
                calculated using the quantity and the item's kilogram-per-unit
                value. When a distribution is created, the quantity is removed
                from warehouse inventory, which also reduces the warehouse's
                calculated storage load.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-lg border border-blue-200 bg-white/70 p-3 dark:border-blue-900 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Warehouse Capacity
                  </p>

                  <p className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Example: 10,000 kg
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white/70 p-3 dark:border-blue-900 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Inventory Load
                  </p>

                  <p className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Quantity × kg per unit
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white/70 p-3 dark:border-blue-900 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Distribution Effect
                  </p>

                  <p className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Stock and load decrease
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            BLOCKCHAIN VERIFICATION DETAILS
        ========================================================== */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-950/50">
              <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="w-full">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Blockchain Verification
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
                Finalized distribution records can be recorded through the
                ReliefTrack smart contract. The transaction hash and block
                number provide a verifiable reference for each blockchain
                transaction.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                {/* Transaction Count */}
                <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Verified Transactions
                  </p>

                  <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                    {summary.blockchainVerified}
                  </p>
                </div>

                {/* Smart Contract */}
                <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Smart Contract
                  </p>

                  <p
                    className="mt-1 break-all font-mono text-xs font-medium text-gray-700 dark:text-slate-300"
                    title={RELIEFTRACK_CONTRACT_ADDRESS}
                  >
                    {shortenHash(
                      RELIEFTRACK_CONTRACT_ADDRESS
                    )}
                  </p>
                </div>

                {/* Network */}
                <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Network
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-slate-200">
                    Anvil Local
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Chain ID: 31337
                  </p>
                </div>

                {/* Verification */}
                <div className="rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Verification
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </p>
                </div>

              </div>

              {/* Verified Records */}
              {summary.blockchainVerified > 0 && (
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Recent Blockchain Transactions
                  </h3>

                  <div className="space-y-2">
                    {distributions
                      .filter((record) =>
                        isBlockchainVerified(record)
                      )
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((record) => (
                        <div
                          key={
                            record.id ??
                            record.blockchainTransactionHash
                          }
                          className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                        >
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-slate-200">
                              {record.reference ?? "Distribution"}
                            </p>

                            <p className="mt-1 font-mono text-xs text-gray-500 dark:text-slate-400">
                              {shortenHash(
                                record.blockchainTransactionHash
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {record.blockchainBlockNumber !==
                              undefined &&
                              record.blockchainBlockNumber !==
                                null && (
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                  Block{" "}
                                  <span className="font-semibold text-gray-700 dark:text-slate-300">
                                    {
                                      record.blockchainBlockNumber
                                    }
                                  </span>
                                </span>
                              )}

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}