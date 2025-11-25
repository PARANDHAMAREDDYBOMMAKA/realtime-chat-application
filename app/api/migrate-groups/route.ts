import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const result = await client.mutation(api.migrations.migrateExistingGroups, {});

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      result,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
