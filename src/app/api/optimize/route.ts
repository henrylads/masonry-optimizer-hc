import { NextResponse } from 'next/server';
import { MasonryInputs } from '@/types/forms';
import { runBruteForce } from '@/calculations/bruteForceAlgorithm';
import { calculateAreaLoad, calculateCharacteristicUDL } from '@/calculations/loadingCalculations';
import { getSectionHeight } from '@/data/steelSections';
import type { SteelSectionType } from '@/types/steelFixingTypes';

// Default brute force algorithm configuration
const DEFAULT_BF_CONFIG = {
  maxGenerations: 100,
};

// Get critical edge distances based on slab thickness or steel section height
function getCriticalEdgeDistances(effectiveHeight: number) {
  // Default to 225mm slab values if exact match not found
  if (effectiveHeight === 200) {
    return { top: 75, bottom: 125 };
  } else if (effectiveHeight === 225) {
    return { top: 75, bottom: 150 };
  } else if (effectiveHeight === 250) {
    return { top: 75, bottom: 175 };
  }
  // Default to 225mm values
  return { top: 75, bottom: 150 };
}

export async function POST(request: Request) {
  console.log('API route: Starting POST request');
  try {
    const data: MasonryInputs = await request.json();
    console.log('API route: Received input data:', data);

    // DEBUGGING: Log steel fixing parameters explicitly
    console.log('🔍🔍🔍 STEEL PARAMETERS RECEIVED:', {
      frame_fixing_type: data.frame_fixing_type,
      steel_section_type: data.steel_section_type,
      steel_section_size: data.steel_section_size,
      use_custom_steel_section: data.use_custom_steel_section,
      custom_steel_height: data.custom_steel_height,
      steel_bolt_size: data.steel_bolt_size
    });
    
    // Calculate characteristic load if not provided
    let characteristicLoad = data.characteristic_load;
    if (!characteristicLoad && data.masonry_density && data.masonry_thickness && data.masonry_height) {
      console.log('API route: Calculating characteristic load from masonry details');
      const areaLoad = calculateAreaLoad(data.masonry_density, data.masonry_height);
      characteristicLoad = calculateCharacteristicUDL(areaLoad, data.masonry_thickness);
      console.log('API route: Calculated characteristic load:', characteristicLoad);
    }

    if (!characteristicLoad) {
      console.log('API route: Error - No characteristic load provided or calculated');
      return NextResponse.json(
        { error: 'Either characteristic load or masonry details must be provided' },
        { status: 400 }
      );
    }

    // Determine if using steel fixing or concrete
    const isSteelFrame = data.frame_fixing_type?.startsWith('steel');

    console.log('🔍 API ROUTE: Frame type check:', {
      frame_fixing_type: data.frame_fixing_type,
      isSteelFrame: isSteelFrame,
      steel_section_type: data.steel_section_type,
      steel_section_size: data.steel_section_size,
      steel_bolt_size: data.steel_bolt_size
    });

    // For steel fixings, calculate effective height from steel section
    let effectiveHeight = data.slab_thickness;
    let steelSection = null;

    if (isSteelFrame) {
      if (data.use_custom_steel_section && data.custom_steel_height) {
        effectiveHeight = data.custom_steel_height;
      } else if (data.steel_section_size && data.steel_section_type) {
        effectiveHeight = getSectionHeight(data.steel_section_type as SteelSectionType, data.steel_section_size);
      }

      // Build steel section object
      steelSection = {
        sectionType: data.steel_section_type as SteelSectionType,
        size: data.use_custom_steel_section ? null : data.steel_section_size,
        customHeight: data.use_custom_steel_section ? data.custom_steel_height : undefined,
        effectiveHeight
      };

      console.log('API route: Steel section configured:', steelSection);
    }

    // Get critical edge distances based on effective height (slab thickness or steel section height)
    const criticalEdges = getCriticalEdgeDistances(effectiveHeight);
    console.log('API route: Critical edges for effective height', effectiveHeight, ':', criticalEdges);

    // Handle fixing position parameter edge cases
    if (data.fixing_position && !data.enable_fixing_optimization) {
      console.log('API route: Warning - Fixing position provided without optimization enabled. Auto-enabling fixing optimization.');
      // Auto-enable fixing optimization if fixing position is specified
      data.enable_fixing_optimization = true;
    }

    // Validate fixing position constraints if fixing optimization is enabled
    if (data.enable_fixing_optimization) {
      const fixingPosition = data.fixing_position ?? 75;
      const slabThickness = data.slab_thickness;
      const bottomCriticalEdge = criticalEdges.bottom;

      // Validate that we can find channel specifications
      if (!criticalEdges || bottomCriticalEdge <= 0) {
        console.log('API route: Error - Unable to determine channel specifications for slab thickness:', slabThickness);
        return NextResponse.json(
          { error: 'Unable to determine appropriate channel specifications for the given slab thickness. Please verify the slab thickness is within supported range (150-500mm).' },
          { status: 400 }
        );
      }

      // Calculate maximum fixing depth early for validation
      const maxFixingDepth = slabThickness - bottomCriticalEdge;

      // Check for impossible configurations (slab too thin for any fixing optimization)
      if (maxFixingDepth < 75) {
        console.log('API route: Error - Slab too thin for fixing optimization:', slabThickness);
        return NextResponse.json(
          { 
            error: 'Slab is too thin for fixing position optimization',
            details: `Slab thickness ${slabThickness}mm requires ${bottomCriticalEdge}mm bottom edge distance, leaving maximum ${maxFixingDepth}mm for fixing position. Minimum fixing position is 75mm.`,
            suggestion: `Use a slab thickness of at least ${75 + bottomCriticalEdge}mm to enable fixing position optimization, or disable fixing optimization for this configuration.`
          },
          { status: 400 }
        );
      }

      // Validate fixing position increment (should be in 5mm increments for optimization)
      if (data.enable_fixing_optimization && fixingPosition % 5 !== 0) {
        const nearestLower = Math.floor(fixingPosition / 5) * 5;
        const nearestUpper = Math.ceil(fixingPosition / 5) * 5;
        console.log('API route: Warning - Fixing position not in 5mm increment:', fixingPosition);
        return NextResponse.json(
          { 
            error: 'Fixing position should be in 5mm increments for optimization',
            details: `Current value: ${fixingPosition}mm. Fixing position optimization works best with 5mm increments.`,
            suggestion: `Use ${nearestLower}mm or ${nearestUpper}mm instead.`
          },
          { status: 400 }
        );
      }
      
      // Check minimum fixing position (75mm from top of slab)
      if (fixingPosition < 75) {
        console.log('API route: Error - Fixing position too shallow:', fixingPosition);
        return NextResponse.json(
          { 
            error: 'Fixing position must be at least 75mm from top of slab',
            details: `Current value: ${fixingPosition}mm. Minimum allowed: 75mm.`,
            suggestion: 'Increase the fixing position to at least 75mm from the top of the slab.'
          },
          { status: 400 }
        );
      }
      
      // Check maximum fixing depth (must maintain bottom critical edge distance from bottom of slab)
      if (fixingPosition > maxFixingDepth) {
        console.log('API route: Error - Fixing position too deep:', fixingPosition, 'Max allowed:', maxFixingDepth);
        return NextResponse.json(
          { 
            error: `Fixing position cannot exceed ${maxFixingDepth}mm for this slab configuration`,
            details: `Current value: ${fixingPosition}mm. Maximum allowed: ${maxFixingDepth}mm (slab thickness ${slabThickness}mm - bottom edge distance ${bottomCriticalEdge}mm).`,
            suggestion: `Reduce the fixing position to ${maxFixingDepth}mm or less, or use a thicker slab.`
          },
          { status: 400 }
        );
      }
      
      // Check minimum rise to bolts constraint (95mm minimum bracket height)
      // For rise to bolts calculation: we need the distance from fixing point to support level
      // Rise to bolts = |support_level| - fixing_position (both measured from slab top)
      const availableSpaceToSlabBottom = slabThickness - fixingPosition;
      const requiredRiseToSupportLevel = Math.abs(data.support_level) - fixingPosition;

      // The actual rise to bolts will be limited by available space minus worst case adjustment
      const maxPossibleRiseToBolts = availableSpaceToSlabBottom - 15; // 15mm worst case adjustment
      const actualRiseToBolts = Math.min(requiredRiseToSupportLevel, maxPossibleRiseToBolts);

      if (actualRiseToBolts < 95) {
        const shortfall = 95 - actualRiseToBolts;
        console.log('API route: Error - Insufficient rise to bolts:', actualRiseToBolts);
        console.log('API route: Debug - availableSpaceToSlabBottom:', availableSpaceToSlabBottom);
        console.log('API route: Debug - requiredRiseToSupportLevel:', requiredRiseToSupportLevel);
        console.log('API route: Debug - maxPossibleRiseToBolts:', maxPossibleRiseToBolts);

        return NextResponse.json(
          {
            error: 'Rise to bolts must be at least 95mm for structural safety',
            details: `Current achievable rise to bolts: ${actualRiseToBolts.toFixed(1)}mm. Minimum required: 95mm. Shortfall: ${shortfall.toFixed(1)}mm. Limited by available space in slab (${availableSpaceToSlabBottom}mm) or support level geometry.`,
            suggestion: `Reduce the fixing position, increase the slab thickness, or adjust the support level to allow sufficient rise to bolts.`
          },
          { status: 400 }
        );
      }
      
      console.log('API route: Fixing position validation passed:', {
        fixing_position: fixingPosition,
        slab_thickness: slabThickness,
        bottom_critical_edge: bottomCriticalEdge,
        max_fixing_depth: maxFixingDepth,
        rise_to_bolts: actualRiseToBolts
      });
    }

    // Validate Dim D constraints for inverted brackets (if custom value is provided)
    if (data.use_custom_dim_d && data.dim_d) {
      const dimD = data.dim_d;

      // Check minimum Dim D (130mm)
      if (dimD < 130) {
        console.log('API route: Error - Dim D too small:', dimD);
        return NextResponse.json(
          {
            error: 'Dim D must be at least 130mm for inverted brackets',
            details: `Current value: ${dimD}mm. Minimum allowed: 130mm.`,
            suggestion: 'Increase Dim D to at least 130mm or use auto-optimization.'
          },
          { status: 400 }
        );
      }

      // Check maximum Dim D (450mm)
      if (dimD > 450) {
        console.log('API route: Error - Dim D too large:', dimD);
        return NextResponse.json(
          {
            error: 'Dim D cannot exceed 450mm for manufacturing constraints',
            details: `Current value: ${dimD}mm. Maximum allowed: 450mm.`,
            suggestion: 'Reduce Dim D to 450mm or less, or use auto-optimization.'
          },
          { status: 400 }
        );
      }

      // Check Dim D increment (should be in 5mm increments)
      if ((dimD - 130) % 5 !== 0) {
        const nearestLower = 130 + Math.floor((dimD - 130) / 5) * 5;
        const nearestUpper = 130 + Math.ceil((dimD - 130) / 5) * 5;
        console.log('API route: Warning - Dim D not in 5mm increment:', dimD);
        return NextResponse.json(
          {
            error: 'Dim D should be in 5mm increments from 130mm for optimization',
            details: `Current value: ${dimD}mm. Dim D optimization works best with 5mm increments starting from 130mm.`,
            suggestion: `Use ${nearestLower}mm or ${nearestUpper}mm instead.`
          },
          { status: 400 }
        );
      }

      // Check minimum bracket height constraint for inverted brackets
      // Bracket height must be at least Dim D + 40mm clearance
      const minBracketHeight = dimD + 40;
      console.log('API route: Dim D validation passed:', {
        dim_d: dimD,
        required_min_bracket_height: minBracketHeight,
        use_custom_dim_d: data.use_custom_dim_d
      });
    }

    console.log('🔍 API ROUTE DEBUG: Received form data:', {
      facade_thickness: data.facade_thickness,
      masonry_thickness: data.masonry_thickness,
      material_type: data.material_type,
      load_position: data.load_position,
      front_offset: data.front_offset,
      isolation_shim_thickness: data.isolation_shim_thickness
    });

    // Prepare brute force algorithm config
    const bruteForceConfig = {
      ...DEFAULT_BF_CONFIG,
      designInputs: {
        support_level: data.support_level,
        cavity_width: data.cavity,
        slab_thickness: isSteelFrame ? effectiveHeight : data.slab_thickness, // Use effective height for steel
        characteristic_load: characteristicLoad,
        top_critical_edge: criticalEdges.top,
        bottom_critical_edge: criticalEdges.bottom,
        notch_height: data.notch_height ?? 0,
        notch_depth: data.notch_depth ?? 0,
        enable_fixing_optimization: data.enable_fixing_optimization ?? false,
        fixing_position: data.fixing_position ?? 75,
        facade_thickness: data.facade_thickness ?? data.masonry_thickness ?? 102.5,
        load_position: data.load_position ?? (1/3),
        front_offset: data.front_offset ?? 12,
        isolation_shim_thickness: data.isolation_shim_thickness ?? 3,
        material_type: data.material_type ?? 'brick',
        // Steel fixing parameters
        frame_fixing_type: data.frame_fixing_type,
        steel_section: steelSection,
        steel_bolt_size: data.steel_bolt_size
      }
    };

    console.log('🔍 API ROUTE DEBUG: Brute force config designInputs:', {
      facade_thickness: bruteForceConfig.designInputs.facade_thickness,
      load_position: bruteForceConfig.designInputs.load_position,
      front_offset: bruteForceConfig.designInputs.front_offset,
      isolation_shim_thickness: bruteForceConfig.designInputs.isolation_shim_thickness,
      material_type: bruteForceConfig.designInputs.material_type
    });
    console.log('API route: Prepared brute force algorithm config:', bruteForceConfig);

    // Run brute force algorithm optimization
    console.log('API route: Starting brute force algorithm optimization');
    const result = await runBruteForce(bruteForceConfig);
    console.log('API route: Brute force algorithm completed. Result:', result);

    // Add recommendation logic for thick slabs
    const slabThickness = data.slab_thickness;
    const fixingOptimizationEnabled = data.enable_fixing_optimization ?? false;
    
    if (slabThickness > 250 && !fixingOptimizationEnabled) {
      console.log('API route: Adding fixing optimization recommendation for thick slab:', slabThickness);
      
      // Add recommendation to the result
      if (!result.result.alerts) {
        result.result.alerts = [];
      }
      
      result.result.alerts.push(
        `💡 Recommendation: Consider enabling fixing position optimization for this ${slabThickness}mm thick slab. This feature can potentially reduce bracket steel weight by allowing smaller brackets. Fixing optimization is particularly beneficial for slabs thicker than 250mm.`
      );
      
      console.log('API route: Added fixing optimization recommendation');
    } else if (slabThickness > 250 && fixingOptimizationEnabled) {
      console.log('API route: Thick slab detected with fixing optimization enabled - no recommendation needed');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API route: Error details:', error);
    
    // Enhanced error handling with more specific messages
    if (error instanceof Error) {
      console.error('API route: Error message:', error.message);
      console.error('API route: Error stack:', error.stack);
      
      // Check for specific fixing-related errors
      if (error.message.includes('fixing') || error.message.includes('position')) {
        return NextResponse.json(
          { 
            error: 'Fixing position optimization failed',
            details: error.message,
            suggestion: 'Try disabling fixing optimization or adjusting the fixing position parameters.'
          },
          { status: 400 }
        );
      }
      
      // Check for validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { 
            error: 'Invalid configuration parameters',
            details: error.message,
            suggestion: 'Please check all input parameters are within valid ranges.'
          },
          { status: 400 }
        );
      }
      
      // Check for calculation errors
      if (error.message.includes('calculation') || error.message.includes('algorithm')) {
        return NextResponse.json(
          { 
            error: 'Optimization calculation failed',
            details: 'The optimization algorithm encountered an error during calculation.',
            suggestion: 'Try adjusting your design parameters or contact support if the problem persists.'
          },
          { status: 500 }
        );
      }
    }
    
    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'Failed to optimize design',
        details: 'An unexpected error occurred during optimization.',
        suggestion: 'Please verify your input parameters and try again. Contact support if the problem persists.'
      },
      { status: 500 }
    );
  }
} 