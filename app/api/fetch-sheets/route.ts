import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch Google Sheets data server-side (bypasses CORS)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sheetsUrl = searchParams.get('url');

    if (!sheetsUrl) {
      return NextResponse.json(
        { error: 'Missing sheets URL parameter' },
        { status: 400 }
      );
    }

    // Fetch the CSV data from Google Sheets
    const response = await fetch(sheetsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdvancedGoogleCharts/1.0)',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = `❌ Permission Denied (${response.status}): Your sheet is NOT publicly accessible.\n\n` +
          `📝 Try this instead:\n` +
          `1. Go to File → Share → Publish to web\n` +
          `2. Choose "Comma-separated values (.csv)"\n` +
          `3. Click Publish\n` +
          `4. Copy the CSV URL it gives you (should contain "/pub?output=csv")\n` +
          `5. Paste that URL here`;
      } else if (response.status === 404) {
        errorMessage = `Sheet not found (404). Check that the URL is correct and the sheet exists.`;
      } else {
        errorMessage = `Failed to fetch data. Status: ${response.status}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const csvText = await response.text();

    return NextResponse.json({
      success: true,
      data: csvText,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
