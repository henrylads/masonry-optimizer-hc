import { runBruteForce } from './src/calculations/bruteForceAlgorithm/index';
import type { DesignInputs } from './src/types/designInputs';

// Test angle extension integration
async function testAngleExtension() {
    console.log('🧪 Testing Angle Extension Integration...\n');

    const testInputs: DesignInputs = {
        support_level: -350, // Deep support level that should trigger extension
        cavity_width: 150,
        slab_thickness: 225,
        characteristic_load: 6.0,
        top_critical_edge: 75,
        bottom_critical_edge: 125,
        notch_height: 0,
        notch_depth: 0,
        fixing_position: 75,
        facade_thickness: 102.5,
        load_position: 1/3,
        front_offset: 12,
        isolation_shim_thickness: 3,
        enable_angle_extension: true,
        max_allowable_bracket_extension: 250 // This should trigger angle extension
    };

    const config = {
        maxGenerations: 100,
        designInputs: testInputs,
        isAngleLengthLimited: false,
        onProgress: (generation: number, maxGenerations: number, bestFitness: number) => {
            if (generation % 20 === 0) {
                console.log(`Progress: ${generation}/${maxGenerations} (Best: ${bestFitness})`);
            }
        }
    };

    try {
        console.log('Starting optimization with angle extension enabled...\n');
        const result = await runBruteForce(config);

        console.log('\n✅ OPTIMIZATION COMPLETE\n');
        console.log('='.repeat(50));

        const design = result.result;
        console.log(`Selected Design:`);
        console.log(`  Bracket Type: ${design.genetic.bracket_type}`);
        console.log(`  Angle Orientation: ${design.genetic.angle_orientation}`);
        console.log(`  Original Vertical Leg: ${design.genetic.vertical_leg}mm`);
        console.log(`  Effective Vertical Leg: ${design.calculated.effective_vertical_leg || 'NOT SET'}mm`);
        console.log(`  Bracket Height: ${design.calculated.bracket_height}mm`);
        console.log(`  Total Weight: ${design.calculated.weights?.totalWeight || 'NOT SET'} kg/m`);

        if (design.calculated.angle_extension_result) {
            console.log('\n🔧 ANGLE EXTENSION DETAILS:');
            const ext = design.calculated.angle_extension_result;
            console.log(`  Extension Applied: ${ext.extension_applied}`);
            console.log(`  Original Bracket Height: ${ext.original_bracket_height}mm`);
            console.log(`  Limited Bracket Height: ${ext.limited_bracket_height}mm`);
            console.log(`  Bracket Reduction: ${ext.bracket_reduction}mm`);
            console.log(`  Original Angle Height: ${ext.original_angle_height}mm`);
            console.log(`  Extended Angle Height: ${ext.extended_angle_height}mm`);
            console.log(`  Angle Extension: ${ext.angle_extension}mm`);
            console.log(`  Max Extension Limit: ${ext.max_extension_limit}mm`);
        } else {
            console.log('\n❌ NO ANGLE EXTENSION RESULT FOUND');
        }

        console.log('\n' + '='.repeat(50));

        return result;
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', (error as Error).stack);
        throw error;
    }
}

// Run the test
testAngleExtension()
    .then(() => {
        console.log('\n🎉 Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
    });