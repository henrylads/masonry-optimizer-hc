/**
 * Types for Masonry Density Calculator
 */

export interface BrickDimensions {
  length: number; // mm, default 225
  width: number; // mm, default 75
  height: number; // mm, default 102.5
}

export interface BrickDensityInputs {
  weightPerPack: number; // kg
  numberOfBricks: number;
  mortarDensity: number; // kg/m3, default 2000
  brickDimensions: BrickDimensions;
}

export interface BrickDensityResults {
  weightPerBrickDry: number; // kg
  weightPerBrickSaturated: number; // kg
  weightOfMortarPerBrick: number; // kg
  combinedWeight: number; // kg
  densityOfBrickAndMortar: number; // kN/m3
  areaLoadPer102_5: number; // kN/m2
}

export interface RevealInputs {
  numberOfReveals: number; // default 2
  revealHeight: number; // m
  revealLength: number; // mm, default 215
}

export interface LineLoadInputs {
  elevationArea: number; // m2
  pierWidth: number; // mm
  reveals: RevealInputs;
  brickDimensions: BrickDimensions;
}

export interface LineLoadResults {
  revealArea: number; // m2
  totalAreaSupported: number; // m2
  loading: number; // kN
  loadingPerMeter: number; // kN/m
}

export interface MasonryDensityCalculationResults {
  brickDensity: BrickDensityResults;
  lineLoad: LineLoadResults;
}
