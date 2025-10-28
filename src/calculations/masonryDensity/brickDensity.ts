/**
 * Brick Density Calculations
 * Maintains full precision in intermediate calculations per project rules
 */

import { BrickDensityInputs, BrickDensityResults } from '@/types/masonryDensity';

export function calculateBrickDensity(inputs: BrickDensityInputs): BrickDensityResults {
  const { weightPerPack, numberOfBricks, mortarDensity, brickDimensions } = inputs;

  // Convert brick dimensions from mm to m for volume calculations
  const lengthM = brickDimensions.length / 1000;
  const widthM = brickDimensions.width / 1000;
  const heightM = brickDimensions.height / 1000;

  // Weight per brick (dry) = weight per pack / No. of bricks
  const weightPerBrickDry = weightPerPack / numberOfBricks;

  // Weight per brick saturated = weight per brick dry * 1.15
  const weightPerBrickSaturated = weightPerBrickDry * 1.15;

  // Weight of mortar per brick (kg) = density of mortar * (0.225*0.01*0.1025 + 0.065*0.01*0.1025)
  // Using actual brick dimensions instead of hardcoded values
  const mortarVolume = (lengthM * 0.01 * heightM) + (widthM * 0.01 * heightM);
  const weightOfMortarPerBrick = mortarDensity * mortarVolume;

  // Combined weight = weight per brick saturated + weight of mortar per brick
  const combinedWeight = weightPerBrickSaturated + weightOfMortarPerBrick;

  // Density of brick + mortar (kN/m3) = (combined weight / (0.225*0.075*0.1025)) * 9.81 / 1000
  const brickVolume = lengthM * widthM * heightM;
  const densityOfBrickAndMortar = (combinedWeight / brickVolume) * 9.81 / 1000;

  // Area load per 102.5 kN/m2 = (density of brick + mortar) * 0.1025
  // Using actual brick height instead of hardcoded value
  const areaLoadPer102_5 = densityOfBrickAndMortar * heightM;

  return {
    weightPerBrickDry,
    weightPerBrickSaturated,
    weightOfMortarPerBrick,
    combinedWeight,
    densityOfBrickAndMortar,
    areaLoadPer102_5,
  };
}
