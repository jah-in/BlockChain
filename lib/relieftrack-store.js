const STORAGE_KEY = "relieftrack-prototype-data";

const DEFAULT_WEIGHT_BY_ITEM = {
  Rice: 1,
  "Canned Sardines": 0.155,
  "Drinking Water": 0.5,
  "Hygiene Kits": 2,
  Blankets: 2.5,
};

export const initialData = {
  inventory: [
    {
      id: 1,
      name: "Rice",
      category: "Food",
      quantity: 2500,
      unit: "kg",
      warehouseId: 1,
      weightKgPerUnit: 1,
    },
    {
      id: 2,
      name: "Canned Sardines",
      category: "Food",
      quantity: 1800,
      unit: "cans",
      warehouseId: 1,
      weightKgPerUnit: 0.155,
    },
    {
      id: 3,
      name: "Drinking Water",
      category: "Water and Beverages",
      quantity: 1200,
      unit: "bottles",
      warehouseId: 1,
      weightKgPerUnit: 0.5,
    },
    {
      id: 4,
      name: "Hygiene Kits",
      category: "Hygiene and Sanitation",
      quantity: 450,
      unit: "kits",
      warehouseId: 1,
      weightKgPerUnit: 2,
    },
    {
      id: 5,
      name: "Blankets",
      category: "Clothing and Bedding",
      quantity: 300,
      unit: "pieces",
      warehouseId: 1,
      weightKgPerUnit: 2.5,
    },
  ],

  warehouses: [
    {
      id: 1,
      name: "Main Relief Warehouse",
      location: "Bongao, Tawi-Tawi",
      capacity: 10000,
      status: "Active",
    },
    {
      id: 2,
      name: "Municipal Storage Facility",
      location: "Panglima Sugala, Tawi-Tawi",
      capacity: 5000,
      status: "Active",
    },
    {
      id: 3,
      name: "Emergency Supply Center",
      location: "Sitangkai, Tawi-Tawi",
      capacity: 3000,
      status: "Active",
    },
  ],

  distributions: [],
};

function getDefaultWeight(itemName) {
  return DEFAULT_WEIGHT_BY_ITEM[itemName] || 1;
}

/**
 * Adds missing fields to older localStorage records.
 * This allows the prototype to continue working even if
 * old inventory records were created before warehouse support.
 */
function normalizeData(data) {
  const warehouses = Array.isArray(data.warehouses)
    ? data.warehouses
    : initialData.warehouses;

  const inventory = Array.isArray(data.inventory)
    ? data.inventory.map((item) => ({
        ...item,

        // Existing inventory without a warehouse is assigned
        // to the first active warehouse.
        warehouseId:
          item.warehouseId ??
          warehouses.find((warehouse) => warehouse.status === "Active")
            ?.id ??
          warehouses[0]?.id ??
          1,

        // Existing inventory receives a default weight.
        weightKgPerUnit:
          Number(item.weightKgPerUnit) > 0
            ? Number(item.weightKgPerUnit)
            : getDefaultWeight(item.name),
      }))
    : [];

  const distributions = Array.isArray(data.distributions)
    ? data.distributions.map((distribution) => ({
        ...distribution,
        warehouseId:
          distribution.warehouseId ??
          inventory.find(
            (item) =>
              Number(item.id) === Number(distribution.itemId)
          )?.warehouseId ??
          warehouses[0]?.id ??
          1,
      }))
    : [];

  return {
    inventory,
    warehouses,
    distributions,
  };
}

export function getData() {
  if (typeof window === "undefined") {
    return normalizeData(initialData);
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) {
      const normalizedInitialData = normalizeData(initialData);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalizedInitialData)
      );

      return normalizedInitialData;
    }

    const parsedData = JSON.parse(storedData);
    const normalizedData = normalizeData(parsedData);

    return normalizedData;
  } catch (error) {
    console.error("Unable to load ReliefTrack data:", error);

    return normalizeData(initialData);
  }
}

export function saveData(data) {
  if (typeof window === "undefined") return;

  const normalizedData = normalizeData(data);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizedData)
  );

  window.dispatchEvent(
    new Event("relieftrack-data-updated")
  );
}

export function subscribeToData(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleUpdate() {
    callback(getData());
  }

  window.addEventListener(
    "relieftrack-data-updated",
    handleUpdate
  );

  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(
      "relieftrack-data-updated",
      handleUpdate
    );

    window.removeEventListener(
      "storage",
      handleUpdate
    );
  };
}

