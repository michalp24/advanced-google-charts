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
      return NextResponse.json(
        { 
          error: `Failed to fetch data from Google Sheets. Status: ${response.status}. Make sure the sheet is published to the web.` 
        },
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
