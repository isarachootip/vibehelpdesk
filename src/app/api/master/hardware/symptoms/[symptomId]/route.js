import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { symptomId } = await params;
    const sId = parseInt(symptomId, 10);
    const body = await request.json();
    const { symptom_code, symptom_name, description, is_active } = body;
    
    if (isNaN(sId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const item = await prisma.hardwareSymptom.update({
      where: { symptom_id: sId },
      data: {
        symptom_code,
        symptom_name,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Symptom code already exists for this hardware" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { symptomId } = await params;
    const sId = parseInt(symptomId, 10);
    if (isNaN(sId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const item = await prisma.hardwareSymptom.delete({
      where: { symptom_id: sId }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
