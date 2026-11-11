import { getRedis } from "@/lib/redis";

const WAREHOUSE_PREFIX = "warehouse:";

function warehouseKey(id) {
  return `${WAREHOUSE_PREFIX}${id}`;
}

export async function getWarehouse(id) {
  const redis = await getRedis();

  const warehouse = await redis.get(warehouseKey(id));

  if (!warehouse) {
    return null;
  }

  return JSON.parse(warehouse);
}

export async function getWarehouses() {
  const redis = await getRedis();

  const keys = await redis.keys(`${WAREHOUSE_PREFIX}*`);

  if (keys.length === 0) {
    return [];
  }

  const warehouses = await redis.mGet(keys);

  return warehouses
    .filter(Boolean)
    .map((warehouse) => JSON.parse(warehouse));
}

export async function createWarehouse(warehouse) {
  const redis = await getRedis();

  if (!warehouse.id) {
    throw new Error("Warehouse ID is required.");
  }

  const key = warehouseKey(warehouse.id);

  const existing = await redis.exists(key);

  if (existing) {
    throw new Error(`Warehouse ${warehouse.id} already exists.`);
  }

  await redis.set(key, JSON.stringify(warehouse));

  return warehouse;
}

export async function updateWarehouse(id, updates) {
  const redis = await getRedis();

  const key = warehouseKey(id);

  const existing = await redis.get(key);

  if (!existing) {
    throw new Error(`Warehouse ${id} not found.`);
  }

  const warehouse = JSON.parse(existing);

  const updatedWarehouse = {
    ...warehouse,
    ...updates,
    id,
  };

  await redis.set(key, JSON.stringify(updatedWarehouse));

  return updatedWarehouse;
}

export async function deleteWarehouse(id) {
  const redis = await getRedis();

  const key = warehouseKey(id);

  const deleted = await redis.del(key);

  return deleted > 0;
}

const INVENTORY_PREFIX = "inventory:";

function inventoryKey(id) {
  return `${INVENTORY_PREFIX}${id}`;
}

export async function getInventoryItem(id) {
  const redis = await getRedis();

  const item = await redis.get(inventoryKey(id));

  if (!item) {
    return null;
  }

  return JSON.parse(item);
}

export async function getInventory() {
  const redis = await getRedis();

  const keys = await redis.keys(`${INVENTORY_PREFIX}*`);

  if (keys.length === 0) {
    return [];
  }

  const items = await redis.mGet(keys);

  return items
    .filter(Boolean)
    .map((item) => JSON.parse(item));
}

export async function createInventoryItem(item) {
  const redis = await getRedis();

  if (!item.id) {
    throw new Error("Inventory ID is required.");
  }

  const key = inventoryKey(item.id);

  const existing = await redis.exists(key);

  if (existing) {
    throw new Error(
      `Inventory item ${item.id} already exists.`
    );
  }

  await redis.set(key, JSON.stringify(item));

  return item;
}

export async function updateInventoryItem(id, updates) {
  const redis = await getRedis();

  const key = inventoryKey(id);

  const existing = await redis.get(key);

  if (!existing) {
    throw new Error(
      `Inventory item ${id} not found.`
    );
  }

  const item = JSON.parse(existing);

  const updatedItem = {
    ...item,
    ...updates,
    id,
  };

  await redis.set(
    key,
    JSON.stringify(updatedItem)
  );

  return updatedItem;
}

export async function deleteInventoryItem(id) {
  const redis = await getRedis();

  const deleted = await redis.del(
    inventoryKey(id)
  );

  return deleted > 0;
}



// ============================================================
// DISTRIBUTIONS
// ============================================================

const DISTRIBUTION_PREFIX = "distribution:";

function distributionKey(id) {
  return `${DISTRIBUTION_PREFIX}${id}`;
}

/**
 * Get one distribution by ID.
 */
export async function getDistribution(id) {
  const redis = await getRedis();

  const distribution = await redis.get(
    distributionKey(id)
  );

  if (!distribution) {
    return null;
  }

  return JSON.parse(distribution);
}

/**
 * Get all distributions.
 */
export async function getDistributions() {
  const redis = await getRedis();

  const keys = await redis.keys(
    `${DISTRIBUTION_PREFIX}*`
  );

  if (keys.length === 0) {
    return [];
  }

  const distributions = await redis.mGet(keys);

  return distributions
    .filter(Boolean)
    .map((distribution) =>
      JSON.parse(distribution)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
}

/**
 * Create a distribution record.
 */
export async function createDistributionRecord(
  distribution
) {
  const redis = await getRedis();

  if (!distribution.id) {
    throw new Error(
      "Distribution ID is required."
    );
  }

  const key = distributionKey(
    distribution.id
  );

  const existing = await redis.exists(key);

  if (existing) {
    throw new Error(
      `Distribution ${distribution.id} already exists.`
    );
  }

  await redis.set(
    key,
    JSON.stringify(distribution)
  );

  return distribution;
}

/**
 * Update a distribution record.
 */
export async function updateDistributionRecord(
  id,
  updates
) {
  const redis = await getRedis();

  const key = distributionKey(id);

  const existing = await redis.get(key);

  if (!existing) {
    throw new Error(
      `Distribution ${id} not found.`
    );
  }

  const distribution =
    JSON.parse(existing);

  const updatedDistribution = {
    ...distribution,
    ...updates,
    id,
  };

  await redis.set(
    key,
    JSON.stringify(updatedDistribution)
  );

  return updatedDistribution;
}

/**
 * Delete a distribution record.
 */
export async function deleteDistributionRecord(
  id
) {
  const redis = await getRedis();

  const deleted = await redis.del(
    distributionKey(id)
  );

  return deleted > 0;
}