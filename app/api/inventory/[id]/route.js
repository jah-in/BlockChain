import {
  getInventory,
  getInventoryItem,
  getWarehouse,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/redis-store";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const item = await getInventoryItem(id);

    if (!item) {
      return Response.json(
        {
          success: false,
          message: "Inventory item not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      inventory: item,
    });
  } catch (error) {
    console.error(
      "GET inventory item error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get inventory item.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const updates = await request.json();

    // --------------------------------
    // Get existing inventory item
    // --------------------------------
    const existingItem =
      await getInventoryItem(id);

    if (!existingItem) {
      return Response.json(
        {
          success: false,
          message: "Inventory item not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------
    // Determine new values
    // --------------------------------
    const newQuantity =
      updates.quantity !== undefined
        ? Number(updates.quantity)
        : Number(existingItem.quantity);

    const newWeightKgPerUnit =
      updates.weightKgPerUnit !== undefined
        ? Number(updates.weightKgPerUnit)
        : Number(existingItem.weightKgPerUnit);

    const warehouseId =
      updates.warehouseId !== undefined
        ? updates.warehouseId
        : existingItem.warehouseId;

    // --------------------------------
    // Validate quantity
    // --------------------------------
    if (
      !Number.isFinite(newQuantity) ||
      newQuantity < 0
    ) {
      throw new Error(
        "Quantity cannot be negative."
      );
    }

    // --------------------------------
    // Validate weight
    // --------------------------------
    if (
      !Number.isFinite(newWeightKgPerUnit) ||
      newWeightKgPerUnit <= 0
    ) {
      throw new Error(
        "Weight per unit must be greater than 0."
      );
    }

    // --------------------------------
    // Get warehouse
    // --------------------------------
    const warehouse =
      await getWarehouse(warehouseId);

    if (!warehouse) {
      throw new Error(
        `Warehouse ${warehouseId} not found.`
      );
    }

    const capacity =
      Number(warehouse.capacity);

    if (
      !Number.isFinite(capacity) ||
      capacity <= 0
    ) {
      throw new Error(
        `Warehouse ${warehouse.id} has an invalid capacity.`
      );
    }

    // --------------------------------
    // Calculate current warehouse weight
    // excluding the item being updated
    // --------------------------------
    const inventory =
      await getInventory();

    const currentWeight =
      inventory
        .filter(
          (inventoryItem) =>
            String(
              inventoryItem.warehouseId
            ) === String(warehouseId) &&
            String(inventoryItem.id) !==
              String(id)
        )
        .reduce(
          (total, inventoryItem) => {
            const quantity =
              Number(
                inventoryItem.quantity
              ) || 0;

            const weight =
              Number(
                inventoryItem.weightKgPerUnit
              ) || 0;

            return (
              total +
              quantity * weight
            );
          },
          0
        );

    // --------------------------------
    // Calculate updated item weight
    // --------------------------------
    const updatedItemWeight =
      newQuantity *
      newWeightKgPerUnit;

    const totalWeight =
      currentWeight +
      updatedItemWeight;

    // --------------------------------
    // Capacity check
    // --------------------------------
    if (totalWeight > capacity) {
      const availableCapacity =
        Math.max(
          capacity - currentWeight,
          0
        );

      throw new Error(
        `Warehouse ${warehouse.name} does not have enough capacity. ` +
        `Available: ${availableCapacity.toFixed(2)} kg. ` +
        `Required: ${updatedItemWeight.toFixed(2)} kg.`
      );
    }

    // --------------------------------
    // Normalize updates
    // --------------------------------
    const normalizedUpdates = {
      ...updates,
      quantity: newQuantity,
      weightKgPerUnit:
        newWeightKgPerUnit,
      warehouseId: String(warehouseId),
    };

    // --------------------------------
    // Update Redis
    // --------------------------------
    const item =
      await updateInventoryItem(
        id,
        normalizedUpdates
      );

    return Response.json({
      success: true,
      inventory: item,
    });
  } catch (error) {
    console.error(
      "PUT inventory item error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update inventory item.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request,
  { params }
) {
  try {
    const { id } = await params;

    const deleted =
      await deleteInventoryItem(id);

    if (!deleted) {
      return Response.json(
        {
          success: false,
          message:
            "Inventory item not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message:
        `Inventory item ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "DELETE inventory item error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to delete inventory item.",
      },
      { status: 500 }
    );
  }
}