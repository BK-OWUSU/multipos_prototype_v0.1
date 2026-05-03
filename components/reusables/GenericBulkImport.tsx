// components/bulk-import/GenericBulkImport.tsx
"use client";

import { useState, ChangeEvent, useTransition } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import CustomButton from '@/components/reusables/CustomButton';
import { toast } from 'sonner';
import { parseCSV, downloadTemplate } from '@/lib/bulk-import/csv-parser';
import { BulkImportConfig, CSVParseResult, BulkImportResult } from '@/schema/bulkupload.schema';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

interface GenericBulkImportProps<TSchema extends z.ZodType, TOutput = z.infer<TSchema>> {
  config: BulkImportConfig<TSchema, TOutput>;
  additionalPayload?: Record<string, unknown>;
  onSuccess?: (result: BulkImportResult) => void;
  onImportParsedSuccess?: ()=> void;
  onCancel?: () => void;
  renderPreview?: (data: TOutput[]) => React.ReactNode;
}

interface UploadProgress {
  total: number;
  success: number;
  failed: number;
}

export default function GenericBulkImport<TSchema extends z.ZodType, TOutput>({
  config,
  additionalPayload = {},
  onSuccess,
  onImportParsedSuccess,
  onCancel,
  renderPreview,
}: GenericBulkImportProps<TSchema, TOutput>) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult<z.infer<TSchema>> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    success: 0,
    failed: 0,
  });
//   const [isPending, startTransition] = useTransition()

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    
    toast.info('Parsing CSV file...');
    const result = await parseCSV(selectedFile, config);
    setParseResult(result);

    if (result.success) {
      toast.success(`Successfully parsed ${result.data.length} ${config.entityNamePlural.toLowerCase()}`);
      if (onImportParsedSuccess) onImportParsedSuccess();
    } else {
      toast.error(`Found ${result.errors.length} errors in CSV`);
    }
  };


  const handleUpload = async (): Promise<void> => {
    if (!parseResult || !parseResult.success || parseResult.data.length === 0) {
      toast.error('No valid data to upload');
      return;
    }

    setIsUploading(true);
    
    const transformedData =( 
    config.transformData
      ? parseResult.data.map(config.transformData)
      : parseResult.data
    ) as TOutput[];
    
    setUploadProgress({
      total: transformedData.length,
      success: 0,
      failed: 0,
    });

    // 2. Prepare the payload
    const payload = {
      data: transformedData,
      ...additionalPayload,
    } as { data: TOutput[]; [key: string]: unknown };

try {
      let result: BulkImportResult;

      // 3. Handle based on type of apiEndpoint
      if (typeof config.apiEndpoint === 'string') {
        // Handle API Route (String)
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        result = await response.json();
      } else {
        // Handle Server Action (Function) with startTransition because Server Actions impact app state
        result = await config.apiEndpoint(payload);
        if (result.success && result.message) {
          toast.success(result.message);
        }else if (!result.success && result.error) {
          toast.error(result.error);
        }else {
          toast.error('Bulk import failed');
        } 
      }

      // 4. Handle the result
      if (result.success) {
        setUploadProgress({
          total: result.total,
          success: result.success_count,
          failed: result.failed_count,
        });

        if (result.failed_count === 0) {
          toast.success(`Successfully imported ${result.success_count} ${config.entityNamePlural.toLowerCase()}!`);
          if (onSuccess) onSuccess(result);
        } else {
          toast.warning(
            `Imported ${result.success_count} ${config.entityNamePlural.toLowerCase()}. ${result.failed_count} failed.`
          );
        }
      } else {
        toast.error(result.error || 'Bulk import failed');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(`Failed to import ${config.entityNamePlural.toLowerCase()}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bulk {config.entityName} Import</h3>
          <p className="text-sm text-gray-500">
            Upload a CSV file to import multiple {config.entityNamePlural.toLowerCase()}
          </p>
        </div>
        {/* {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        )} */}
      </div>

      {/* Download Template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">First time importing?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Download our CSV template with the correct format and example data.
            </p>
            <CustomButton
              text="Download Template"
              onClick={() => downloadTemplate(config)}
              customVariant="secondary"
              icon={<Download className="mr-2 h-4 w-4" />}
              className="mt-3"
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
          disabled={isUploading}
        />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            {file ? file.name : 'Click to upload CSV file'}
          </p>
          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
        </label>
      </div>

      {/* Parse Results */}
      {parseResult && (
        <div className="space-y-4">
          {/* Success Summary */}
          {parseResult.success && parseResult.data.length > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{parseResult.data.length} valid {config.entityNamePlural.toLowerCase()}</strong> ready to import
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{parseResult.errors.length} errors</strong> found in CSV
                <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                  {parseResult.errors.map((error, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border border-red-200">
                      <span className="font-semibold">Row {error.row}:</span>{' '}
                      {error.field && <span className="text-red-600">[{error.field}]</span>}{' '}
                      {error.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Custom Preview or Default Preview */}
          {parseResult.data.length > 0 && (
            renderPreview ? renderPreview(parseResult.data) : (
              <DefaultPreview data={parseResult.data} entityName={config.entityNamePlural} />
            )
          )}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="font-medium text-blue-900">Importing {config.entityNamePlural.toLowerCase()}...</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-semibold">{uploadProgress.total}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Successful:</span>
              <span className="font-semibold">{uploadProgress.success}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Failed:</span>
              <span className="font-semibold">{uploadProgress.failed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <CustomButton
            text="Cancel"
            onClick={onCancel}
            customVariant="secondary"
            className="flex-1"
            disabled={isUploading}
          />
        )}
        <CustomButton
          text={`Import ${parseResult?.data.length || 0} ${config.entityNamePlural}`}
          onClick={handleUpload}
          customVariant="primary"
          icon={<Upload className="mr-2 h-4 w-4" />}
          className="flex-1"
          isLoading={isUploading}
          disabled={!parseResult?.success || parseResult.data.length === 0}
        />
      </div>
    </div>
  );
}

// Default Preview Component
interface DefaultPreviewProps<T extends Record<string, unknown>> {
  data: T[];
  entityName: string;
}

function DefaultPreview<T extends Record<string, unknown>>({ 
  data, 
  entityName 
}: DefaultPreviewProps<T>) {
  const sampleData = data.slice(0, 5);
  const keys = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

  const renderCellValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="font-medium">Preview (First 5 rows)</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {keys.map((key) => (
                <th key={key} className="px-4 py-2 text-left capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, index) => (
              <tr key={index} className="border-b">
                {keys.map((key) => (
                  <td key={key} className="px-4 py-2">
                    {renderCellValue(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 5 && (
        <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
          + {data.length - 5} more {entityName.toLowerCase()}
        </div>
      )}
    </div>
  );
}