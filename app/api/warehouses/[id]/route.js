import {
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/lib/redis-store";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const warehouse = await getWarehouse(id);

    if (!warehouse) {
      return Response.json(
        {
          success: false,
          message: "Warehouse not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("GET warehouse error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const updates = await request.json();

    const warehouse = await updateWarehouse(id, updates);

    return Response.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("PUT warehouse error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const deleted = await deleteWarehouse(id);

    if (!deleted) {
      return Response.json(
        {
          success: false,
          message: "Warehouse not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: `Warehouse ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE warehouse error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}