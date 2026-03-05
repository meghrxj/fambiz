import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Use the token provided by the user, prioritizing environment variable
const getCleanToken = () => {
  const rawToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!rawToken || rawToken.length === 0) return null;
  
  // Strip quotes if present
  return rawToken.replace(/^["']|["']$/g, '');
};

const BLOB_TOKEN = getCleanToken();
const BLOB_PREFIX = 'family_finance_db';
const BLOB_FILENAME = 'family_finance_db.json';
const FALLBACK_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure the fallback directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

async function getFallbackData() {
  if (fs.existsSync(FALLBACK_PATH)) {
    try {
      const content = fs.readFileSync(FALLBACK_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return {};
    }
  }
  return {};
}

async function saveFallbackData(data: any) {
  try {
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    console.log('GET /api/data - Fetching data');
    
    if (BLOB_TOKEN) {
      try {
        const { blobs } = await list({
          prefix: BLOB_PREFIX,
          token: BLOB_TOKEN,
        });

        if (blobs && blobs.length > 0) {
          const latestBlob = blobs.sort((a, b) => 
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          )[0];
          
          const response = await fetch(latestBlob.url, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            await saveFallbackData(data); // Keep fallback in sync
            return NextResponse.json({ data });
          }
        }
      } catch (blobError: any) {
        // SILENT FALLBACK: If store doesn't exist or token is invalid, use local data
        console.warn('Vercel Blob unavailable, using fallback storage:', blobError.message);
      }
    }

    const data = await getFallbackData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/data:', error);
    return NextResponse.json({ data: {} });
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

    // Always save to fallback first for safety
    await saveFallbackData(dataToSave);

    if (BLOB_TOKEN) {
      try {
        const blob = await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
          access: 'public',
          token: BLOB_TOKEN,
          addRandomSuffix: true,
          contentType: 'application/json',
        });
        
        // Cleanup old versions
        try {
          const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
          const oldBlobs = blobs.filter(b => b.url !== blob.url);
          if (oldBlobs.length > 0) {
            await del(oldBlobs.map(b => b.url), { token: BLOB_TOKEN });
          }
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }

        return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, url: blob.url });
      } catch (putErr: any) {
        console.warn('Vercel Blob save failed, saved to fallback:', putErr.message);
        return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, fallback: true });
      }
    }

    return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, fallback: true });
  } catch (error) {
    console.error('Error in POST /api/data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(FALLBACK_PATH)) {
      fs.unlinkSync(FALLBACK_PATH);
    }

    if (BLOB_TOKEN) {
      try {
        const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
        if (blobs.length > 0) {
          await del(blobs.map(b => b.url), { token: BLOB_TOKEN });
        }
      } catch (blobErr) {
        // Ignore blob errors on delete
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
