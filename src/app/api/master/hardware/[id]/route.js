import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const hardwareId = parseInt(id, 10);
    const body = await request.json();
    const { hardware_code, hardware_name, category, brand, model, description, is_active } = body;
    
    if (isNaN(hardwareId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const item = await prisma.hardware.update({
      where: { hardware_id: hardwareId },
      data: {
        hardware_code,
        hardware_name,
        category: category || null,
        brand: brand || null,
        model: model || null,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const hardwareId = parseInt(id, 10);
    if (isNaN(hardwareId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const item = await prisma.hardware.update({
      where: { hardware_id: hardwareId },
      data: { is_active: false }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
