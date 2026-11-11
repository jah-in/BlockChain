import {
  getDistributions,
  createDistributionRecord,
  getInventory,
  getWarehouse,
  getInventoryItem,
  updateInventoryItem,
} from "@/lib/redis-store";

/**
 * GET /api/distributions
 *
 * Returns all distribution records.
 */
export async function GET() {
  try {
    const distributions =
      await getDistributions();

    return Response.json({
      success: true,
      distributions,
    });
  } catch (error) {
    console.error(
      "GET distributions error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to load distributions.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/distributions
 *
 * Creates a distribution and immediately
 * deducts the requested quantity from inventory.
 */
export async function POST(request) {
  try {
    const data = await request.json();

    const {
      warehouseId,
      itemId,
      quantity,
      destination,
      recipient,
      date,
    } = data;

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (!warehouseId) {
      throw new Error(
        "Warehouse is required."
      );
    }

    if (!itemId) {
      throw new Error(
        "Relief item is required."
      );
    }

    if (!destination?.trim()) {
      throw new Error(
        "Destination is required."
      );
    }

    if (!recipient?.trim()) {
      throw new Error(
        "Receiving center or recipient is required."
      );
    }

    if (!date) {
      throw new Error(
        "Distribution date is required."
      );
    }

    // --------------------------------------------------
    // Validate quantity
    // --------------------------------------------------

    const requestedQuantity =
      Number(quantity);

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      throw new Error(
        "Quantity must be greater than zero."
      );
    }

    // --------------------------------------------------
    // Find warehouse
    // --------------------------------------------------

    const warehouse =
      await getWarehouse(
        String(warehouseId)
      );

    if (!warehouse) {
      throw new Error(
        `Warehouse ${warehouseId} not found.`
      );
    }

    // --------------------------------------------------
    // Find inventory item
    // --------------------------------------------------

    const item =
      await getInventoryItem(
        String(itemId)
      );

    if (!item) {
      throw new Error(
        "The selected inventory item could not be found."
      );
    }

    // Make sure item belongs to selected warehouse.
    if (
      String(item.warehouseId) !==
      String(warehouseId)
    ) {
      throw new Error(
        "The selected inventory item does not belong to this warehouse."
      );
    }

    // --------------------------------------------------
    // Check stock
    // --------------------------------------------------

    const currentQuantity =
      Number(item.quantity) || 0;

    if (
      currentQuantity <
      requestedQuantity
    ) {
      throw new Error(
        `Insufficient stock. Only ${currentQuantity.toLocaleString()} ${item.unit} of ${item.name} are available in ${warehouse.name}.`
      );
    }

    // --------------------------------------------------
    // Calculate distribution weight
    // --------------------------------------------------

    const weightKgPerUnit =
      Number(item.weightKgPerUnit) || 0;

    const weightKg =
      requestedQuantity *
      weightKgPerUnit;

    // --------------------------------------------------
    // Get existing distributions
    //
    // Used to generate the next reference number.
    // --------------------------------------------------

    const existingDistributions =
      await getDistributions();

    const currentYear =
      new Date().getFullYear();

    const yearDistributions =
      existingDistributions.filter(
        (distribution) =>
          String(
            distribution.reference || ""
          ).startsWith(
            `DIST-${currentYear}-`
          )
      );

    const nextNumber =
      yearDistributions.length + 1;

    const reference =
      `DIST-${currentYear}-` +
      `${String(nextNumber).padStart(
        3,
        "0"
      )}`;

    // --------------------------------------------------
    // Generate unique distribution ID
    // --------------------------------------------------

    const distributionId =
      `DIST-${Date.now()}`;

    // --------------------------------------------------
    // Deduct inventory quantity
    // --------------------------------------------------

    const updatedInventory =
      await updateInventoryItem(
        String(item.id),
        {
          quantity:
            currentQuantity -
            requestedQuantity,
        }
      );

    // --------------------------------------------------
    // Create distribution
    // --------------------------------------------------

    const distribution = {
      id: distributionId,

      reference,

      warehouseId:
        String(warehouse.id),

      warehouseName:
        warehouse.name,

      warehouseLocation:
        warehouse.location || "",

      itemId:
        String(item.id),

      item:
        item.name,

      category:
        item.category || "Other",

      quantity:
        requestedQuantity,

      unit:
        item.unit || "kg",

      weightKg,

      destination:
        destination.trim(),

      recipient:
        recipient.trim(),

      date,

      status:
        "Pending",

      createdAt:
        new Date().toISOString(),

      // Blockchain fields are added
      // later when the distribution
      // is recorded on Sepolia.
      blockchainVerified:
        false,
    };

    const createdDistribution =
      await createDistributionRecord(
        distribution
      );

    return Response.json(
      {
        success: true,
        distribution:
          createdDistribution,

        inventory:
          updatedInventory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST distribution error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create distribution.",
      },
      { status: 400 }
    );
  }
}