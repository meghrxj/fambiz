import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'finance_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const syncKey = searchParams.get('key');

  if (!syncKey) {
    return NextResponse.json({ error: 'Sync key is required' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ data: null });
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const allData = JSON.parse(fileContent);

    // Return data for the specific key
    return NextResponse.json({ data: allData[syncKey] || null });
  } catch (error) {
    console.error('Error reading sync data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, data } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Sync key is required' }, { status: 400 });
    }

    let allData: Record<string, any> = {};
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      allData = JSON.parse(fileContent);
    }

    // Update data for the specific key
    allData[key] = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));

    return NextResponse.json({ success: true, updatedAt: allData[key].updatedAt });
  } catch (error) {
    console.error('Error saving sync data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const syncKey = searchParams.get('key');

  if (!syncKey) {
    return NextResponse.json({ error: 'Sync key is required' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ success: true });
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const allData = JSON.parse(fileContent);

    if (allData[syncKey]) {
      delete allData[syncKey];
      fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sync data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
