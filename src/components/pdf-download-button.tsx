'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { OptimizationResult } from '@/types/optimization-types';
import { FormDataType } from '@/types/form-schema';
import { generatePDFReport } from '@/utils/pdf-generator';
import { ShapeDiverOutputs } from '@/components/shapediver';
// import { useToast } from '@/hooks/use-toast'; // Toast system not available

interface PDFDownloadButtonProps {
  optimizationResult: OptimizationResult;
  designInputs: FormDataType;
  shapeDiverOutputs?: ShapeDiverOutputs;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * PDF Download Button Component
 * Generates and downloads a comprehensive calculation report as PDF
 */
export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  optimizationResult,
  designInputs,
  shapeDiverOutputs,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);
    setError(null); // Clear any previous errors

    try {
      // Validate that we have the required data
      if (!optimizationResult?.calculated?.detailed_verification_results) {
        throw new Error('No verification results available for PDF generation');
      }

      if (!designInputs) {
        throw new Error('Design inputs are required for PDF generation');
      }

      // Generate and download the PDF
      await generatePDFReport(optimizationResult, designInputs, shapeDiverOutputs);

      // Log successful generation for debugging
      console.log('📄 PDF report generated successfully', {
        timestamp: new Date().toISOString(),
        totalWeight: optimizationResult.totalWeight,
        allChecksPass: optimizationResult.calculated?.all_checks_pass,
        verificationCount: Object.keys(optimizationResult.calculated?.detailed_verification_results || {}).length
      });

    } catch (error) {
      console.error('Error generating PDF report:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF report.';
      setError(errorMessage);

      // Show browser alert as fallback notification
      alert(`PDF Generation Failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine if button should be disabled
  const isDisabled = disabled ||
    isGenerating ||
    !optimizationResult?.calculated?.detailed_verification_results ||
    !designInputs;

  // Button content based on state
  const getButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      );
    }

    if (size === 'icon') {
      return <Download className="h-4 w-4" />;
    }

    return (
      <>
        <FileText className="mr-2 h-4 w-4" />
        Download PDF Report
      </>
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDisabled}
      className={className}
      title={isDisabled && !isGenerating ? 'PDF generation requires complete verification results' : 'Download calculation report as PDF'}
    >
      {getButtonContent()}
    </Button>
  );
};

export default PDFDownloadButton;