import { NextResponse } from 'next/server';
import fs from 'fs';
import { execSync } from 'child_process';

export async function GET() {
  const result = {
    uploadsExists: fs.existsSync('/app/public/uploads'),
    dfOutput: '',
    mountsOutput: '',
    error: null
  };

  try {
    result.dfOutput = execSync('df -h /app/public/uploads 2>&1').toString();
  } catch (e) {
    result.error = e.message;
  }

  try {
    result.mountsOutput = execSync('mount | grep uploads 2>&1').toString();
  } catch (e) {
    // If grep fails, it returns exit code 1
  }

  return NextResponse.json(result);
}
