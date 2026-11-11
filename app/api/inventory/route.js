import {
  getInventory,
  createInventoryItem,
  getWarehouse,
} from "@/lib/redis-store";

export async function GET() {
  try {
    const inventory = await getInventory();

    return Response.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("GET inventory error:", error);

    return Response.json(
      {
        success: false,
        message: error.message || "Failed to load inventory.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const item = await request.json();

    // -----------------------------
    // Validate required fields
    // -----------------------------
    if (!item.id) {
      throw new Error("Inventory ID is required.");
    }

    if (!item.name?.trim()) {
      throw new Error("Item name is required.");
    }

    if (!item.warehouseId) {
      throw new Error("Warehouse is required.");
    }

    const quantity = Number(item.quantity);
    const weightKgPerUnit = Number(item.weightKgPerUnit);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than 0.");
    }

    if (
      !Number.isFinite(weightKgPerUnit) ||
      weightKgPerUnit <= 0
    ) {
      throw new Error(
        "Weight per unit must be greater than 0."
      );
    }

    // -----------------------------
    // Get warehouse
    // -----------------------------
    const warehouse = await getWarehouse(
      item.warehouseId
    );

    if (!warehouse) {
      throw new Error(
        `Warehouse ${item.warehouseId} not found.`
      );
    }

    const capacity = Number(warehouse.capacity);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error(
        `Warehouse ${warehouse.id} has an invalid capacity.`
      );
    }

    // -----------------------------
    // Calculate current usage
    // -----------------------------
    const inventory = await getInventory();

    const currentWeight = inventory
      .filter(
        (existingItem) =>
          String(existingItem.warehouseId) ===
          String(item.warehouseId)
      )
      .reduce((total, existingItem) => {
        const quantity = Number(existingItem.quantity) || 0;
        const weight =
          Number(existingItem.weightKgPerUnit) || 0;

        return total + quantity * weight;
      }, 0);

    // -----------------------------
    // Calculate new item weight
    // -----------------------------
    const newItemWeight =
      quantity * weightKgPerUnit;

    const totalWeight =
      currentWeight + newItemWeight;

    // -----------------------------
    // Capacity check
    // -----------------------------
    if (totalWeight > capacity) {
      const availableCapacity =
        Math.max(capacity - currentWeight, 0);

      throw new Error(
        `Warehouse ${warehouse.name} does not have enough capacity. ` +
        `Available: ${availableCapacity.toFixed(2)} kg. ` +
        `Required: ${newItemWeight.toFixed(2)} kg.`
      );
    }

    // -----------------------------
    // Normalize item data
    // -----------------------------
    const normalizedItem = {
      ...item,
      id: String(item.id),
      name: item.name.trim(),
      category: item.category || "Other",
      quantity,
      unit: item.unit || "kg",
      warehouseId: String(item.warehouseId),
      weightKgPerUnit,
    };

    // -----------------------------
    // Save to Redis
    // -----------------------------
    const createdItem =
      await createInventoryItem(normalizedItem);

    return Response.json(
      {
        success: true,
        inventory: createdItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST inventory error:", error);

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create inventory item.",
      },
      { status: 400 }
    );
  }
}