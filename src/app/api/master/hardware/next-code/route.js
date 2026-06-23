import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // Find the highest running number for this category prefix
    const existing = await prisma.hardware.findMany({
      where: {
        hardware_code: {
          startsWith: `${category}-`,
        },
      },
      select: { hardware_code: true },
      orderBy: { hardware_code: "desc" },
    });

    let nextNumber = 1;
    if (existing.length > 0) {
      // Extract numbers from existing codes like "LAPTOP-001", "LAPTOP-012"
      const numbers = existing.map(h => {
        const parts = h.hardware_code.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      });
      nextNumber = Math.max(...numbers) + 1;
    }

    const nextCode = `${category}-${String(nextNumber).padStart(3, "0")}`;
    return NextResponse.json({ nextCode });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
