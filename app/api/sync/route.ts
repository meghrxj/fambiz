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
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ data: null });
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!fileContent.trim()) {
      return NextResponse.json({ data: null });
    }
    const data = JSON.parse(fileContent);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    const dataToSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));

    return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
