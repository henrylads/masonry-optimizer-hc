import { 
  standardRunOptions, 
  nonStandardRunOptions, 
  calculateBracketPositioning,
  AngleLayoutRequest
} from '../angleLayout';

describe('Standard Run Calculations', () => {
  test('should correctly calculate standard run options for 500mm centers', () => {
    const options = standardRunOptions(500);
    
    // Should return lengths 1490, 990, 490 for 500mm centers
    expect(options).toHaveLength(3);
    expect(options.map(o => o.angleLength)).toEqual([1490, 990, 490]);
    
    // First option should have 3 brackets
    expect(options[0].bracketCount).toBe(3);
    expect(options[0].positions).toHaveLength(3);
    expect(options[0].spacing).toBe(500);
    
    // Check first bracket position
    expect(options[0].startOffset).toBe(245); // 500/2 - 10/2 = 245
  });
  
  test('should correctly calculate standard run options for 350mm centers', () => {
    const options = standardRunOptions(350);
    
    // Should return lengths 1390, 1040, 690, 340 for 350mm centers
    expect(options).toHaveLength(4);
    expect(options.map(o => o.angleLength)).toEqual([1390, 1040, 690, 340]);
    
    // First option should have 4 brackets
    expect(options[0].bracketCount).toBe(4);
  });
  
  test('should throw error when center-to-center is <= gap', () => {
    expect(() => standardRunOptions(5)).toThrow("c/c spacing must exceed the end gap");
  });
});

describe('Non-Standard Run Calculations', () => {
  test('should correctly calculate bracket positions for a fixed length', () => {
    const result = nonStandardRunOptions(1000, 500);
    
    // Should require 2 brackets for a 1000mm angle with max 500mm spacing
    expect(result.count).toBe(2);
    
    // Spacing should be 500mm (rounded to nearest 50mm increment)
    expect(result.spacing).toBe(500);
    
    // Overhang should be equal on both sides: (1000 - 1*500)/2 = 250
    expect(result.overhang).toBe(250);
    
    // Check positions - properly spaced with edge distance
    expect(result.positions).toEqual([250, 750]);
  });
  
  test('should correctly calculate bracket positions for an awkward length', () => {
    const result = nonStandardRunOptions(1100, 600);
    
    // Should require 2 brackets for a 1100mm angle with max 600mm spacing
    expect(result.count).toBe(2);
    
    // Check spacing and positions
    expect(result.spacing).toBe(550); // middle distance of 550
    expect(result.overhang).toBe(275); // (1100 - 550)/2 = 275
    expect(result.positions).toEqual([275, 825]); // [275, 275+550]
  });
  
  test('should add more brackets when spacing would exceed max', () => {
    const result = nonStandardRunOptions(1200, 500);
    
    // Should require 3 brackets (not 2, as 600mm would exceed max 500mm)
    expect(result.count).toBe(3);
    expect(result.spacing).toBe(500);
  });
  
  test('should throw error for invalid inputs', () => {
    expect(() => nonStandardRunOptions(0, 500)).toThrow("Length must be positive");
    expect(() => nonStandardRunOptions(1000, 40)).toThrow("c/c rule is smaller than slot pitch");
  });
});

describe('Bracket Positioning Integration', () => {
  test('should use standard run for unrestricted length', () => {
    const request: AngleLayoutRequest = {
      isLengthLimited: false,
      centerToCenter: 400
    };
    
    const result = calculateBracketPositioning(request);
    
    expect(result.isStandardRun).toBe(true);
    expect(result.angleLength).toBe(1190); // For 400mm centers: 3*400 - 10 = 1190
    expect(result.bracketCount).toBe(3);
  });
  
  test('should use fixed length calculation when length is limited', () => {
    const request: AngleLayoutRequest = {
      isLengthLimited: true,
      fixedLength: 850,
      centerToCenter: 450
    };
    
    const result = calculateBracketPositioning(request);
    
    expect(result.isStandardRun).toBe(false);
    expect(result.angleLength).toBe(850);
    expect(result.bracketCount).toBe(2);
    expect(result.spacing).toBe(400); // Rounded to nearest 50mm
  });
  
  test('should throw error when fixed length is required but not provided', () => {
    const request: AngleLayoutRequest = {
      isLengthLimited: true,
      centerToCenter: 450
    };
    
    expect(() => calculateBracketPositioning(request)).toThrow("Fixed length is required");
  });
  
  test('should throw error when no valid standard options are found', () => {
    // This would require a very large center-to-center that can't fit in max length
    const request: AngleLayoutRequest = {
      isLengthLimited: false,
      centerToCenter: 2000, // Way too large for standard angle
      maxAngleLength: 1490
    };
    
    expect(() => calculateBracketPositioning(request)).toThrow("No valid standard run options found");
  });
}); 