/**
 * Calculate the total stored weight of a warehouse.
 */
export function getWarehouseUsedCapacity(
  warehouseId,
  data = getData()
) {
  return data.inventory
    .filter(
      (item) =>
        Number(item.warehouseId) === Number(warehouseId)
    )
    .reduce((total, item) => {
      const quantity = Number(item.quantity || 0);
      const weightPerUnit = Number(
        item.weightKgPerUnit || 0
      );

      return total + quantity * weightPerUnit;
    }, 0);
}

/**
 * Calculate remaining warehouse capacity.
 */
export function getWarehouseAvailableCapacity(
  warehouseId,
  data = getData()
) {
  const warehouse = data.warehouses.find(
    (item) =>
      Number(item.id) === Number(warehouseId)
  );

  if (!warehouse) return 0;

  const usedCapacity = getWarehouseUsedCapacity(
    warehouseId,
    data
  );

  return Math.max(
    0,
    Number(warehouse.capacity || 0) - usedCapacity
  );
}

/**
 * Add inventory to a warehouse.
 *
 * Capacity is checked before saving.
 */
export function addInventoryItem({
  name,
  category,
  quantity,
  unit,
  warehouseId,
  weightKgPerUnit,
}) {
  const data = getData();

  const cleanName = name?.trim();
  const requestedQuantity = Number(quantity);
  const warehouse = data.warehouses.find(
    (item) =>
      Number(item.id) === Number(warehouseId)
  );

  const weight = Number(weightKgPerUnit);

  if (!cleanName) {
    return {
      success: false,
      message: "Please enter an inventory item name.",
    };
  }

  if (
    !Number.isFinite(requestedQuantity) ||
    requestedQuantity <= 0
  ) {
    return {
      success: false,
      message: "Quantity must be greater than zero.",
    };
  }

  if (!warehouse) {
    return {
      success: false,
      message: "The selected warehouse could not be found.",
    };
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    return {
      success: false,
      message:
        "Weight per unit must be greater than zero.",
    };
  }

  const additionalWeight =
    requestedQuantity * weight;

  const currentUsedCapacity =
    getWarehouseUsedCapacity(
      warehouse.id,
      data
    );

  const availableCapacity =
    Number(warehouse.capacity) -
    currentUsedCapacity;

  if (additionalWeight > availableCapacity) {
    return {
      success: false,
      message:
        `Warehouse capacity exceeded. ${warehouse.name} has only ` +
        `${Math.max(0, availableCapacity).toLocaleString()} kg ` +
        `of available capacity, but this addition requires ` +
        `${additionalWeight.toLocaleString()} kg.`,
    };
  }

  const existingItemIndex =
    data.inventory.findIndex(
      (item) =>
        item.name.toLowerCase() ===
          cleanName.toLowerCase() &&
        item.category === category &&
        item.unit === unit &&
        Number(item.warehouseId) ===
          Number(warehouse.id)
    );

  let updatedInventory;

  if (existingItemIndex !== -1) {
    updatedInventory = [...data.inventory];

    updatedInventory[existingItemIndex] = {
      ...updatedInventory[existingItemIndex],
      quantity:
        Number(
          updatedInventory[existingItemIndex]
            .quantity || 0
        ) + requestedQuantity,
      weightKgPerUnit: weight,
    };
  } else {
    const newItem = {
      id: Date.now().toString(),
      name: cleanName,
      category,
      quantity: requestedQuantity,
      unit,
      warehouseId: warehouse.id,
      weightKgPerUnit: weight,
    };

    updatedInventory = [
      ...data.inventory,
      newItem,
    ];
  }

  saveData({
    ...data,
    inventory: updatedInventory,
  });

  return {
    success: true,
    message:
      `${cleanName} has been added to ${warehouse.name}.`,
  };
}

/**
 * Change inventory quantity manually.
 *
 * Positive amount = add stock.
 * Negative amount = remove stock.
 */
