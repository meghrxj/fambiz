import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Use the token provided by the user, prioritizing environment variable
const PLACEHOLDER_TOKEN = "vercel_blob_rw_TwY6xtWQxNR36eVG_JaBjlo6v9C1KYFEW4AuqFlxZ2fsuCl";
const BLOB_TOKEN = (process.env.BLOB_READ_WRITE_TOKEN && 
                    process.env.BLOB_READ_WRITE_TOKEN.length > 0 && 
                    process.env.BLOB_READ_WRITE_TOKEN !== PLACEHOLDER_TOKEN) 
  ? process.env.BLOB_READ_WRITE_TOKEN 
  : null;

const BLOB_PREFIX = 'family_finance_db';
const BLOB_FILENAME = 'family_finance_db.json';
const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure the local data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

async function getLocalData() {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading local DB:', e);
      return {};
    }
  }
  return {};
}

async function saveLocalData(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving local DB:', e);
    return false;
  }
}

export async function GET() {
  try {
    console.log('GET /api/data - Attempting to fetch from Vercel Blob');
    
    if (!BLOB_TOKEN) {
      console.info('Vercel Blob token is missing or placeholder, using local storage');
      const data = await getLocalData();
      return NextResponse.json({ data });
    }

    // List blobs to find the latest one with our prefix
    let listResult;
    try {
      listResult = await list({
        prefix: BLOB_PREFIX,
        token: BLOB_TOKEN,
      });
    } catch (listErr) {
      console.warn('Vercel Blob list failed, falling back to local storage');
      const data = await getLocalData();
      return NextResponse.json({ data });
    }

    const blobs = listResult.blobs;

    if (!blobs || blobs.length === 0) {
      console.log('No blobs found, checking local storage');
      const data = await getLocalData();
      return NextResponse.json({ data });
    }

    // Sort by uploadedAt to get the latest.
    const latestBlob = blobs.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return dateB - dateA;
    })[0];
    
    console.log(`Fetching latest blob: ${latestBlob.url}`);
    try {
      const response = await fetch(latestBlob.url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch blob content from URL: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      
      // Update local cache
      await saveLocalData(data);
      
      return NextResponse.json({ data }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (fetchErr) {
      console.error('Error fetching blob content, falling back to local storage:', fetchErr);
      const data = await getLocalData();
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Error in GET /api/data:', error);
    const data = await getLocalData();
    return NextResponse.json({ data });
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

    // Always save locally as a backup
    await saveLocalData(dataToSave);

    if (!BLOB_TOKEN) {
      return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, local: true });
    }

    console.log('POST /api/data - Saving to Vercel Blob');
    
    try {
      const blob = await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: true,
        contentType: 'application/json',
      });
      
      console.log(`Successfully saved blob: ${blob.url}`);

      // Clean up old versions to keep it tidy
      try {
        const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
        const oldBlobs = blobs.filter(b => b.url !== blob.url);
        if (oldBlobs.length > 0) {
          console.log(`Cleaning up ${oldBlobs.length} old blobs`);
          await del(oldBlobs.map(b => b.url), { token: BLOB_TOKEN });
        }
      } catch (cleanupErr) {
        console.warn('Cleanup of old blobs failed:', cleanupErr);
      }

      return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, url: blob.url });
    } catch (putErr) {
      console.warn('Vercel Blob put failed, saved locally only');
      return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, local: true });
    }
  } catch (error) {
    console.error('Error in POST /api/data:', error);
    return NextResponse.json({ 
      error: 'Failed to save to database', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('DELETE /api/data - Clearing data');
    
    // Clear local data
    if (fs.existsSync(LOCAL_DB_PATH)) {
      fs.unlinkSync(LOCAL_DB_PATH);
    }

    if (!BLOB_TOKEN) {
      return NextResponse.json({ success: true, local: true });
    }

    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
      if (blobs.length > 0) {
        await del(blobs.map(b => b.url), { token: BLOB_TOKEN });
      }
    } catch (blobErr) {
      console.warn('Failed to clear Vercel Blob:', blobErr);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/data:', error);
    return NextResponse.json({ error: 'Failed to clear database', details: String(error) }, { status: 500 });
  }
}
