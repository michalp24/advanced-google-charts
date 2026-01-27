/**
 * Data utilities for parsing and fetching chart data
 */

/**
 * Parse CSV text into a 2D array
 */
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    // Simple CSV parser - handles basic cases and quoted fields
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Push the last field
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

/**
 * Parse tab-separated text (e.g., pasted from Excel/Sheets)
 */
export function parseTSV(tsvText: string): string[][] {
  const lines = tsvText.trim().split('\n');
  return lines.map(line => line.split('\t').map(cell => cell.trim()));
}

/**
 * Auto-detect delimiter and parse data
 */
export function parseData(text: string): string[][] {
  // Check if it's TSV (contains tabs)
  if (text.includes('\t')) {
    return parseTSV(text);
  }
  // Otherwise treat as CSV
  return parseCSV(text);
}

/**
 * Extract Google Sheets ID from various URL formats
 */
export function extractSheetsId(url: string): string | null {
  // Match various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get Google Sheets published URL for visualization
 * Note: The sheet must be published to the web for this to work
 */
export function getSheetsVisualizationUrl(sheetsId: string, gid?: string): string {
  const baseUrl = 'https://docs.google.com/spreadsheets/d';
  const gidParam = gid ? `&gid=${gid}` : '';
  return `${baseUrl}/${sheetsId}/gviz/tq?tqx=out:csv${gidParam}`;
}

/**
 * Fetch data from a published Google Sheet
 */
export async function fetchGoogleSheetsData(sheetsUrl: string): Promise<{
  success: boolean;
  data?: string[][];
  error?: string;
}> {
  try {
    const sheetsId = extractSheetsId(sheetsUrl);
    
    if (!sheetsId) {
      return {
        success: false,
        error: 'Invalid Google Sheets URL. Please provide a valid spreadsheet URL.',
      };
    }

    // Extract gid (sheet ID) if present
    const gidMatch = sheetsUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : undefined;

    const csvUrl = getSheetsVisualizationUrl(sheetsId, gid);
    
    // Fetch the CSV data
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch data. Make sure the spreadsheet is published to the web (File > Share > Publish to web).',
      };
    }

    const csvText = await response.text();
    const data = parseCSV(csvText);

    if (data.length === 0) {
      return {
        success: false,
        error: 'The spreadsheet appears to be empty.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate that data has at least one row (header) and one data row
 */
export function validateChartData(data: string[][]): {
  valid: boolean;
  error?: string;
} {
  if (!data || data.length === 0) {
    return { valid: false, error: 'No data provided' };
  }

  if (data.length < 2) {
    return { valid: false, error: 'Data must have at least a header row and one data row' };
  }

  const columnCount = data[0].length;
  if (columnCount === 0) {
    return { valid: false, error: 'Data must have at least one column' };
  }

  // Check that all rows have the same number of columns
  for (let i = 1; i < data.length; i++) {
    if (data[i].length !== columnCount) {
      return { 
        valid: false, 
        error: `Row ${i + 1} has ${data[i].length} columns, but header has ${columnCount} columns` 
      };
    }
  }

  return { valid: true };
}

/**
 * Convert string data to typed data (numbers, strings, etc.)
 */
export function inferDataTypes(data: string[][]): any[][] {
  if (data.length === 0) return [];

  const result: any[][] = [];
  
  // Keep header as strings
  result.push([...data[0]]);

  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row: any[] = [];
    for (let j = 0; j < data[i].length; j++) {
      const cell = data[i][j];
      
      // Try to parse as number (skip first column which is usually labels)
      if (j > 0 && cell !== '' && !isNaN(Number(cell))) {
        row.push(Number(cell));
      } else {
        row.push(cell);
      }
    }
    result.push(row);
  }

  return result;
}
