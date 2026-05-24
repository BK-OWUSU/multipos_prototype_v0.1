// lib/bulk-import/excel-parser.ts
import * as XLSX from 'xlsx';
import { z, ZodError } from 'zod';
import { CSVParseResult, CSVParseError, BulkImportConfig } from '@/types/schema/bulkupload.schema';

/**
 * Parses an Excel (.xlsx) file, skipping the "Instructions" tab 
 * and validating rows inside the data tab against your Zod schema.
 */
export async function parseExcel<TSchema extends z.ZodType>(
  file: File,
  config: BulkImportConfig<TSchema>
): Promise<CSVParseResult<z.infer<TSchema>>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Look for a custom tab name or fall back to "Import Data"
    const dataSheetName = "Import Data";
    const dataSheet = workbook.Sheets[dataSheetName];

    if (!dataSheet) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Missing required sheet tab named: "${dataSheetName}"` }]
      };
    }

    // Convert the data sheet rows directly into array objects
    // defval: "" ensures empty fields don't get omitted entirely from the object keys
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(dataSheet, { defval: "" });
    
    const validRows: z.infer<TSchema>[] = [];
    const errors: CSVParseError[] = [];

    rawRows.forEach((row, index) => {
      // Clean leading/trailing spaces from header keys and text cells
      const cleanedRow: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        const value = row[key];
        cleanedRow[key.trim()] = typeof value === 'string' ? value.trim() : value;
      });

      try {
        const validatedRow = config.schema.parse(cleanedRow);
        
        if (config.validateRow) {
          const customValidation = config.validateRow(validatedRow, index);
          if (!customValidation.valid) {
            errors.push({
              row: index + 2, // Map closely to the true Excel row index (accounting for header row)
              message: customValidation.error || 'Validation failed',
              data: cleanedRow,
            });
            return;
          }
        }
        
        validRows.push(validatedRow);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            errors.push({
              row: index + 2,
              field: err.path[0]?.toString(),
              message: err.message,
              data: cleanedRow,
            });
          });
        } else if (error instanceof Error) {
          errors.push({
            row: index + 2,
            message: error.message || 'Invalid row format',
            data: cleanedRow,
          });
        } else {
          errors.push({
            row: index + 2,
            message: 'Unknown validation error',
            data: cleanedRow,
          });
        }
      }
    });

    return {
      success: errors.length === 0,
      data: validRows,
      errors,
    };

  } catch (error: any) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: `Excel reading error: ${error?.message || error}` }]
    };
  }
}

/**
 * Downloads a dual-tab template workbook (.xlsx) containing an 
 * Instructions sheet and an Import Data spreadsheet structure.
 */
export function downloadTemplate<TSchema extends z.ZodType>(
  config: BulkImportConfig<TSchema>
): void {
  // 1. Initialize a blank Excel Workbook instance
  const workbook = XLSX.utils.book_new();

  // 2. Build the Instruction Tab Rows
  const instructionRows = [
    ["BULK IMPORT INSTRUCTIONS & RULES"],
    [""],
    ["1. Do NOT rename, remove, or re-order any header names on the 'Import Data' sheet."],
    ["2. Ensure required fields are not empty before executing an upload."],
    [`3. Your entity types should map matching properties configured for: ${config.entityName}.`],
    [""],
    ["COLUMN NAME REFERENCE AND RULES:"],
    ...config.templateHeaders.map(header => [header, "Text/Numeric input matching field constraints"])
  ];
  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows);

  // 3. Build the Data Template Tab using your config values
  const dataRows = [
    config.templateHeaders,  // Row 1: Keys/Headers
    config.templateExample   // Row 2: Visual Guidance Example
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);

  // 4. Mount tabs into the workbook hierarchy
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Import Data");

  // 5. Generate binary blob array from sheet and prompt download stream
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.entityName.toLowerCase()}_import_template.xlsx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
