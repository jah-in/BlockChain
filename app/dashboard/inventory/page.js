"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getData,
  addInventoryItem,
  changeInventoryQuantity,
  removeInventoryItem,
  subscribeToData,
  getWarehouseUsedCapacity,
} from "@/lib/relieftrack-store";

const categories = [
  "Food",
  "Water and Beverages",
  "Hygiene and Sanitation",
  "Clothing and Bedding",
  "Medical Supplies",
  "Other",
];

const emptyForm = {
  name: "",
  category: "Food",
  quantity: "",
  unit: "kg",
  warehouseId: "",
  weightKgPerUnit: "1",
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedWarehouse, setSelectedWarehouse] =
    useState("All");
  const [showForm, setShowForm] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [messageType, setMessageType] =
    useState("success");
  const [formData, setFormData] =
    useState(emptyForm);

  function loadData() {
    const data = getData();

    setInventory(data.inventory || []);
    setWarehouses(data.warehouses || []);

    setFormData((current) => ({
      ...current,
      warehouseId:
        current.warehouseId ||
        String(data.warehouses?.[0]?.id || ""),
    }));
  }

  useEffect(() => {
    loadData();

    const unsubscribe =
      subscribeToData(loadData);

    return unsubscribe;
  }, []);

  const filteredInventory =
    useMemo(() => {
      return inventory.filter((item) => {
        const matchesSearch =
          item.name
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const matchesCategory =
          selectedCategory === "All" ||
          item.category ===
            selectedCategory;

        const matchesWarehouse =
          selectedWarehouse === "All" ||
          String(item.warehouseId) ===
            String(selectedWarehouse);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesWarehouse
        );
      });
    }, [
      inventory,
      searchTerm,
      selectedCategory,
      selectedWarehouse,
    ]);

  const totalItems =
    inventory.length;

  const totalQuantity =
    inventory.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );

  const totalStoredWeight =
    inventory.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(
            item.weightKgPerUnit || 0
          ),
      0
    );

  const lowStockItems =
    inventory.filter(
      (item) =>
        Number(item.quantity || 0) >
          0 &&
        Number(item.quantity || 0) <=
          100
    ).length;

  const outOfStockItems =
    inventory.filter(
      (item) =>
        Number(item.quantity || 0) <=
        0
    ).length;

  function handleInputChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAddItem(event) {
    event.preventDefault();

    setMessage("");

    const result =
      addInventoryItem({
        name: formData.name,
        category:
          formData.category,
        quantity:
          formData.quantity,
        unit: formData.unit,
        warehouseId:
          formData.warehouseId,
        weightKgPerUnit:
          formData.weightKgPerUnit,
      });

    if (!result.success) {
      setMessage(
        result.message
      );
      setMessageType("error");
      return;
    }

    setMessage(
      result.message
    );
    setMessageType("success");

    setFormData({
      ...emptyForm,
      warehouseId:
        String(
          warehouses[0]?.id || ""
        ),
    });

    setShowForm(false);
  }

  function handleRemoveItem(id) {
    const item =
      inventory.find(
        (entry) =>
          String(entry.id) ===
          String(id)
      );

    if (!item) return;

    const confirmed =
      window.confirm(
        `Remove "${item.name}" from inventory?`
      );

    if (!confirmed) return;

    const result =
      removeInventoryItem(id);

    if (!result.success) {
      setMessage(
        result.message
      );
      setMessageType("error");
      return;
    }

    setMessage(
      `${item.name} has been removed from inventory.`
    );
    setMessageType("success");
  }

  function handleQuantityChange(
    id,
    amount
  ) {
    const result =
      changeInventoryQuantity(
        id,
        amount
      );

    if (!result.success) {
      setMessage(
        result.message
      );
      setMessageType("error");
      return;
    }

    setMessage("");
  }

  function getWarehouseName(
    warehouseId
  ) {
    const warehouse =
      warehouses.find(
        (item) =>
          Number(item.id) ===
          Number(warehouseId)
      );

    return (
      warehouse?.name ||
      "Unassigned"
    );
  }

  function getStockStatus(
    quantity
  ) {
    const value =
      Number(quantity || 0);

    if (value <= 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
      };
    }

    if (value <= 100) {
      return {
        label: "Low Stock",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
      };
    }

    return {
      label: "Available",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
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
              Inventory Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Manage relief goods by warehouse,
              monitor stock levels, and enforce
              warehouse storage capacity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(
                (current) => !current
              );
              setMessage("");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            {showForm
              ? "Close Form"
              : "+ Add Inventory Item"}
          </button>
        </div>

        {/* Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <strong>Prototype storage:</strong>{" "}
          Inventory, warehouse, and distribution
          data are currently saved in browser
          localStorage. Capacity is calculated
          using kilograms.
        </div>

        {/* Message */}
        {message && (
          <div
            role="status"
            className={`rounded-lg border p-3 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Add Inventory Item
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select where the goods will be
              stored. The system will reject the
              transaction if it exceeds warehouse
              capacity.
            </p>

            <form
              onSubmit={handleAddItem}
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <FormField label="Item Name">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rice"
                  required
                  className="form-input"
                />
              </FormField>

              <FormField label="Category">
                <select
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Warehouse">
                <select
                  name="warehouseId"
                  value={
                    formData.warehouseId
                  }
                  onChange={
                    handleInputChange
                  }
                  className="form-input"
                  required
                >
                  <option value="">
                    Select warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={
                    formData.quantity
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. 1000"
                  required
                  className="form-input"
                />
              </FormField>

              <FormField label="Unit">
                <input
                  name="unit"
                  value={formData.unit}
                  onChange={
                    handleInputChange
                  }
                  placeholder="kg, cans, bottles..."
                  required
                  className="form-input"
                />
              </FormField>

              <FormField label="Weight Per Unit (kg)">
                <input
                  name="weightKgPerUnit"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={
                    formData.weightKgPerUnit
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. 1"
                  required
                  className="form-input"
                />
              </FormField>

              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Save Inventory Item
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Inventory Items"
            value={totalItems}
            description="Distinct warehouse inventory records"
          />

          <SummaryCard
            title="Total Quantity"
            value={totalQuantity.toLocaleString()}
            description="Combined item quantity"
          />

          <SummaryCard
            title="Stored Weight"
            value={`${totalStoredWeight.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )} kg`}
            description="Used warehouse capacity"
          />

          <SummaryCard
            title="Out of Stock"
            value={outOfStockItems}
            description="Items with zero quantity"
          />
        </div>

        {/* Filters */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Current Inventory
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredInventory.length}{" "}
                record
                {filteredInventory.length !==
                1
                  ? "s"
                  : ""}{" "}
                displayed
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search inventory..."
                className="form-input sm:w-56"
              />

              <select
                value={
                  selectedCategory
                }
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
                className="form-input"
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  selectedWarehouse
                }
                onChange={(event) =>
                  setSelectedWarehouse(
                    event.target.value
                  )
                }
                className="form-input"
              >
                <option value="All">
                  All Warehouses
                </option>

                {warehouses.map(
                  (warehouse) => (
                    <option
                      key={warehouse.id}
                      value={warehouse.id}
                    >
                      {warehouse.name}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {filteredInventory.length ===
          0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No inventory items found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">
                      Item
                    </th>
                    <th className="px-4 py-3">
                      Warehouse
                    </th>
                    <th className="px-4 py-3">
                      Quantity
                    </th>
                    <th className="px-4 py-3">
                      Weight
                    </th>
                    <th className="px-4 py-3">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInventory.map(
                    (item) => {
                      const stockStatus =
                        getStockStatus(
                          item.quantity
                        );

                      const usedWeight =
                        Number(
                          item.quantity ||
                            0
                        ) *
                        Number(
                          item.weightKgPerUnit ||
                            0
                        );

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {item.name}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.category}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {getWarehouseName(
                                item.warehouseId
                              )}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {Number(
                                item.quantity ||
                                  0
                              ).toLocaleString()}
                            </span>

                            <span className="ml-1 text-sm text-slate-500 dark:text-slate-400">
                              {item.unit}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {usedWeight.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}{" "}
                            kg
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                            >
                              {
                                stockStatus.label
                              }
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    -1
                                  )
                                }
                                disabled={
                                  Number(
                                    item.quantity ||
                                      0
                                  ) <= 0
                                }
                                className="rounded-md border border-slate-300 px-3 py-1.5 font-bold dark:border-slate-600 dark:text-slate-200"
                              >
                                −
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    1
                                  )
                                }
                                className="rounded-md border border-slate-300 px-3 py-1.5 font-bold dark:border-slate-600 dark:text-slate-200"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveItem(
                                    item.id
                                  )
                                }
                                className="ml-2 text-sm font-semibold text-red-600 dark:text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
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
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
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