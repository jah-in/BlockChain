"use client";
import { useEffect, useState } from "react";
import {
  getData,
  subscribeToData,
  createDistribution,
  updateDistributionStatus,
  getWarehouseUsedCapacity,
  saveData,
} from "@/lib/relieftrack-store";

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

  const [recordingBlockchainId, setRecordingBlockchainId] =
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

  function loadData() {
    const data = getData();

    setInventory(
      data.inventory || []
    );

    setWarehouses(
      data.warehouses || []
    );

    setDistributions(
      data.distributions || []
    );

    setForm((current) => ({
      ...current,
      warehouseId:
        current.warehouseId ||
        String(
          data.warehouses?.[0]?.id ||
            ""
        ),
    }));
  }

  useEffect(() => {
    loadData();

    const unsubscribe =
      subscribeToData(loadData);

    return unsubscribe;
  }, []);

  const selectedWarehouse =
    warehouses.find(
      (warehouse) =>
        Number(warehouse.id) ===
        Number(form.warehouseId)
    );

  const warehouseInventory =
    inventory.filter(
      (item) =>
        Number(item.warehouseId) ===
        Number(form.warehouseId)
    );

  const selectedItem =
    warehouseInventory.find(
      (item) =>
        String(item.id) ===
        String(form.itemId)
    );

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

  const selectedWarehouseUsed =
    selectedWarehouse
      ? getWarehouseUsedCapacity(
          selectedWarehouse.id,
          {
            inventory,
            warehouses,
            distributions,
          }
        )
      : 0;

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

      // When warehouse changes,
      // reset the selected inventory item.
      if (
        name ===
        "warehouseId"
      ) {
        updated.itemId = "";
        updated.quantity = "";
      }

      return updated;
    });
  }

  function handleSubmit(event) {
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

    const result =
      createDistribution({
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
        date: form.date,
      });

    if (!result.success) {
      setMessage(
        result.message
      );
      setMessageType("error");
      return;
    }

    const updatedData =
      getData();

    setInventory(
      updatedData.inventory || []
    );

    setDistributions(
      updatedData.distributions ||
        []
    );

    setMessage(
      `Distribution ${result.distribution.reference} created successfully. ${result.distribution.quantity.toLocaleString()} ${result.distribution.unit} of ${result.distribution.item} has been allocated from ${result.distribution.warehouseName}.`
    );

    setMessageType(
      "success"
    );

    setForm({
      warehouseId:
        String(
          warehouses[0]?.id || ""
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
  }

  function handleStatusChange(
    distributionId,
    newStatus
  ) {
    const result =
      updateDistributionStatus(
        distributionId,
        newStatus
      );

    if (!result.success) {
      setMessage(
        result.message
      );
      setMessageType("error");
      return;
    }

    setMessage(
      "Distribution status updated successfully."
    );

    setMessageType(
      "success"
    );
  }
  async function handleRecordOnBlockchain(distribution) {
  setMessage("");

  if (distribution.status !== "Delivered") {
    setMessage(
      "Only delivered distributions can be recorded on the blockchain."
    );
    setMessageType("error");
    return;
  }

  if (distribution.blockchainVerified) {
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

    const result =
      await recordDistributionOnBlockchain(
        distribution
      );

    const data = getData();

    const updatedDistributions =
      data.distributions.map(
        (item) => {
          if (
            Number(item.id) !==
            Number(distribution.id)
          ) {
            return item;
          }

          return {
            ...item,

            blockchainVerified: true,

            blockchainTransactionHash:
              result.transactionHash,

            blockchainBlockNumber:
              result.blockNumber,

            blockchainWallet:
              result.walletAddress,

            blockchainRecordedAt:
              new Date().toISOString(),
          };
        }
      );

    saveData({
      ...data,
      distributions:
        updatedDistributions,
    });

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
    setRecordingBlockchainId(null);
  }
}
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <strong>Prototype storage:</strong>{" "}
          Distribution records and inventory
          changes are currently saved in browser
          localStorage. MongoDB and blockchain
          integration are planned for the next
          development phase.
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

        {/* Create Form */}
        {showForm && (
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
                        {Number(
                          selectedWarehouse.capacity
                        ).toLocaleString()}{" "}
                        kg currently stored
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
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Save Distribution
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
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
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
                              {distribution.blockchainTransactionHash}
                            </p>
                          </div>
                        ) : distribution.status === "Delivered" ? (
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