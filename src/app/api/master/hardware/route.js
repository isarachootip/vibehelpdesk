import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const hardware = await prisma.hardware.findMany({
      orderBy: { hardware_name: "asc" },
      include: {
        symptoms: true,
      }
    });
    return NextResponse.json(hardware);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { hardware_name, category, brand, model, description } = body;
    
    if (!hardware_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "กรุณาเลือกประเภท / Category" }, { status: 400 });
    }

    // Auto-generate hardware_code from category + running number
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
      const numbers = existing.map(h => {
        const parts = h.hardware_code.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      });
      nextNumber = Math.max(...numbers) + 1;
    }

    const hardware_code = `${category}-${String(nextNumber).padStart(3, "0")}`;

    const item = await prisma.hardware.create({
      data: {
        hardware_code,
        hardware_name,
        category,
        brand: brand || null,
        model: model || null,
        description: description || null,
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
