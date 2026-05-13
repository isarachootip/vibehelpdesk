import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const hardwareId = parseInt(id, 10);
    const body = await request.json();
    const { symptom_code, symptom_name, description } = body;
    
    if (isNaN(hardwareId) || !symptom_code || !symptom_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.hardwareSymptom.create({
      data: {
        hardware_id: hardwareId,
        symptom_code,
        symptom_name,
        description: description || null,
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
