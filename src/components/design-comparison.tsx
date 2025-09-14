"use client"

import React from 'react';
import { Check, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OptimisationResult } from '@/types/optimization-types';
import type { ParameterVerificationResult } from '@/calculations/parameterVerification';

interface DesignComparisonProps {
  originalResult: OptimisationResult;
  modifiedResult: ParameterVerificationResult;
  modifiedParams: {
    bracket_centres: number;
    bracket_thickness: number;
    angle_thickness: number;
    bolt_diameter: number;
  };
}

interface ComparisonRow {
  label: string;
  originalValue: string | number;
  modifiedValue: string | number;
  unit?: string;
  isChanged: boolean;
  changeType?: 'increase' | 'decrease' | 'neutral';
  category: 'parameter' | 'weight' | 'verification' | 'calculation';
}

export function DesignComparison({ 
  originalResult, 
  modifiedResult, 
  modifiedParams 
}: DesignComparisonProps) {
  
  // Helper function to determine if a value has changed and the change type
  const getChangeInfo = (original: number, modified: number) => {
    const isChanged = Math.abs(original - modified) > 0.001; // Small tolerance for floating point
    let changeType: 'increase' | 'decrease' | 'neutral' = 'neutral';
    
    if (isChanged) {
      changeType = modified > original ? 'increase' : 'decrease';
    }
    
    return { isChanged, changeType };
  };


  // Build comparison data
  const comparisonData: ComparisonRow[] = [
    // Parameters
    {
      label: 'Bracket Centres',
      originalValue: originalResult.genetic.bracket_centres,
      modifiedValue: modifiedParams.bracket_centres,
      unit: 'mm',
      isChanged: originalResult.genetic.bracket_centres !== modifiedParams.bracket_centres,
      changeType: originalResult.genetic.bracket_centres !== modifiedParams.bracket_centres 
        ? (modifiedParams.bracket_centres > originalResult.genetic.bracket_centres ? 'increase' : 'decrease')
        : 'neutral',
      category: 'parameter'
    },
    {
      label: 'Bracket Thickness',
      originalValue: originalResult.genetic.bracket_thickness,
      modifiedValue: modifiedParams.bracket_thickness,
      unit: 'mm',
      isChanged: originalResult.genetic.bracket_thickness !== modifiedParams.bracket_thickness,
      changeType: originalResult.genetic.bracket_thickness !== modifiedParams.bracket_thickness
        ? (modifiedParams.bracket_thickness > originalResult.genetic.bracket_thickness ? 'increase' : 'decrease')
        : 'neutral',
      category: 'parameter'
    },
    {
      label: 'Angle Thickness',
      originalValue: originalResult.genetic.angle_thickness,
      modifiedValue: modifiedParams.angle_thickness,
      unit: 'mm',
      isChanged: originalResult.genetic.angle_thickness !== modifiedParams.angle_thickness,
      changeType: originalResult.genetic.angle_thickness !== modifiedParams.angle_thickness
        ? (modifiedParams.angle_thickness > originalResult.genetic.angle_thickness ? 'increase' : 'decrease')
        : 'neutral',
      category: 'parameter'
    },
    {
      label: 'Bolt Diameter',
      originalValue: `M${originalResult.genetic.bolt_diameter}`,
      modifiedValue: `M${modifiedParams.bolt_diameter}`,
      unit: '',
      isChanged: originalResult.genetic.bolt_diameter !== modifiedParams.bolt_diameter,
      changeType: originalResult.genetic.bolt_diameter !== modifiedParams.bolt_diameter
        ? (modifiedParams.bolt_diameter > originalResult.genetic.bolt_diameter ? 'increase' : 'decrease')
        : 'neutral',
      category: 'parameter'
    },
  ];

  // Add weight comparisons if available
  if (originalResult.calculated.weights && modifiedResult.weights) {
    const originalWeight = originalResult.calculated.weights.totalWeight;
    const modifiedWeight = modifiedResult.weights.totalWeight;
    const weightChange = getChangeInfo(originalWeight, modifiedWeight);

    comparisonData.push(
      {
        label: 'Angle Weight',
        originalValue: originalResult.calculated.weights.angleWeight.toFixed(3),
        modifiedValue: modifiedResult.weights.angleWeight.toFixed(3),
        unit: 'kg/m',
        isChanged: getChangeInfo(originalResult.calculated.weights.angleWeight, modifiedResult.weights.angleWeight).isChanged,
        changeType: getChangeInfo(originalResult.calculated.weights.angleWeight, modifiedResult.weights.angleWeight).changeType,
        category: 'weight'
      },
      {
        label: 'Bracket Weight',
        originalValue: originalResult.calculated.weights.bracketWeight.toFixed(3),
        modifiedValue: modifiedResult.weights.bracketWeight.toFixed(3),
        unit: 'kg/bracket',
        isChanged: getChangeInfo(originalResult.calculated.weights.bracketWeight, modifiedResult.weights.bracketWeight).isChanged,
        changeType: getChangeInfo(originalResult.calculated.weights.bracketWeight, modifiedResult.weights.bracketWeight).changeType,
        category: 'weight'
      },
      {
        label: 'Total System Weight',
        originalValue: originalWeight.toFixed(3),
        modifiedValue: modifiedWeight.toFixed(3),
        unit: 'kg/m',
        isChanged: weightChange.isChanged,
        changeType: weightChange.changeType,
        category: 'weight'
      }
    );
  }

  // Add key calculation comparisons if available
  if (originalResult.calculated.detailed_verification_results && modifiedResult.verificationResults) {
    const originalVed = originalResult.calculated.v_ed || originalResult.calculated.detailed_verification_results.shearResults.V_ed;
    const modifiedVed = modifiedResult.calculatedValues.v_ed;
    
    if (originalVed !== undefined) {
      comparisonData.push(
        {
          label: 'Applied Shear (V_ed)',
          originalValue: originalVed.toFixed(2),
          modifiedValue: modifiedVed.toFixed(2),
          unit: 'kN',
          isChanged: getChangeInfo(originalVed, modifiedVed).isChanged,
          changeType: getChangeInfo(originalVed, modifiedVed).changeType,
          category: 'calculation'
        },
        {
          label: 'Applied Moment (M_ed)',
          originalValue: (originalResult.calculated.m_ed || originalResult.calculated.detailed_verification_results.momentResults.M_ed_angle).toFixed(3),
          modifiedValue: modifiedResult.calculatedValues.m_ed.toFixed(3),
          unit: 'kNm',
          isChanged: getChangeInfo(
            originalResult.calculated.m_ed || originalResult.calculated.detailed_verification_results.momentResults.M_ed_angle,
            modifiedResult.calculatedValues.m_ed
          ).isChanged,
          changeType: getChangeInfo(
            originalResult.calculated.m_ed || originalResult.calculated.detailed_verification_results.momentResults.M_ed_angle,
            modifiedResult.calculatedValues.m_ed
          ).changeType,
          category: 'calculation'
        },
        {
          label: 'Total Deflection',
          originalValue: (originalResult.calculated.total_deflection || originalResult.calculated.detailed_verification_results.deflectionResults.totalDeflection).toFixed(3),
          modifiedValue: modifiedResult.calculatedValues.total_deflection.toFixed(3),
          unit: 'mm',
          isChanged: getChangeInfo(
            originalResult.calculated.total_deflection || originalResult.calculated.detailed_verification_results.deflectionResults.totalDeflection,
            modifiedResult.calculatedValues.total_deflection
          ).isChanged,
          changeType: getChangeInfo(
            originalResult.calculated.total_deflection || originalResult.calculated.detailed_verification_results.deflectionResults.totalDeflection,
            modifiedResult.calculatedValues.total_deflection
          ).changeType,
          category: 'calculation'
        }
      );
    }
  }

  // Add overall verification status - use the same logic as the rest of the results display
  const originalIsValid = originalResult.calculated.detailed_verification_results?.passes ?? 
    (originalResult.calculated ? Object.entries(originalResult.calculated)
      .filter(([key]) => key.endsWith("_check"))
      .every(([, value]) => value === true) : false);

  // Helper function to get failing check names
  const getFailingChecks = (verificationResults: ParameterVerificationResult['verificationResults']): string[] => {
    const failingChecks: string[] = [];
    
    console.log('Debug: verificationResults structure:', verificationResults);
    console.log('Debug: modifiedResult.isValid:', modifiedResult.isValid);
    
    if (verificationResults) {
      // Check each verification category
      if (verificationResults.momentResults && !verificationResults.momentResults.passes) {
        failingChecks.push('Moment');
        console.log('Debug: Moment check failed');
      }
      if (verificationResults.shearResults && !verificationResults.shearResults.passes) {
        failingChecks.push('Shear');
        console.log('Debug: Shear check failed');
      }
      if (verificationResults.deflectionResults && !verificationResults.deflectionResults.passes) {
        failingChecks.push('Deflection');
        console.log('Debug: Deflection check failed');
      }
      if (verificationResults.angleToBracketResults && !verificationResults.angleToBracketResults.passes) {
        failingChecks.push('Connection');
        console.log('Debug: Connection check failed');
      }
      if (verificationResults.fixingResults && !verificationResults.fixingResults.passes) {
        failingChecks.push('Fixing');
        console.log('Debug: Fixing check failed');
      }
      if (verificationResults.bracketDesignResults && !verificationResults.bracketDesignResults.passes) {
        failingChecks.push('Bracket');
        console.log('Debug: Bracket check failed');
      }
      if (verificationResults.combinedResults && !verificationResults.combinedResults.passes) {
        failingChecks.push('Combined');
        console.log('Debug: Combined check failed');
      }
      if (verificationResults.droppingBelowSlabResults && !verificationResults.droppingBelowSlabResults.passes) {
        failingChecks.push('Dropping Below Slab');
        console.log('Debug: Dropping Below Slab check failed');
      }
      if (verificationResults.totalDeflectionResults && !verificationResults.totalDeflectionResults.passes) {
        failingChecks.push('Total Deflection');
        console.log('Debug: Total Deflection check failed');
      }
      if (verificationResults.packerResults && !verificationResults.packerResults.passes) {
        failingChecks.push('Packer');
        console.log('Debug: Packer check failed');
      }
    }
    
    console.log('Debug: failing checks found:', failingChecks);
    return failingChecks;
  };

  comparisonData.push({
    label: 'Overall Design Status',
    originalValue: originalIsValid ? 'VALID' : 'INVALID',
    modifiedValue: modifiedResult.isValid ? 'VALID' : 'INVALID',
    unit: '',
    isChanged: originalIsValid !== modifiedResult.isValid,
    changeType: originalIsValid !== modifiedResult.isValid
      ? (modifiedResult.isValid ? 'increase' : 'decrease')
      : 'neutral',
    category: 'verification'
  });

  // Add failing checks details if the modified design is invalid
  const failingChecks = getFailingChecks(modifiedResult.verificationResults);
  console.log('Debug: About to check condition - isValid:', modifiedResult.isValid, 'failingChecks:', failingChecks);
  
  if (!modifiedResult.isValid) {
    console.log('Debug: Adding failing checks row');
    comparisonData.push({
      label: 'Failing Checks',
      originalValue: originalIsValid ? 'ALL_PASS' : 'SOME_FAIL', // Use special values for custom rendering
      modifiedValue: failingChecks.length > 0 ? failingChecks.join(', ') : 'Unknown',
      unit: '',
      isChanged: true, // Always highlight this as important info
      changeType: 'decrease', // Always show as concerning
      category: 'verification'
    });
  }

  // Group data by category
  const groupedData = {
    parameter: comparisonData.filter(row => row.category === 'parameter'),
    weight: comparisonData.filter(row => row.category === 'weight'),
    calculation: comparisonData.filter(row => row.category === 'calculation'),
    verification: comparisonData.filter(row => row.category === 'verification')
  };

  const renderChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral', category: string) => {
    if (changeType === 'neutral') return <Minus className="h-3 w-3 text-gray-400" />;
    
    // For weights and deflection, increases are generally bad (red), decreases are good (green)
    // For verification, increases (FAIL->PASS) are good, decreases (PASS->FAIL) are bad
    const isGoodChange = category === 'verification' 
      ? changeType === 'increase'
      : changeType === 'decrease';
    
    return changeType === 'increase' 
      ? <TrendingUp className={`h-3 w-3 ${isGoodChange ? 'text-green-600' : 'text-red-600'}`} />
      : <TrendingDown className={`h-3 w-3 ${isGoodChange ? 'text-green-600' : 'text-red-600'}`} />;
  };

  const renderComparisonSection = (title: string, data: ComparisonRow[]) => {
    if (data.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Parameter</th>
                <th className="text-right py-2 font-medium text-gray-600">Original</th>
                <th className="text-center py-2 font-medium text-gray-600">Change</th>
                <th className="text-right py-2 font-medium text-gray-600">Modified</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={`border-b border-gray-100 ${row.isChanged ? 'bg-amber-50' : ''}`}>
                  <td className="py-2 font-medium">
                    <div className="flex items-center gap-2">
                      {row.label}
                      {row.isChanged && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                          Changed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono">
                    {row.category === 'verification' ? (
                      <div className={`flex items-center justify-end gap-1 ${
                        row.originalValue === 'VALID' || row.originalValue === 'ALL_PASS' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(row.originalValue === 'VALID' || row.originalValue === 'ALL_PASS') ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {row.originalValue === 'ALL_PASS' ? 'All Pass' : 
                         row.originalValue === 'SOME_FAIL' ? 'Some Fail' : 
                         row.originalValue}
                      </div>
                    ) : (
                      `${row.originalValue}${row.unit ? ` ${row.unit}` : ''}`
                    )}
                  </td>
                  <td className="py-2 text-center">
                    <div className="flex justify-center">
                      {renderChangeIcon(row.changeType || 'neutral', row.category)}
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono">
                    {row.category === 'verification' ? (
                      <div className={`flex items-center justify-end gap-1 ${
                        row.modifiedValue === 'VALID' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {row.modifiedValue === 'VALID' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {row.label === 'Failing Checks' ? (
                          <span className="text-left max-w-48 break-words">
                            {row.modifiedValue}
                          </span>
                        ) : (
                          row.modifiedValue
                        )}
                      </div>
                    ) : (
                      `${row.modifiedValue}${row.unit ? ` ${row.unit}` : ''}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Original</span>
          </div>
          <span className="text-gray-400">vs</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>Modified</span>
          </div>
          <span className="text-gray-400">Design Comparison</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderComparisonSection("Design Parameters", groupedData.parameter)}
        {renderComparisonSection("Steel Weights", groupedData.weight)}
        {renderComparisonSection("Engineering Values", groupedData.calculation)}
        {renderComparisonSection("Verification Results", groupedData.verification)}
      </CardContent>
    </Card>
  );
} 