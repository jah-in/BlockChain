import {
  getWarehouses,
  createWarehouse,
} from "@/lib/redis-store";

export async function GET() {
  try {
    const warehouses = await getWarehouses();

    return Response.json({
      success: true,
      warehouses,
    });
  } catch (error) {
    console.error("GET warehouses error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const warehouse = await request.json();

    const createdWarehouse = await createWarehouse(warehouse);

    return Response.json(
      {
        success: true,
        warehouse: createdWarehouse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST warehouse error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
}