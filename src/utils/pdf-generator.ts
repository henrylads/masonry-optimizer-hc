import jsPDF from 'jspdf';
import { FormDataType } from '@/types/form-schema';
import { OptimizationResult } from '@/types/optimization-types';
import { ShapeDiverOutputs } from '@/components/shapediver';
import {
  extractPDFReportData,
  PDFReportData,
  FormattedCalculation
} from './pdf-data-extractor';

/**
 * PDF generation utility for masonry support calculation reports
 */
export class CalculationPDFGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private data: PDFReportData;
  private shapeDiverOutputs?: ShapeDiverOutputs;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.data = {} as PDFReportData; // Will be set in generateReport
  }

  /**
   * Main method to generate the complete calculation report
   */
  async generateReport(result: OptimizationResult, formData: FormDataType, shapeDiverOutputs?: ShapeDiverOutputs): Promise<void> {
    try {
      // Extract all data needed for the PDF
      this.data = extractPDFReportData(result, formData);
      this.shapeDiverOutputs = shapeDiverOutputs;

      // Build the PDF document
      this.addHeader();
      this.addDesignInputsSection();
      this.addFinalDesignSection();
      if (shapeDiverOutputs) {
        this.addShapeDiverOutputsSection();
      }
      this.addCalculationsSection();
      this.addVerificationSummarySection();
      this.addFooter();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
      const filename = `masonry-calculation-report-${timestamp}.pdf`;

      // Download the PDF
      this.doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Add report header with title and metadata
   */
  private addHeader(): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(this.data.metadata.title, this.margin, this.currentY);
    this.currentY += 15;

    // Metadata
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Generated: ${this.data.metadata.timestamp}`, this.margin, this.currentY);
    this.doc.text(`Software Version: ${this.data.metadata.softwareVersion}`, this.pageWidth - this.margin - 60, this.currentY);
    this.currentY += 10;

    // Overall status
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    const statusColor = this.data.metadata.allChecksPass ? '#22c55e' : '#ef4444';
    const statusText = this.data.metadata.allChecksPass ? 'ALL CHECKS PASS' : 'VERIFICATION FAILED';
    this.doc.setTextColor(statusColor);
    this.doc.text(`Status: ${statusText}`, this.margin, this.currentY);
    this.doc.text(`Overall Utilization: ${this.data.metadata.overallUtilization.toFixed(1)}%`, this.pageWidth - this.margin - 80, this.currentY);

    // Reset color
    this.doc.setTextColor('#000000');
    this.currentY += 20;

    // Add horizontal line
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
  }

  /**
   * Add design inputs section
   */
  private addDesignInputsSection(): void {
    this.addSectionTitle('1. Design Inputs');

    // Structural Parameters
    this.addSubsectionTitle('1.1 Structural Parameters');
    this.addParameterTable(this.data.designInputs.structuralParameters);

    // Notch Configuration
    this.addSubsectionTitle('1.2 Notch Configuration');
    this.addParameterTable(this.data.designInputs.notchConfiguration);

    // Fixing Configuration
    this.addSubsectionTitle('1.3 Fixing Configuration');
    this.addParameterTable(this.data.designInputs.fixingConfiguration);

    // Limitation Settings
    this.addSubsectionTitle('1.4 Limitation Settings');
    this.addParameterTable(this.data.designInputs.limitationSettings);

    this.currentY += 10;
  }

  /**
   * Add final design section
   */
  private addFinalDesignSection(): void {
    this.checkPageBreak(60);
    this.addSectionTitle('2. Final Design Parameters');

    // Genetic Algorithm Results
    this.addSubsectionTitle('2.1 Optimized Parameters');
    this.addParameterTable(this.data.finalDesign.genetic);

    // Calculated Values
    this.addSubsectionTitle('2.2 Calculated Design Values');
    this.addParameterTable(this.data.finalDesign.calculated);

    // Performance Metrics
    this.addSubsectionTitle('2.3 Performance Metrics');
    this.addParameterTable(this.data.finalDesign.performance);

    this.currentY += 10;
  }

  /**
   * Add ShapeDiver outputs section
   */
  private addShapeDiverOutputsSection(): void {
    this.checkPageBreak(60);
    this.addSectionTitle('3. ShapeDiver 3D Model Outputs');

    const outputs: { label: string; value: string; unit?: string }[] = [];

    if (this.shapeDiverOutputs?.totalSystemWeight !== undefined) {
      outputs.push({
        label: 'Total System Weight',
        value: this.shapeDiverOutputs.totalSystemWeight.toFixed(2),
        unit: 'kg'
      });
    }

    if (this.shapeDiverOutputs?.totalSystemWeight !== undefined && this.data.finalDesign.performance) {
      // Calculate weight per meter from total weight and bracket centres
      const bracketCentres = parseFloat(this.data.finalDesign.genetic.find(p => p.label === 'Bracket Centres')?.value || '0');
      if (bracketCentres > 0) {
        const weightPerMeter = (this.shapeDiverOutputs.totalSystemWeight / bracketCentres) * 1000;
        outputs.push({
          label: 'Total Weight per Meter',
          value: weightPerMeter.toFixed(2),
          unit: 'kg/m'
        });
      }
    }

    if (this.shapeDiverOutputs?.totalSystemEmbodiedCarbon !== undefined) {
      outputs.push({
        label: 'Embodied Carbon',
        value: this.shapeDiverOutputs.totalSystemEmbodiedCarbon.toFixed(2),
        unit: 'kg CO2e'
      });
    }

    if (this.shapeDiverOutputs?.totalSystemPerimeterLength !== undefined) {
      outputs.push({
        label: 'Perimeter Length',
        value: this.shapeDiverOutputs.totalSystemPerimeterLength.toFixed(2),
        unit: 'mm'
      });
    }

    if (outputs.length > 0) {
      this.addParameterTable(outputs);
    } else {
      this.doc.setFontSize(9);
      this.doc.setFont(undefined, 'italic');
      this.doc.text('No 3D model outputs available', this.margin + 5, this.currentY);
      this.currentY += 10;
    }

    this.currentY += 10;
  }

  /**
   * Add detailed calculations section
   */
  private addCalculationsSection(): void {
    this.checkPageBreak(80);
    this.addSectionTitle('4. Detailed Calculations');

    this.data.calculations.forEach((calc, index) => {
      this.checkPageBreak(100);
      this.addCalculationSubsection(calc, index + 1);
    });
  }

  /**
   * Add individual calculation subsection
   */
  private addCalculationSubsection(calc: FormattedCalculation, number: number): void {
    // Calculation title and description
    this.addSubsectionTitle(`4.${number} ${calc.name}`);
    this.doc.setFontSize(9);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(calc.description, this.margin, this.currentY);
    this.currentY += 10;

    // Status indicator
    const statusColor = calc.passes ? '#22c55e' : '#ef4444';
    const statusText = calc.passes ? 'PASS' : 'FAIL';
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(statusColor);
    this.doc.text(`Result: ${statusText} (${calc.utilization.toFixed(1)}% utilization)`, this.margin, this.currentY);
    this.doc.setTextColor('#000000');
    this.currentY += 15;

    // Inputs
    if (calc.inputs.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Inputs:', this.margin, this.currentY);
      this.currentY += 5;

      this.doc.setFont(undefined, 'normal');
      calc.inputs.forEach(input => {
        this.checkPageBreak(8);
        this.doc.text(`• ${input.parameter}: ${input.value}${input.unit ? ` ${input.unit}` : ''}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
      this.currentY += 5;
    }

    // Formulas and calculations
    if (calc.formulas.length > 0) {
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Calculations:', this.margin, this.currentY);
      this.currentY += 5;

      this.doc.setFont(undefined, 'normal');
      calc.formulas.forEach(formula => {
        this.checkPageBreak(12);
        this.doc.text(formula.step, this.margin + 5, this.currentY);
        this.currentY += 6;
        this.doc.setFont(undefined, 'italic');
        this.doc.text(`Formula: ${formula.formula}`, this.margin + 10, this.currentY);
        this.currentY += 6;
        this.doc.setFont(undefined, 'normal');
        this.doc.text(`Result: ${formula.result}`, this.margin + 10, this.currentY);
        this.currentY += 8;
      });
      this.currentY += 5;
    }

    // Outputs
    if (calc.outputs.length > 0) {
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Final Results:', this.margin, this.currentY);
      this.currentY += 5;

      this.doc.setFont(undefined, 'normal');
      calc.outputs.forEach(output => {
        this.checkPageBreak(8);
        this.doc.text(`• ${output.parameter}: ${output.value}${output.unit ? ` ${output.unit}` : ''}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
      this.currentY += 10;
    }

    // Add separator line
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
  }

  /**
   * Add verification summary section
   */
  private addVerificationSummarySection(): void {
    this.checkPageBreak(100);
    this.addSectionTitle('5. Verification Summary');

    // Create summary table
    const tableData = [
      ['Check Name', 'Result', 'Utilization', 'Critical Value']
    ];

    this.data.verificationSummary.forEach(item => {
      tableData.push([
        item.checkName,
        item.result,
        item.utilization > 0 ? `${item.utilization.toFixed(1)}%` : 'N/A',
        item.criticalValue || 'N/A'
      ]);
    });

    this.addTable(tableData);

    // Overall conclusion
    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    const conclusionColor = this.data.metadata.allChecksPass ? '#22c55e' : '#ef4444';
    this.doc.setTextColor(conclusionColor);

    const conclusionText = this.data.metadata.allChecksPass
      ? 'CONCLUSION: All verification checks pass. The design is acceptable.'
      : 'CONCLUSION: One or more verification checks have failed. The design requires modification.';

    this.doc.text(conclusionText, this.margin, this.currentY);
    this.doc.setTextColor('#000000');
    this.currentY += 15;
  }

  /**
   * Add footer with disclaimers and standards
   */
  private addFooter(): void {
    this.checkPageBreak(40);

    // Add separator
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(8);
    this.doc.setFont(undefined, 'normal');

    const disclaimers = [
      'This calculation report has been generated automatically by the Masonry Support System Optimizer.',
      'All calculations are performed according to relevant European standards and manufacturer specifications.',
      'This report should be reviewed by a qualified structural engineer before use in construction.',
      'The software and its calculations are provided for design assistance purposes only.'
    ];

    disclaimers.forEach(disclaimer => {
      this.checkPageBreak(8);
      this.doc.text(disclaimer, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  // Utility methods

  private addSectionTitle(title: string): void {
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 12;
  }

  private addSubsectionTitle(title: string): void {
    this.checkPageBreak(15);
    this.doc.setFontSize(11);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  private addParameterTable(parameters: { label: string; value: string; unit?: string }[]): void {
    this.doc.setFontSize(9);
    this.doc.setFont(undefined, 'normal');

    parameters.forEach(param => {
      this.checkPageBreak(8);
      const valueText = `${param.value}${param.unit ? ` ${param.unit}` : ''}`;
      this.doc.text(`${param.label}:`, this.margin + 5, this.currentY);
      this.doc.text(valueText, this.margin + 100, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;
  }

  private addTable(data: string[][]): void {
    const rowHeight = 8;
    const colWidths = [80, 25, 30, 40]; // Adjust based on content
    let currentX = this.margin;

    // Header row
    this.doc.setFont(undefined, 'bold');
    this.doc.setFontSize(9);

    data[0].forEach((header, colIndex) => {
      this.checkPageBreak(rowHeight);
      this.doc.text(header, currentX, this.currentY);
      currentX += colWidths[colIndex];
    });

    this.currentY += rowHeight;

    // Draw header underline
    this.doc.line(this.margin, this.currentY - 2, this.margin + colWidths.reduce((a, b) => a + b, 0), this.currentY - 2);
    this.currentY += 2;

    // Data rows
    this.doc.setFont(undefined, 'normal');

    for (let i = 1; i < data.length; i++) {
      currentX = this.margin;
      this.checkPageBreak(rowHeight);

      data[i].forEach((cell, colIndex) => {
        // Color code the result column
        if (colIndex === 1) {
          const color = cell === 'PASS' ? '#22c55e' : cell === 'FAIL' ? '#ef4444' : '#000000';
          this.doc.setTextColor(color);
        }

        this.doc.text(cell, currentX, this.currentY);
        this.doc.setTextColor('#000000'); // Reset color
        currentX += colWidths[colIndex];
      });

      this.currentY += rowHeight;
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }
}

/**
 * Convenience function to generate and download PDF report
 */
export const generatePDFReport = async (
  result: OptimizationResult,
  formData: FormDataType,
  shapeDiverOutputs?: ShapeDiverOutputs
): Promise<void> => {
  const generator = new CalculationPDFGenerator();
  await generator.generateReport(result, formData, shapeDiverOutputs);
};