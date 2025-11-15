/**
 * Test to debug why brackets aren't showing in ShapeDiver
 * Created: 2025-11-13
 *
 * Purpose: Verify the JSON structure being sent to ShapeDiver
 */

import * as fs from 'fs';
import * as path from 'path';

describe('ShapeDiver Bracket Rendering Debug', () => {
  it('should verify bracket JSON structure', () => {
    const bracketPath = path.join(process.cwd(), 'docs/json_tests/2025-11-13_11_Test_MSD01_bracket.json');
    const bracketJSON = JSON.parse(fs.readFileSync(bracketPath, 'utf-8'));

    console.log('\n═══════════════════════════════════════════');
    console.log('BRACKET JSON STRUCTURE');
    console.log('═══════════════════════════════════════════');
    console.log('Bracket Count:', bracketJSON.bracketCount.value);
    console.log('Number of bracket definitions:', bracketJSON.brackets.length);
    console.log('\nBracket Template:');
    console.log(JSON.stringify(bracketJSON.brackets[0], null, 2));

    expect(bracketJSON.bracketCount.value).toBe(1);
    expect(bracketJSON.brackets.length).toBe(1);
  });

  it('should verify angle JSON has bracket locations', () => {
    const anglePath = path.join(process.cwd(), 'docs/json_tests/2025-11-13_11_Test_MSD01_angle.json');
    const angleJSON = JSON.parse(fs.readFileSync(anglePath, 'utf-8'));

    console.log('\n═══════════════════════════════════════════');
    console.log('ANGLE JSON STRUCTURE - BRACKET LOCATIONS');
    console.log('═══════════════════════════════════════════');
    console.log('Number of angle types:', angleJSON.anglesCount.value);
    console.log('Total angle instances:', angleJSON.angleInstancesCount.value);

    angleJSON.angles.forEach((angle: any, idx: number) => {
      console.log(`\nAngle Type ${idx}:`);
      console.log('  Name:', angle.angleName.value);
      console.log('  Positions:', angle.anglePositions.value);
      console.log('  Bracket Locations:', angle.angleBracketLocations.value);
      console.log('  Number of brackets per angle:', angle.angleBracketLocations.value.length);
    });

    // Count total brackets that should be rendered
    let totalBrackets = 0;
    angleJSON.angles.forEach((angle: any) => {
      const bracketsPerAngle = angle.angleBracketLocations.value.length;
      const angleInstances = angle.anglePositions.value.length;
      totalBrackets += bracketsPerAngle * angleInstances;
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('EXPECTED BRACKET COUNT IN 3D MODEL');
    console.log('═══════════════════════════════════════════');
    console.log('Total brackets that should render:', totalBrackets);

    expect(totalBrackets).toBeGreaterThan(1);
  });

  it('should explain the bracket architecture', () => {
    console.log('\n═══════════════════════════════════════════');
    console.log('SHAPEDIVER BRACKET ARCHITECTURE');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('1. BRACKET JSON:');
    console.log('   - Defines ONE bracket type/template');
    console.log('   - bracketCount = 1 (this is the template count)');
    console.log('   - Contains all bracket specifications (height, thickness, etc.)');
    console.log('');
    console.log('2. ANGLE JSON:');
    console.log('   - Defines angle pieces AND bracket placements');
    console.log('   - angleBracketLocations[] = where to place brackets on each angle');
    console.log('   - anglePositions[] = where to place each angle instance');
    console.log('');
    console.log('3. EXPECTED BEHAVIOR:');
    console.log('   - ShapeDiver should read the bracket template from bracket JSON');
    console.log('   - ShapeDiver should instance/copy that bracket at each location');
    console.log('     specified in angleBracketLocations for each angle');
    console.log('');
    console.log('4. CURRENT ISSUE:');
    console.log('   - Only angles are rendering, brackets are not appearing');
    console.log('   - Possible causes:');
    console.log('     a) Grasshopper model not reading angleBracketLocations');
    console.log('     b) Grasshopper model not instancing bracket template');
    console.log('     c) Bracket rendering logic disabled or broken');
    console.log('');
  });
});
