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
    const { hardware_code, hardware_name, brand, model, description } = body;
    
    if (!hardware_code || !hardware_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.hardware.create({
      data: {
        hardware_code,
        hardware_name,
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