export function changeInventoryQuantity(
  itemId,
  amount
) {
  const data = getData();

  const item = data.inventory.find(
    (entry) =>
      String(entry.id) === String(itemId)
  );

  if (!item) {
    return {
      success: false,
      message: "Inventory item not found.",
    };
  }

  const change = Number(amount);

  if (!Number.isFinite(change)) {
    return {
      success: false,
      message: "Invalid quantity change.",
    };
  }

  if (change > 0) {
    const additionalWeight =
      change *
      Number(item.weightKgPerUnit || 0);

    const availableCapacity =
      getWarehouseAvailableCapacity(
        item.warehouseId,
        data
      );

    if (additionalWeight > availableCapacity) {
      const warehouse = data.warehouses.find(
        (entry) =>
          Number(entry.id) ===
          Number(item.warehouseId)
      );

      return {
        success: false,
        message:
          `Cannot add stock. ${warehouse?.name || "The warehouse"} ` +
          `has only ${availableCapacity.toLocaleString()} kg ` +
          `of available capacity.`,
      };
    }
  }

  const updatedInventory =
    data.inventory.map((entry) => {
      if (
        String(entry.id) !==
        String(itemId)
      ) {
        return entry;
      }

      return {
        ...entry,
        quantity: Math.max(
          0,
          Number(entry.quantity || 0) +
            change
        ),
      };
    });

  saveData({
    ...data,
    inventory: updatedInventory,
  });

  return {
    success: true,
  };
}

/**
 * Remove an inventory item.
 */
export function removeInventoryItem(itemId) {
  const data = getData();

  const item = data.inventory.find(
    (entry) =>
      String(entry.id) === String(itemId)
  );

  if (!item) {
    return {
      success: false,
      message: "Inventory item not found.",
    };
  }

  saveData({
    ...data,
    inventory: data.inventory.filter(
      (entry) =>
        String(entry.id) !==
        String(itemId)
    ),
  });

  return {
    success: true,
  };
}

/**
 * Creates a distribution from a specific warehouse.
 *
 * Stock is deducted immediately because the goods are
 * considered allocated/reserved for that distribution.
 */
export function createDistribution({
  warehouseId,
  itemId,
  quantity,
  destination,
  recipient,
  date,
}) {
  const data = getData();

  const requestedQuantity =
    Number(quantity);

  if (
    !destination?.trim() ||
    !recipient?.trim() ||
    !date
  ) {
    return {
      success: false,
      message:
        "Please complete all distribution fields.",
    };
  }

  if (
    !Number.isFinite(requestedQuantity) ||
    requestedQuantity <= 0
  ) {
    return {
      success: false,
      message:
        "Quantity must be greater than zero.",
    };
  }

  const warehouse =
    data.warehouses.find(
      (item) =>
        Number(item.id) ===
        Number(warehouseId)
    );

  if (!warehouse) {
    return {
      success: false,
      message:
        "The selected warehouse could not be found.",
    };
  }

  const item = data.inventory.find(
    (inventoryItem) =>
      String(inventoryItem.id) ===
        String(itemId) &&
      Number(inventoryItem.warehouseId) ===
        Number(warehouseId)
  );

  if (!item) {
    return {
      success: false,
      message:
        "The selected inventory item could not be found in this warehouse.",
    };
  }

  if (
    Number(item.quantity) <
    requestedQuantity
  ) {
    return {
      success: false,
      message:
        `Insufficient stock. Only ${Number(
          item.quantity
        ).toLocaleString()} ${item.unit} of ${
          item.name
        } are available in ${warehouse.name}.`,
    };
  }

  item.quantity -= requestedQuantity;

  const distribution = {
    id: Date.now(),
    reference:
      `DIST-${new Date().getFullYear()}-` +
      `${String(
        data.distributions.length + 1
      ).padStart(3, "0")}`,

    warehouseId: warehouse.id,
    warehouseName: warehouse.name,

    itemId: item.id,
    item: item.name,

    quantity: requestedQuantity,
    unit: item.unit,

    weightKg:
      requestedQuantity *
      Number(item.weightKgPerUnit || 0),

    destination:
      destination.trim(),

    recipient:
      recipient.trim(),

    date,

    status: "Pending",

    createdAt:
      new Date().toISOString(),
  };

  data.distributions.unshift(
    distribution
  );

  saveData(data);

  return {
    success: true,
    distribution,
  };
}

/**
 * Update distribution status.
 */
export function updateDistributionStatus(
  distributionId,
  newStatus
) {
  const allowedStatuses = [
    "Pending",
    "In Transit",
    "Delivered",
  ];

  if (
    !allowedStatuses.includes(
      newStatus
    )
  ) {
    return {
      success: false,
      message:
        "Invalid distribution status.",
    };
  }

  const data = getData();

  const distribution =
    data.distributions.find(
      (item) =>
        Number(item.id) ===
        Number(distributionId)
    );

  if (!distribution) {
    return {
      success: false,
      message:
        "Distribution record not found.",
    };
  }

  distribution.status =
    newStatus;

  saveData(data);

  return {
    success: true,
    distribution,
  };
}