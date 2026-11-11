import { getRedis } from "@/lib/redis";

export async function GET() {
  try {
    const redis = await getRedis();

    await redis.set("relieftrack:test", "Redis is working!");

    const value = await redis.get("relieftrack:test");

    return Response.json({
      success: true,
      message: "Redis connection successful",
      value,
    });
  } catch (error) {
    console.error("Redis test failed:", error);

    return Response.json(
      {
        success: false,
        message: "Redis connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}