import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  let parsed = {
    hasUrl: !!dbUrl,
    host: '',
    port: '',
    database: '',
    isInternal: false
  };

  if (dbUrl) {
    try {
      // url format: postgresql://user:pass@host:port/db?options
      const match = dbUrl.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
      if (match) {
        parsed.host = match[1];
        parsed.port = match[2] || '5432';
        parsed.database = match[3];
        parsed.isInternal = !match[1].match(/^\d+\.\d+\.\d+\.\d+$/) && match[1] !== 'localhost';
      }
    } catch (e) {
      parsed.error = e.message;
    }
  }

  return NextResponse.json(parsed);
}
