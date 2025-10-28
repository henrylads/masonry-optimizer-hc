/**
 * Line Load Calculations
 * Maintains full precision in intermediate calculations per project rules
 */

import { LineLoadInputs, LineLoadResults } from '@/types/masonryDensity';

export function calculateLineLoad(
  inputs: LineLoadInputs,
  areaLoadPer102_5: number
): LineLoadResults {
  const { elevationArea, pierWidth, reveals, brickDimensions } = inputs;

  // Convert brick height from mm to m
  const heightM = brickDimensions.height / 1000;

  // Convert reveal length from mm to m
  const revealLengthM = reveals.revealLength / 1000;

  // Temp = ((Reveal length/1000) - 0.1025) * reveal height * no of reveals
  // Using actual brick height instead of hardcoded 0.1025
  const revealArea = (revealLengthM - heightM) * reveals.revealHeight * reveals.numberOfReveals;

  // Total area supported = Temp + elevation area
  const totalAreaSupported = revealArea + elevationArea;

  // Loading = area load per 102.5 * total area supported
  const loading = areaLoadPer102_5 * totalAreaSupported;

  // Loading per m (kN/m) = loading / (pier width / 1000)
  const pierWidthM = pierWidth / 1000;
  const loadingPerMeter = loading / pierWidthM;

  return {
    revealArea,
    totalAreaSupported,
    loading,
    loadingPerMeter,
  };
}
