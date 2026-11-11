"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Download,
  Package,
  Truck,
  Warehouse,
} from "lucide-react";

export default function ReportsPage() {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [distributions, setDistributions] = useState([]);

  const [reportType, setReportType] = useState("inventory");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================================================
     LOAD REDIS-BACKED RELIEFTRACK DATA
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          warehousesResponse,
          inventoryResponse,
          distributionsResponse,
        ] = await Promise.all([
          fetch("/api/warehouses", {
            cache: "no-store",
          }),
          fetch("/api/inventory", {
            cache: "no-store",
          }),
          fetch("/api/distributions", {
            cache: "no-store",
          }),
        ]);

        const warehousesData =
          await warehousesResponse.json();

        const inventoryData =
          await inventoryResponse.json();

        const distributionsData =
          await distributionsResponse.json();

        if (
          !warehousesResponse.ok ||
          !warehousesData.success
        ) {
          throw new Error(
            warehousesData.message ||
              "Failed to load warehouses."
          );
        }

        if (
          !inventoryResponse.ok ||
          !inventoryData.success
        ) {
          throw new Error(
            inventoryData.message ||
              "Failed to load inventory."
          );
        }

        if (
          !distributionsResponse.ok ||
          !distributionsData.success
        ) {
          throw new Error(
            distributionsData.message ||
              "Failed to load distributions."
          );
        }

        if (cancelled) {
          return;
        }

        setWarehouses(
          Array.isArray(warehousesData.warehouses)
            ? warehousesData.warehouses
            : []
        );

        setInventory(
          Array.isArray(inventoryData.inventory)
            ? inventoryData.inventory
            : []
        );

        setDistributions(
          Array.isArray(
            distributionsData.distributions
          )
            ? distributionsData.distributions
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load report data:",
          error
        );

        if (!cancelled) {
          setError(
            error?.message ||
              "Unable to load report data."
          );

          setInventory([]);
          setWarehouses([]);
          setDistributions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     HELPER FUNCTIONS
  ============================================================ */

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  function formatKg(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0 kg";
    }

    return `${number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} kg`;
  }

  function getWarehouseName(warehouseId) {
    const warehouse = warehouses.find(
      (item) =>
        String(item.id) === String(warehouseId)
    );

    return warehouse?.name || "Unassigned Warehouse";
  }

  /*
   * Calculates how much physical weight is currently stored
   * in one warehouse.
   *
   * Quantity × weightKgPerUnit = storage weight
   */
  function getWarehouseLoad(warehouseId) {
    return inventory.reduce((total, item) => {
      if (
        String(item.warehouseId) !==
        String(warehouseId)
      ) {
        return total;
      }

      const quantity = Number(item.quantity || 0);

      const weightKgPerUnit = Number(
        item.weightKgPerUnit || 0
      );

      if (
        !Number.isFinite(quantity) ||
        !Number.isFinite(weightKgPerUnit)
      ) {
        return total;
      }

      return (
        total +
        quantity * weightKgPerUnit
      );
    }, 0);
  }

  function getInventoryWeight(item) {
    const quantity = Number(item.quantity || 0);

    const weightKgPerUnit = Number(
      item.weightKgPerUnit || 0
    );

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(weightKgPerUnit)
    ) {
      return 0;
    }

    return (
      quantity * weightKgPerUnit
    );
  }

  /* ============================================================
     INVENTORY TOTAL WEIGHT
  ============================================================ */

  const totalInventoryWeight = useMemo(() => {
    return inventory.reduce(
      (sum, item) =>
        sum + getInventoryWeight(item),
      0
    );
  }, [inventory]);

  /* ============================================================
     TOTAL WAREHOUSE CAPACITY
  ============================================================ */

  const totalWarehouseCapacity = useMemo(() => {
    return warehouses.reduce(
      (sum, warehouse) =>
        sum + Number(warehouse.capacity || 0),
      0
    );
  }, [warehouses]);

  /* ============================================================
     TOTAL USED CAPACITY
  ============================================================ */

  const totalUsedCapacity = useMemo(() => {
    return warehouses.reduce(
      (sum, warehouse) =>
        sum +
        getWarehouseLoad(warehouse.id),
      0
    );
  }, [inventory, warehouses]);

  /* ============================================================
     TOTAL AVAILABLE CAPACITY
  ============================================================ */

  const totalAvailableCapacity = useMemo(() => {
    return warehouses.reduce(
      (sum, warehouse) => {
        const capacity = Number(
          warehouse.capacity || 0
        );

        const load = getWarehouseLoad(
          warehouse.id
        );

        const available = Math.max(
          0,
          capacity - load
        );

        return sum + available;
      },
      0
    );
  }, [inventory, warehouses]);

  /* ============================================================
     OVER-CAPACITY WAREHOUSES
  ============================================================ */

  const overCapacityWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => {
      const capacity = Number(
        warehouse.capacity || 0
      );

      const load = getWarehouseLoad(
        warehouse.id
      );

      return load > capacity;
    });
  }, [inventory, warehouses]);

  /* ============================================================
     REPORT ROWS
  ============================================================ */

  const filteredRows = useMemo(() => {
    let rows = [];

    /* ----------------------------------------------------------
       INVENTORY REPORT
    ---------------------------------------------------------- */

    if (reportType === "inventory") {
      rows = inventory.map((item) => {
        const storageWeight =
          getInventoryWeight(item);

        const warehouseName =
          getWarehouseName(
            item.warehouseId
          );

        const warehouse =
          warehouses.find(
            (warehouseItem) =>
              String(warehouseItem.id) ===
              String(item.warehouseId)
          );

        const warehouseLoad = warehouse
          ? getWarehouseLoad(warehouse.id)
          : 0;

        const warehouseCapacity = warehouse
          ? Number(
              warehouse.capacity || 0
            )
          : 0;

        let status = "Available";

        if (
          Number(item.quantity || 0) <= 0
        ) {
          status = "Out of Stock";
        } else if (
          Number(item.quantity || 0) <= 100
        ) {
          status = "Low Stock";
        }

        return {
          "Item Name":
            item.name || "Unnamed Item",

          Category:
            item.category || "—",

          Warehouse:
            warehouseName,

          Quantity:
            item.quantity ?? 0,

          Unit:
            item.unit || "—",

          "Weight / Unit":
            `${formatNumber(
              item.weightKgPerUnit
            )} kg`,

          "Storage Weight":
            formatKg(storageWeight),

          Status:
            status,

          "Warehouse Load":
            formatKg(warehouseLoad),

          "Warehouse Capacity":
            formatKg(warehouseCapacity),
        };
      });
    }

    /* ----------------------------------------------------------
       WAREHOUSE REPORT
    ---------------------------------------------------------- */

    else if (
      reportType === "warehouses"
    ) {
      rows = warehouses.map(
        (warehouse) => {
          const capacity = Number(
            warehouse.capacity || 0
          );

          const load =
            getWarehouseLoad(
              warehouse.id
            );

          const available = Math.max(
            0,
            capacity - load
          );

          const overBy = Math.max(
            0,
            load - capacity
          );

          const utilization =
            capacity > 0
              ? (load / capacity) * 100
              : 0;

          let capacityStatus =
            "Within Capacity";

          if (overBy > 0) {
            capacityStatus =
              "Over Capacity";
          } else if (
            utilization >= 90
          ) {
            capacityStatus =
              "Near Capacity";
          }

          const warehouseInventory =
            inventory.filter(
              (item) =>
                String(item.warehouseId) ===
                String(warehouse.id)
            );

          return {
            "Warehouse Name":
              warehouse.name ||
              "Unnamed Warehouse",

            Location:
              warehouse.location || "—",

            Capacity:
              formatKg(capacity),

            "Current Load":
              formatKg(load),

            "Available Capacity":
              formatKg(available),

            Utilization:
              `${utilization.toFixed(1)}%`,

            "Inventory Records":
              warehouseInventory.length,

            Status:
              warehouse.status ||
              "Active",

            "Capacity Status":
              capacityStatus,

            "Over By":
              overBy > 0
                ? formatKg(overBy)
                : "—",
          };
        }
      );
    }

    /* ----------------------------------------------------------
       DISTRIBUTION REPORT
    ---------------------------------------------------------- */

    else {
      rows = distributions.map(
        (distribution) => ({
          Reference:
            distribution.reference ??
            `DIST-${distribution.id ?? "—"}`,

          Warehouse:
            distribution.warehouseName ??
            getWarehouseName(
              distribution.warehouseId
            ),

          Destination:
            distribution.destination ||
            "—",

          Recipient:
            distribution.recipient ||
            "—",

          Item:
            distribution.itemName ??
            distribution.item ??
            "—",

          Quantity:
            distribution.quantity ?? 0,

          Unit:
            distribution.unit || "—",

          "Distribution Weight":
            formatKg(
              distribution.weightKg ??
                distribution.storageWeightKg ??
                0
            ),

          Date:
            distribution.date || "—",

          Status:
            distribution.status ||
            "Pending",

          Blockchain:
            distribution.blockchainVerified
              ? "Verified"
              : "Not Recorded",
        })
      );
    }

    /* ----------------------------------------------------------
       SEARCH
    ---------------------------------------------------------- */

    const term =
      searchTerm.toLowerCase().trim();

    if (!term) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term)
      )
    );
  }, [
    reportType,
    inventory,
    warehouses,
    distributions,
    searchTerm,
  ]);

  /* ============================================================
     CSV EXPORT
  ============================================================ */

  function exportCSV() {
    if (filteredRows.length === 0) {
      alert(
        "There are no records to export."
      );

      return;
    }

    const headers =
      Object.keys(filteredRows[0]);

    function escapeCSV(value) {
      const text =
        String(value ?? "");

      return `"${text.replaceAll(
        '"',
        '""'
      )}"`;
    }

    const csvContent = [
      headers
        .map(escapeCSV)
        .join(","),

      ...filteredRows.map((row) =>
        headers
          .map((header) =>
            escapeCSV(row[header])
          )
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `relieftrack-${reportType}-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }

  /* ============================================================
     REPORT TITLE
  ============================================================ */

  const reportTitle = {
    inventory:
      "Inventory Report",

    warehouses:
      "Warehouse Capacity Report",

    distributions:
      "Distribution Report",
  }[reportType];

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* PAGE HEADER */}

        <header>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            <BarChart3 className="h-4 w-4" />

            <span>
              ReliefTrack Management
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Reports
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review inventory, warehouse capacity,
            and disaster relief distribution records.
          </p>
        </header>

        {/* DATA SOURCE NOTICE */}

        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 transition-colors dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          <strong className="text-green-900 dark:text-green-300">
            Live report data:
          </strong>{" "}
          Reports are generated from the current
          ReliefTrack Redis-backed inventory, warehouse,
          and distribution records.
        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

              <div>
                <h2 className="font-semibold text-red-900 dark:text-red-300">
                  Unable to load report data
                </h2>

                <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading ReliefTrack reports...
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

              <SummaryCard
                title="Inventory Records"
                value={inventory.length}
                icon={Package}
              />

              <SummaryCard
                title="Stored Relief Goods"
                value={formatKg(
                  totalInventoryWeight
                )}
                icon={Package}
              />

              <SummaryCard
                title="Warehouse Capacity"
                value={formatKg(
                  totalWarehouseCapacity
                )}
                icon={Warehouse}
              />

              <SummaryCard
                title="Used Capacity"
                value={formatKg(
                  totalUsedCapacity
                )}
                icon={Warehouse}
              />

              <SummaryCard
                title="Available Capacity"
                value={formatKg(
                  totalAvailableCapacity
                )}
                icon={Warehouse}
              />

            </section>

            {/* CAPACITY WARNING */}

            {overCapacityWarehouses.length >
              0 && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <div className="flex items-start gap-3">

                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

                  <div>
                    <h2 className="font-semibold text-red-900 dark:text-red-300">
                      Warehouse Capacity Exceeded
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-red-800 dark:text-red-200">
                      {overCapacityWarehouses.length}{" "}
                      warehouse
                      {overCapacityWarehouses.length >
                      1
                        ? "s are"
                        : " is"}{" "}
                      currently over the configured
                      storage capacity.

                      {" "}

                      New inventory additions should
                      remain blocked until enough stock
                      is distributed or removed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT CONTROLS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">

              <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">

                {/* REPORT TYPE */}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Report Type
                  </span>

                  <select
                    value={reportType}
                    onChange={(event) => {
                      setReportType(
                        event.target.value
                      );

                      setSearchTerm("");
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                  >
                    <option value="inventory">
                      Inventory Report
                    </option>

                    <option value="warehouses">
                      Warehouse Capacity Report
                    </option>

                    <option value="distributions">
                      Distribution Report
                    </option>
                  </select>
                </label>

                {/* SEARCH */}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Search Report
                  </span>

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search by name, warehouse, location, status, or reference..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400"
                  />
                </label>

                {/* EXPORT */}

                <button
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />

                  Export CSV
                </button>

              </div>
            </section>

            {/* REPORT TABLE */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">

              <div className="border-b border-slate-200 p-5 dark:border-slate-700">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {reportTitle}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {filteredRows.length}{" "}
                      record
                      {filteredRows.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      shown
                    </p>
                  </div>

                  {reportType ===
                    "distributions" && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">

                      <Truck className="h-4 w-4" />

                      Distributed Weight:{" "}

                      {formatKg(
                        distributions.reduce(
                          (
                            sum,
                            distribution
                          ) =>
                            sum +
                            Number(
                              distribution.weightKg ??
                                distribution.storageWeightKg ??
                                0
                            ),
                          0
                        )
                      )}

                    </div>
                  )}

                </div>
              </div>

              {/* EMPTY */}

              {filteredRows.length === 0 ? (
                <div className="p-10 text-center">

                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">

                    <BarChart3 className="h-6 w-6 text-slate-400 dark:text-slate-500" />

                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No records match your search.
                  </p>

                </div>
              ) : (

                /* TABLE */

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px] text-left text-sm">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">

                      <tr>

                        {Object.keys(
                          filteredRows[0]
                        ).map((header) => (
                          <th
                            key={header}
                            className="whitespace-nowrap px-5 py-4 font-semibold"
                          >
                            {header}
                          </th>
                        ))}

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                      {filteredRows.map(
                        (row, index) => (
                          <tr
                            key={index}
                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          >

                            {Object.entries(
                              row
                            ).map(
                              (
                                [
                                  header,
                                  value,
                                ],
                                cellIndex
                              ) => {

                                const isCapacityStatus =
                                  header ===
                                  "Capacity Status";

                                const isOverCapacity =
                                  String(
                                    value
                                  ) ===
                                  "Over Capacity";

                                const isNearCapacity =
                                  String(
                                    value
                                  ) ===
                                  "Near Capacity";

                                const isStatus =
                                  header ===
                                  "Status";

                                const isDelivered =
                                  String(
                                    value
                                  ) ===
                                  "Delivered";

                                const isInTransit =
                                  String(
                                    value
                                  ) ===
                                  "In Transit";

                                const isPending =
                                  String(
                                    value
                                  ) ===
                                  "Pending";

                                const isOutOfStock =
                                  String(
                                    value
                                  ) ===
                                  "Out of Stock";

                                const isLowStock =
                                  String(
                                    value
                                  ) ===
                                  "Low Stock";

                                const isBlockchain =
                                  header ===
                                  "Blockchain";

                                const isVerified =
                                  String(
                                    value
                                  ) ===
                                  "Verified";

                                if (
                                  isCapacityStatus &&
                                  isOverCapacity
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">

                                        <AlertTriangle className="h-3.5 w-3.5" />

                                        Over Capacity

                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isCapacityStatus &&
                                  isNearCapacity
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
                                        Near Capacity
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isStatus &&
                                  isDelivered
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                                        Delivered
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isStatus &&
                                  isInTransit
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                        In Transit
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isStatus &&
                                  isPending
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
                                        Pending
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isStatus &&
                                  isOutOfStock
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                        Out of Stock
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isStatus &&
                                  isLowStock
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
                                        Low Stock
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isBlockchain &&
                                  isVerified
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                                        Verified
                                      </span>
                                    </td>
                                  );
                                }

                                if (
                                  isBlockchain &&
                                  !isVerified
                                ) {
                                  return (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                      className="whitespace-nowrap px-5 py-4"
                                    >
                                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                        Not Recorded
                                      </span>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={
                                      cellIndex
                                    }
                                    className="whitespace-nowrap px-5 py-4 text-slate-700 dark:text-slate-300"
                                  >
                                    {String(
                                      value ?? ""
                                    )}
                                  </td>
                                );
                              }
                            )}

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}
            </section>

            {/* REPORT EXPLANATION */}

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">

              <h2 className="font-semibold text-blue-900 dark:text-blue-300">
                How the Reports Use Warehouse Capacity
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
                ReliefTrack calculates warehouse storage
                load using the quantity of each inventory
                item multiplied by its kilogram-per-unit
                value. This allows different inventory
                units such as kilograms, cans, bottles,
                kits, and pieces to be measured using a
                common storage unit: kilograms.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">

                <div className="rounded-lg border border-blue-200 bg-white/70 p-4 dark:border-blue-900 dark:bg-slate-900/40">

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Storage Load
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Quantity × kg per unit
                  </p>

                </div>

                <div className="rounded-lg border border-blue-200 bg-white/70 p-4 dark:border-blue-900 dark:bg-slate-900/40">

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Available Capacity
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Capacity − Current Load
                  </p>

                </div>

                <div className="rounded-lg border border-blue-200 bg-white/70 p-4 dark:border-blue-900 dark:bg-slate-900/40">

                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Capacity Rule
                  </p>

                  <p className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                    New stock cannot exceed capacity
                  </p>

                </div>

              </div>
            </section>

            {/* DISCLAIMER */}

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Report figures are based on the current
              ReliefTrack Redis-backed system data.
              Blockchain verification status is included
              where available.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

/* ================================================================
   SUMMARY CARD
================================================================ */

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">

      <div className="flex items-center justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            {value}
          </p>
        </div>

        {Icon && (
          <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950/50">

            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />

          </div>
        )}

      </div>

    </div>
  );
}