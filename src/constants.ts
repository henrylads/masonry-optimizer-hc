export const SYSTEM_DEFAULTS = {
    /** Fixed distance from top of bracket to fixing (mm) */
    BRACKET_TOP_TO_FIXING: 40,
    
    /** Default horizontal leg length (mm) */
    HORIZONTAL_LEG: 90,
    
    /** Default base plate width (mm) */
    BASE_PLATE_WIDTH: 56,
    
    /** Default number of plates per channel */
    PLATES_PER_CHANNEL: 2,
    
    /** Default concrete grade (N/mm2) */
    CONCRETE_GRADE: 30,
    
    /** Default load factor */
    LOAD_FACTOR: 1.35,
    
    /** Default packing shimming thickness (mm) */
    PACKING_THICKNESS: 10,
    
    /** Default bolt diameter (mm) */
    BOLT_DIAMETER: 10,
    
    /** Default isolation shims thickness (mm) */
    ISOLATION_SHIMS: 3,
    
    /** Whether to include additional deflection due to span */
    INCLUDE_DEFLECTION: true,
    
    /** Gravity (m/s2) */
    GRAVITY: 9.81
} as const; 