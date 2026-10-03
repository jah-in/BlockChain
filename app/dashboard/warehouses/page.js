"use client";

import { useEffect, useState } from "react";
import {
  getData,
  subscribeToData,
  getWarehouseUsedCapacity,
} from "@/lib/relieftrack-store";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] =
    useState([]);
  const [inventory, setInventory] =
    useState([]);

  function loadData() {
    const data = getData();

    setWarehouses(
      data.warehouses || []
    );

    setInventory(
      data.inventory || []
    );
  }

  useEffect(() => {
    loadData();

    const unsubscribe =
      subscribeToData(loadData);

    return unsubscribe;
  }, []);

  function getUsedCapacity(
    warehouseId
  ) {
    return getWarehouseUsedCapacity(
      warehouseId,
      {
        warehouses,
        inventory,
        distributions: [],
      }
    );
  }

  function getWarehouseItems(
    warehouseId
  ) {
    return inventory.filter(
      (item) =>
        Number(item.warehouseId) ===
        Number(warehouseId)
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
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
          {warehouses.map(
            (warehouse) => {
              const usedCapacity =
                getUsedCapacity(
                  warehouse.id
                );

              const capacity =
                Number(
                  warehouse.capacity || 0
                );

              const availableCapacity =
                Math.max(
                  0,
                  capacity -
                    usedCapacity
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

              if (
                percentage >= 100
              ) {
                capacityStatus =
                  "Full";
              } else if (
                percentage >= 80
              ) {
                capacityStatus =
                  "Near Capacity";
              }

              return (
                <article
                  key={warehouse.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {warehouse.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {warehouse.location}
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
                      {
                        warehouse.status
                      }
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
                          percentage >=
                          100
                            ? "text-red-600 dark:text-red-400"
                            : percentage >=
                              80
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage >=
                          100
                            ? "bg-red-500"
                            : percentage >=
                              80
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
                        capacityStatus ===
                        "Full"
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
                        {items.length !==
                        1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {items.length ===
                    0 ? (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        No inventory stored
                        here.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {
                                    item.name
                                  }
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {
                                    item.category
                                  }
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {Number(
                                    item.quantity
                                  ).toLocaleString()}{" "}
                                  {
                                    item.unit
                                  }
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
                          )
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </section>

        {warehouses.length ===
          0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              No warehouses found.
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