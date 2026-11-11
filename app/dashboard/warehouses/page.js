"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  id: "",
  name: "",
  location: "",
  capacity: "",
  status: "Active",
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  async function loadData() {
    try {
      const [warehousesResponse, inventoryResponse] =
        await Promise.all([
          fetch("/api/warehouses"),
          fetch("/api/inventory"),
        ]);

      const warehousesData =
        await warehousesResponse.json();

      const inventoryData =
        await inventoryResponse.json();

      if (warehousesData.success) {
        setWarehouses(
          warehousesData.warehouses || []
        );
      }

      if (inventoryData.success) {
        setInventory(
          inventoryData.inventory || []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load warehouse data:",
        error
      );

      setMessage(
        "Failed to load warehouse data."
      );
      setMessageType("error");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getUsedCapacity(warehouseId) {
    return inventory
      .filter(
        (item) =>
          String(item.warehouseId) ===
          String(warehouseId)
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0) *
            Number(item.weightKgPerUnit || 0),
        0
      );
  }

  function getWarehouseItems(warehouseId) {
    return inventory.filter(
      (item) =>
        String(item.warehouseId) ===
        String(warehouseId)
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleAddWarehouse(event) {
  event.preventDefault();

  try {
    const response = await fetch("/api/warehouses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: formData.id.trim(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        status: formData.status,
      }),
    });

    const result = await response.json();

    console.log("CREATE WAREHOUSE RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || `Request failed with status ${response.status}`
      );
    }

    setFormData(emptyForm);
    setShowForm(false);

    await loadData();
  } catch (error) {
    console.error("CREATE WAREHOUSE ERROR:", error);

    alert(
      `Failed to create warehouse.\n\n${
        error?.message || "Unknown error"
      }`
    );
  }
}

  async function handleDeleteWarehouse(id) {
    const warehouse = warehouses.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!warehouse) return;

    const items =
      getWarehouseItems(id);

    if (items.length > 0) {
      setMessage(
        "Cannot delete a warehouse that still contains inventory."
      );
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${warehouse.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/warehouses/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Failed to delete warehouse."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        `${warehouse.name} has been deleted.`
      );
      setMessageType("success");

      await loadData();
    } catch (error) {
      console.error(
        "Delete warehouse error:",
        error
      );

      setMessage(
        "Failed to delete warehouse."
      );
      setMessageType("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              ReliefTrack Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Warehouse Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Monitor warehouse locations,
              storage capacity, and the relief
              goods currently stored in each
              facility.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setMessage("");
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showForm
              ? "Cancel"
              : "+ Add Warehouse"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-xl border p-4 text-sm font-medium ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Add Warehouse Form */}
        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Add New Warehouse
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a warehouse and define its
                maximum storage capacity.
              </p>
            </div>

            <form
              onSubmit={handleAddWarehouse}
              className="grid gap-4 sm:grid-cols-2"
            >
              {/* ID */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Warehouse ID
                </label>

                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="WH-001"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Warehouse Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Bongao Relief Warehouse"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Bongao, Tawi-Tawi"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Capacity (kg)
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  placeholder="10000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Explanation */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <strong>How capacity works:</strong>{" "}
          Inventory stored in each warehouse
          contributes to its total storage
          weight. ReliefTrack prevents new
          inventory from being added when the
          warehouse would exceed its capacity.
        </div>

        {/* Warehouse Cards */}
        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((warehouse) => {
            const usedCapacity =
              getUsedCapacity(warehouse.id);

            const capacity = Number(
              warehouse.capacity || 0
            );

            const availableCapacity =
              Math.max(
                0,
                capacity - usedCapacity
              );

            const percentage =
              capacity > 0
                ? Math.min(
                    100,
                    (usedCapacity /
                      capacity) *
                      100
                  )
                : 0;

            const items =
              getWarehouseItems(
                warehouse.id
              );

            let capacityStatus =
              "Available";

            if (percentage >= 100) {
              capacityStatus = "Full";
            } else if (percentage >= 80) {
              capacityStatus =
                "Near Capacity";
            }

            return (
              <article
                key={warehouse.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {warehouse.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {warehouse.location}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {warehouse.id}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      warehouse.status ===
                      "Active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {warehouse.status}
                  </span>
                </div>

                {/* Capacity */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Storage Capacity
                    </span>

                    <span
                      className={`text-sm font-bold ${
                        percentage >= 100
                          ? "text-red-600 dark:text-red-400"
                          : percentage >= 80
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 100
                          ? "bg-red-500"
                          : percentage >= 80
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <CapacityStat
                      label="Used"
                      value={`${usedCapacity.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )} kg`}
                    />

                    <CapacityStat
                      label="Available"
                      value={`${availableCapacity.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )} kg`}
                    />

                    <CapacityStat
                      label="Maximum"
                      value={`${capacity.toLocaleString()} kg`}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="mt-5 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Capacity Status
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      capacityStatus === "Full"
                        ? "text-red-600 dark:text-red-400"
                        : capacityStatus ===
                          "Near Capacity"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {capacityStatus}
                  </p>
                </div>

                {/* Inventory */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      Stored Inventory
                    </h3>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {items.length} item
                      {items.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      No inventory stored here.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {item.name}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.category}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {Number(
                                item.quantity
                              ).toLocaleString()}{" "}
                              {item.unit}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(
                                Number(
                                  item.quantity
                                ) *
                                Number(
                                  item.weightKgPerUnit ||
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteWarehouse(
                      warehouse.id
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete Warehouse
                </button>
              </article>
            );
          })}
        </section>

        {/* Empty State */}
        {warehouses.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              No warehouses found.
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Click "Add Warehouse" above to
              create your first warehouse.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function CapacityStat({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}