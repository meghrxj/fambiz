import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Use the root directory for the data file to be more reliable
const DATA_FILE = path.join(process.cwd(), 'family_finance_db.json');

export async function GET() {
  try {
    console.log('GET /api/data - Reading from:', DATA_FILE);
    
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ data: null, message: 'Database file not found' });
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!fileContent || !fileContent.trim()) {
      return NextResponse.json({ data: null, message: 'Database is empty' });
    }

    try {
      const data = JSON.parse(fileContent);
      return NextResponse.json({ data });
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr);
      // If corrupted, return null so client can start fresh or handle it
      return NextResponse.json({ data: null, error: 'Database corrupted' });
    }
  } catch (error) {
    console.error('Error in GET /api/data:', error);
    return NextResponse.json({ error: 'Failed to read database', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const dataToSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    console.log('POST /api/data - Writing to:', DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));

    return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt });
  } catch (error) {
    console.error('Error in POST /api/data:', error);
    return NextResponse.json({ error: 'Failed to save to database', details: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('DELETE /api/data - Clearing database');
    if (fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/data:', error);
    return NextResponse.json({ error: 'Failed to clear database', details: String(error) }, { status: 500 });
  }
}
