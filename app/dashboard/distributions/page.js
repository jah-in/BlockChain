"use client";

import { useEffect, useState } from "react";

import {
  recordDistributionOnBlockchain,
} from "@/lib/blockchain/relieftrack";

export default function DistributionsPage() {
  const [inventory, setInventory] =
    useState([]);

  const [warehouses, setWarehouses] =
    useState([]);

  const [distributions, setDistributions] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  const [
    recordingBlockchainId,
    setRecordingBlockchainId,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [updatingStatusId, setUpdatingStatusId] =
    useState(null);

  const [form, setForm] = useState({
    warehouseId: "",
    destination: "",
    recipient: "",
    itemId: "",
    quantity: "",
    date: new Date().toLocaleDateString(
      "en-CA"
    ),
  });

  // ============================================================
  // LOAD DATA FROM REDIS APIs
  // ============================================================

  async function loadData() {
    try {
      setLoading(true);

      const [
        warehousesResponse,
        inventoryResponse,
        distributionsResponse,
      ] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/inventory"),
        fetch("/api/distributions"),
      ]);

      const warehousesData =
        await warehousesResponse.json();

      const inventoryData =
        await inventoryResponse.json();

      const distributionsData =
        await distributionsResponse.json();

      if (!warehousesData.success) {
        throw new Error(
          warehousesData.message ||
            "Failed to load warehouses."
        );
      }

      if (!inventoryData.success) {
        throw new Error(
          inventoryData.message ||
            "Failed to load inventory."
        );
      }

      if (!distributionsData.success) {
        throw new Error(
          distributionsData.message ||
            "Failed to load distributions."
        );
      }

      const loadedWarehouses =
        warehousesData.warehouses || [];

      setWarehouses(
        loadedWarehouses
      );

      setInventory(
        inventoryData.inventory || []
      );

      setDistributions(
        distributionsData.distributions ||
          []
      );

      // Keep the selected warehouse if it
      // still exists. Otherwise select the first.
      setForm((current) => {
        const currentWarehouseExists =
          loadedWarehouses.some(
            (warehouse) =>
              String(warehouse.id) ===
              String(
                current.warehouseId
              )
          );

        return {
          ...current,

          warehouseId:
            currentWarehouseExists
              ? current.warehouseId
              : String(
                  loadedWarehouses[0]?.id ||
                    ""
                ),
        };
      });
    } catch (error) {
      console.error(
        "Failed to load distribution data:",
        error
      );

      setMessage(
        error.message ||
          "Failed to load distribution data."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // SELECTED DATA
  // ============================================================

  const selectedWarehouse =
    warehouses.find(
      (warehouse) =>
        String(warehouse.id) ===
        String(form.warehouseId)
    );

  const warehouseInventory =
    inventory.filter(
      (item) =>
        String(item.warehouseId) ===
        String(form.warehouseId)
    );

  const selectedItem =
    warehouseInventory.find(
      (item) =>
        String(item.id) ===
        String(form.itemId)
    );

  // ============================================================
  // SUMMARY
  // ============================================================

  const deliveredCount =
    distributions.filter(
      (item) =>
        item.status ===
        "Delivered"
    ).length;

  const transitCount =
    distributions.filter(
      (item) =>
        item.status ===
        "In Transit"
    ).length;

  const pendingCount =
    distributions.filter(
      (item) =>
        item.status ===
        "Pending"
    ).length;

  // ============================================================
  // WAREHOUSE CAPACITY
  // ============================================================

  const selectedWarehouseUsed =
    selectedWarehouse
      ? inventory
          .filter(
            (item) =>
              String(item.warehouseId) ===
              String(
                selectedWarehouse.id
              )
          )
          .reduce(
            (total, item) =>
              total +
              (Number(item.quantity) || 0) *
                (Number(
                  item.weightKgPerUnit
                ) || 0),
            0
          )
      : 0;

  const selectedWarehouseCapacity =
    Number(
      selectedWarehouse?.capacity || 0
    );

  const selectedWarehouseAvailable =
    Math.max(
      selectedWarehouseCapacity -
        selectedWarehouseUsed,
      0
    );

  // ============================================================
  // FORM CHANGE
  // ============================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (
        name === "warehouseId"
      ) {
        updated.itemId = "";
        updated.quantity = "";
      }

      if (
        name === "itemId"
      ) {
        updated.quantity = "";
      }

      return updated;
    });
  }

  // ============================================================
  // CREATE DISTRIBUTION
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (!form.warehouseId) {
      setMessage(
        "Please select a warehouse."
      );
      setMessageType("error");
      return;
    }

    if (!form.itemId) {
      setMessage(
        "Please select an inventory item."
      );
      setMessageType("error");
      return;
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setMessage(
        "Please enter a quantity greater than zero."
      );
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/distributions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            warehouseId:
              form.warehouseId,

            itemId:
              form.itemId,

            quantity:
              form.quantity,

            destination:
              form.destination,

            recipient:
              form.recipient,

            date:
              form.date,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to create distribution."
        );
      }

      const distribution =
        result.distribution;

      // Refresh Redis-backed data.
      await loadData();

      setMessage(
        `Distribution ${distribution.reference} created successfully. ${Number(
          distribution.quantity
        ).toLocaleString()} ${
          distribution.unit
        } of ${
          distribution.item
        } has been allocated from ${
          distribution.warehouseName
        }.`
      );

      setMessageType("success");

      setForm({
        warehouseId:
          String(
            form.warehouseId ||
              warehouses[0]?.id ||
              ""
          ),

        destination: "",
        recipient: "",
        itemId: "",
        quantity: "",

        date: new Date().toLocaleDateString(
          "en-CA"
        ),
      });

      setShowForm(false);
    } catch (error) {
      console.error(
        "Create distribution failed:",
        error
      );

      setMessage(
        error.message ||
          "Failed to create distribution."
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async function handleStatusChange(
    distributionId,
    newStatus
  ) {
    try {
      setUpdatingStatusId(
        distributionId
      );

      setMessage("");

      const response = await fetch(
        `/api/distributions/${encodeURIComponent(
          distributionId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to update distribution status."
        );
      }

      setDistributions(
        (previous) =>
          previous.map(
            (distribution) =>
              String(
                distribution.id
              ) ===
              String(
                distributionId
              )
                ? result.distribution
                : distribution
          )
      );

      setMessage(
        "Distribution status updated successfully."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );

      setMessage(
        error.message ||
          "Failed to update distribution status."
      );

      setMessageType("error");

      // Reload in case the UI became
      // out of sync with Redis.
      await loadData();
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // ============================================================
  // RECORD DISTRIBUTION ON BLOCKCHAIN
  // ============================================================

  async function handleRecordOnBlockchain(
    distribution
  ) {
    setMessage("");

    if (
      distribution.status !==
      "Delivered"
    ) {
      setMessage(
        "Only delivered distributions can be recorded on the blockchain."
      );

      setMessageType("error");
      return;
    }

    if (
      distribution.blockchainVerified
    ) {
      setMessage(
        "This distribution has already been recorded on the blockchain."
      );

      setMessageType("error");
      return;
    }

    try {
      setRecordingBlockchainId(
        distribution.id
      );

      setMessage(
        "Preparing blockchain transaction..."
      );

      setMessageType("success");

      // MetaMask / Sepolia transaction.
      const result =
        await recordDistributionOnBlockchain(
          distribution
        );

      // Save blockchain information
      // back to Redis.
      const response = await fetch(
        `/api/distributions/${encodeURIComponent(
          distribution.id
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            blockchainVerified:
              true,

            blockchainTransactionHash:
              result.transactionHash,

            blockchainBlockNumber:
              result.blockNumber,

            blockchainWallet:
              result.walletAddress,

            blockchainRecordedAt:
              new Date().toISOString(),
          }),
        }
      );

      const updated =
        await response.json();

      if (
        !response.ok ||
        !updated.success
      ) {
        throw new Error(
          updated.message ||
            "Blockchain transaction succeeded, but the distribution record could not be updated."
        );
      }

      setDistributions(
        (previous) =>
          previous.map(
            (item) =>
              String(item.id) ===
              String(distribution.id)
                ? updated.distribution
                : item
          )
      );

      setMessage(
        `Distribution ${distribution.reference} was successfully recorded on the blockchain.`
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Blockchain recording failed:",
        error
      );

      setMessage(
        error?.reason ||
          error?.shortMessage ||
          error?.message ||
          "Unable to record the distribution on the blockchain."
      );

      setMessageType("error");
    } finally {
      setRecordingBlockchainId(
        null
      );
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              ReliefTrack Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Distribution Management
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Distribute relief goods from a
              specific warehouse to a
              destination.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(
                (previous) => !previous
              );

              setMessage("");
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showForm
              ? "Cancel"
              : "+ New Distribution"}
          </button>
        </div>

        {/* Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <strong>Current storage:</strong>{" "}
          Distribution records and inventory
          changes are stored in Redis. Delivered
          distributions can be recorded on the
          Sepolia blockchain through MetaMask.
        </div>

        {/* Message */}
        {message && (
          <div
            role="status"
            className={`rounded-lg border p-4 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Distributions"
            value={
              distributions.length
            }
            description="All recorded distributions"
          />

          <SummaryCard
            title="Delivered"
            value={deliveredCount}
            description="Marked as delivered"
            color="text-emerald-700 dark:text-emerald-400"
          />

          <SummaryCard
            title="In Transit"
            value={transitCount}
            description="Currently being transported"
            color="text-blue-700 dark:text-blue-400"
          />

          <SummaryCard
            title="Pending"
            value={pendingCount}
            description="Awaiting dispatch"
            color="text-amber-700 dark:text-amber-400"
          />
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading distribution data...
          </div>
        )}

        {/* Create Form */}
        {showForm && !loading && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
              Create Distribution Record
            </h2>

            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Choose the warehouse first. Only
              inventory stored in that warehouse
              will be available for distribution.
            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Warehouse */}
                <FormField label="Source Warehouse">
                  <select
                    name="warehouseId"
                    value={
                      form.warehouseId
                    }
                    onChange={
                      handleChange
                    }
                    className="form-input"
                    required
                  >
                    <option value="">
                      Select warehouse
                    </option>

                    {warehouses.map(
                      (
                        warehouse
                      ) => (
                        <option
                          key={
                            warehouse.id
                          }
                          value={
                            warehouse.id
                          }
                        >
                          {
                            warehouse.name
                          } —{" "}
                          {
                            warehouse.location
                          }
                        </option>
                      )
                    )}
                  </select>

                  {selectedWarehouse && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
                      <p className="text-slate-500 dark:text-slate-400">
                        Warehouse capacity
                      </p>

                      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                        {selectedWarehouseUsed.toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        /{" "}
                        {selectedWarehouseCapacity.toLocaleString()}{" "}
                        kg currently stored
                      </p>

                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Available:{" "}
                        {selectedWarehouseAvailable.toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        kg
                      </p>
                    </div>
                  )}
                </FormField>

                {/* Destination */}
                <FormField label="Destination Barangay">
                  <input
                    name="destination"
                    value={
                      form.destination
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Barangay San Isidro"
                    className="form-input"
                    required
                  />
                </FormField>

                {/* Recipient */}
                <FormField label="Receiving Center / Recipient">
                  <input
                    name="recipient"
                    value={
                      form.recipient
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. San Isidro Evacuation Center"
                    className="form-input"
                    required
                  />
                </FormField>

                {/* Inventory */}
                <FormField label="Relief Item">
                  <select
                    name="itemId"
                    value={
                      form.itemId
                    }
                    onChange={
                      handleChange
                    }
                    className="form-input"
                    required
                    disabled={
                      !form.warehouseId
                    }
                  >
                    <option value="">
                      {!form.warehouseId
                        ? "Select warehouse first"
                        : warehouseInventory.length ===
                          0
                        ? "No inventory in this warehouse"
                        : "Select inventory item"}
                    </option>

                    {warehouseInventory.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.name} —{" "}
                          {Number(
                            item.quantity
                          ).toLocaleString()}{" "}
                          {
                            item.unit
                          }{" "}
                          available
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* Quantity */}
                <FormField
                  label={`Quantity${
                    selectedItem
                      ? ` (${selectedItem.unit})`
                      : ""
                  }`}
                >
                  <input
                    type="number"
                    name="quantity"
                    value={
                      form.quantity
                    }
                    onChange={
                      handleChange
                    }
                    min="0.01"
                    step="any"
                    max={
                      selectedItem
                        ? selectedItem.quantity
                        : undefined
                    }
                    placeholder="Enter quantity"
                    className="form-input"
                    required
                    disabled={
                      !selectedItem
                    }
                  />

                  {selectedItem && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Available stock:{" "}
                      {Number(
                        selectedItem.quantity
                      ).toLocaleString()}{" "}
                      {
                        selectedItem.unit
                      }
                    </p>
                  )}

                  {selectedItem &&
                    form.quantity && (
                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        Distribution weight:{" "}
                        {(
                          Number(
                            form.quantity
                          ) *
                          Number(
                            selectedItem.weightKgPerUnit ||
                              0
                          )
                        ).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        kg
                      </p>
                    )}
                </FormField>

                {/* Date */}
                <FormField label="Distribution Date">
                  <input
                    type="date"
                    name="date"
                    value={
                      form.date
                    }
                    onChange={
                      handleChange
                    }
                    className="form-input"
                    required
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : "Save Distribution"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Distribution Records */}
        {!loading && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Distribution Records
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Each record shows the warehouse
                from which the relief goods were
                distributed.
              </p>
            </div>

            {distributions.length ===
            0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  No distribution records yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-4">
                        Reference
                      </th>

                      <th className="px-5 py-4">
                        Source Warehouse
                      </th>

                      <th className="px-5 py-4">
                        Destination
                      </th>

                      <th className="px-5 py-4">
                        Relief Goods
                      </th>

                      <th className="px-5 py-4">
                        Quantity
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Update
                      </th>

                      <th className="px-5 py-4">
                        Blockchain
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {distributions.map(
                      (
                        distribution
                      ) => (
                        <tr
                          key={
                            distribution.id
                          }
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700 dark:text-blue-400">
                            {
                              distribution.reference
                            }
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {
                                distribution.warehouseName ||
                                "Unknown"
                              }
                            </p>

                            {distribution.warehouseLocation && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {
                                  distribution.warehouseLocation
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {
                                distribution.destination
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {
                                distribution.recipient
                              }
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-700 dark:text-slate-300">
                            {
                              distribution.item
                            }
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {Number(
                                distribution.quantity
                              ).toLocaleString()}{" "}
                              {
                                distribution.unit
                              }
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {Number(
                                distribution.weightKg ||
                                  0
                              ).toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}{" "}
                              kg
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                            {
                              distribution.date
                            }
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              status={
                                distribution.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                distribution.status
                              }
                              onChange={(
                                event
                              ) =>
                                handleStatusChange(
                                  distribution.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              disabled={
                                updatingStatusId ===
                                distribution.id
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                              aria-label={`Update status for ${distribution.reference}`}
                            >
                              <option value="Pending">
                                Pending
                              </option>

                              <option value="In Transit">
                                In Transit
                              </option>

                              <option value="Delivered">
                                Delivered
                              </option>
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            {distribution.blockchainVerified ? (
                              <div className="space-y-1">
                                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  ✓ Verified
                                </span>

                                <p className="max-w-[180px] break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                  {
                                    distribution.blockchainTransactionHash
                                  }
                                </p>
                              </div>
                            ) : distribution.status ===
                              "Delivered" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRecordOnBlockchain(
                                    distribution
                                  )
                                }
                                disabled={
                                  recordingBlockchainId ===
                                  distribution.id
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {recordingBlockchainId ===
                                distribution.id
                                  ? "Waiting for MetaMask..."
                                  : "Record on Blockchain"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Available after delivery
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          background: white;
          padding: 0.75rem 1rem;
          color: #334155;
          outline: none;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px #dbeafe;
        }

        :global(.dark) .form-input {
          border-color: #334155;
          background: #1e293b;
          color: #f8fafc;
        }

        :global(.dark) .form-input option {
          background: #1e293b;
          color: #f8fafc;
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color = "text-slate-900 dark:text-white",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${color}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function StatusBadge({
  status,
}) {
  const styles = {
    Delivered:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",

    "In Transit":
      "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",

    Pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}