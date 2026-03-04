import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

// Use the token provided by the user, prioritizing environment variable
const BLOB_TOKEN = (process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 0) 
  ? process.env.BLOB_READ_WRITE_TOKEN 
  : "vercel_blob_rw_u7xmQmFK11UoBPbb_xnZiuH1Y9Pbd11RnkpFRYVQIlA2BkY";

const BLOB_PREFIX = 'family_finance_db';
const BLOB_FILENAME = 'family_finance_db.json';

export async function GET() {
  try {
    console.log('GET /api/data - Fetching from Vercel Blob');
    
    if (!BLOB_TOKEN || BLOB_TOKEN.length < 10) {
      throw new Error('Vercel Blob token is missing or invalid');
    }

    // List blobs to find the latest one with our prefix
    let listResult;
    try {
      listResult = await list({
        prefix: BLOB_PREFIX,
        token: BLOB_TOKEN,
      });
    } catch (listErr) {
      console.error('Vercel Blob list error:', listErr);
      throw new Error(`Vercel Blob list failed: ${listErr instanceof Error ? listErr.message : String(listErr)}`);
    }

    const blobs = listResult.blobs;

    if (!blobs || blobs.length === 0) {
      console.log('No blobs found, returning empty data');
      return NextResponse.json({ data: {} });
    }

    // Sort by uploadedAt to get the latest.
    const latestBlob = blobs.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return dateB - dateA;
    })[0];
    
    console.log(`Fetching latest blob: ${latestBlob.url}`);
    const response = await fetch(latestBlob.url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content from URL: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error in GET /api/data (Vercel Blob):', error);
    return NextResponse.json({ 
      error: 'Failed to read database', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    if (!BLOB_TOKEN || BLOB_TOKEN.length < 10) {
      throw new Error('Vercel Blob token is missing or invalid');
    }

    const dataToSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    console.log('POST /api/data - Saving to Vercel Blob');
    
    let blob;
    try {
      blob = await put(BLOB_FILENAME, JSON.stringify(dataToSave, null, 2), {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: true,
        contentType: 'application/json',
      });
    } catch (putErr) {
      console.error('Vercel Blob put error:', putErr);
      throw new Error(`Vercel Blob put failed: ${putErr instanceof Error ? putErr.message : String(putErr)}`);
    }

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
  } catch (error) {
    console.error('Error in POST /api/data (Vercel Blob):', error);
    return NextResponse.json({ 
      error: 'Failed to save to database', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!BLOB_TOKEN) {
      throw new Error('Vercel Blob token is missing');
    }

    console.log('DELETE /api/data - Clearing Vercel Blob');
    const { blobs } = await list({ prefix: BLOB_PREFIX, token: BLOB_TOKEN });
    if (blobs.length > 0) {
      await del(blobs.map(b => b.url), { token: BLOB_TOKEN });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/data (Vercel Blob):', error);
    return NextResponse.json({ error: 'Failed to clear database', details: String(error) }, { status: 500 });
  }
}
