import {
  getDistribution,
  updateDistributionRecord,
} from "@/lib/redis-store";

const ALLOWED_STATUSES = [
  "Pending",
  "In Transit",
  "Delivered",
];

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const distribution =
      await getDistribution(id);

    if (!distribution) {
      return Response.json(
        {
          success: false,
          message: "Distribution record not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      distribution,
    });
  } catch (error) {
    console.error(
      "GET distribution error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to load distribution.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    const updates = await request.json();

    const existing =
      await getDistribution(id);

    if (!existing) {
      return Response.json(
        {
          success: false,
          message: "Distribution record not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Status validation
    // -----------------------------------------

    if (
      updates.status !== undefined &&
      !ALLOWED_STATUSES.includes(
        updates.status
      )
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid distribution status.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Only allow fields that we actually need
    // to update.
    // -----------------------------------------

    const allowedUpdates = {};

    if (updates.status !== undefined) {
      allowedUpdates.status =
        updates.status;
    }

    if (
      updates.blockchainVerified !==
      undefined
    ) {
      allowedUpdates.blockchainVerified =
        Boolean(
          updates.blockchainVerified
        );
    }

    if (
      updates.blockchainTransactionHash !==
      undefined
    ) {
      allowedUpdates.blockchainTransactionHash =
        String(
          updates.blockchainTransactionHash
        );
    }

    if (
      updates.blockchainBlockNumber !==
      undefined
    ) {
      allowedUpdates.blockchainBlockNumber =
        updates.blockchainBlockNumber;
    }

    if (
      updates.blockchainWallet !==
      undefined
    ) {
      allowedUpdates.blockchainWallet =
        String(
          updates.blockchainWallet
        );
    }

    if (
      updates.blockchainRecordedAt !==
      undefined
    ) {
      allowedUpdates.blockchainRecordedAt =
        String(
          updates.blockchainRecordedAt
        );
    }

    const updatedDistribution =
      await updateDistributionRecord(
        id,
        allowedUpdates
      );

    return Response.json({
      success: true,
      distribution:
        updatedDistribution,
    });
  } catch (error) {
    console.error(
      "PUT distribution error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update distribution.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    return Response.json(
      {
        success: false,
        message:
          "Distribution deletion is not enabled.",
      },
      { status: 405 }
    );
  } catch (error) {
    console.error(
      "DELETE distribution error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to delete distribution.",
      },
      { status: 500 }
    );
  }
}