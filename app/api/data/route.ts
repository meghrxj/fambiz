import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

// Use the token provided by the user
const BLOB_TOKEN = "vercel_blob_rw_u7xmQmFK11UoBPbb_xnZiuH1Y9Pbd11RnkpFRYVQIlA2BkY";
const BLOB_PATH = 'family_finance_db.json';

export async function GET() {
  try {
    console.log('GET /api/data - Fetching from Vercel Blob');
    
    // List blobs to find the latest one with our prefix
    const { blobs } = await list({
      prefix: 'family_finance_db',
      token: BLOB_TOKEN,
    });

    if (blobs.length === 0) {
      return NextResponse.json({ data: null, message: 'No database found on Vercel Blob' });
    }

    // Sort by uploadedAt to get the latest
    const latestBlob = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
    
    const response = await fetch(latestBlob.url);
    if (!response.ok) {
      return NextResponse.json({ data: null, message: 'Failed to fetch blob content' });
    }

    const data = await response.json();
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/data (Vercel Blob):', error);
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

    console.log('POST /api/data - Saving to Vercel Blob');
    
    // Save to Vercel Blob. We use addRandomSuffix: true to ensure a unique URL
    // which bypasses any CDN/browser caching of the blob itself.
    const blob = await put(BLOB_PATH, JSON.stringify(dataToSave, null, 2), {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: true,
      contentType: 'application/json',
    });

    // Clean up old versions to keep it tidy (optional but good)
    try {
      const { blobs } = await list({ prefix: 'family_finance_db', token: BLOB_TOKEN });
      const oldBlobs = blobs.filter(b => b.url !== blob.url);
      if (oldBlobs.length > 0) {
        await del(oldBlobs.map(b => b.url), { token: BLOB_TOKEN });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup of old blobs failed:', cleanupErr);
    }

    return NextResponse.json({ success: true, updatedAt: dataToSave.updatedAt, url: blob.url });
  } catch (error) {
    console.error('Error in POST /api/data (Vercel Blob):', error);
    return NextResponse.json({ error: 'Failed to save to database', details: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    console.log('DELETE /api/data - Clearing Vercel Blob');
    const { blobs } = await list({ prefix: 'family_finance_db', token: BLOB_TOKEN });
    if (blobs.length > 0) {
      await del(blobs.map(b => b.url), { token: BLOB_TOKEN });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/data (Vercel Blob):', error);
    return NextResponse.json({ error: 'Failed to clear database', details: String(error) }, { status: 500 });
  }
}
