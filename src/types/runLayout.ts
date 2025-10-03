/**
 * Types for multi-piece run layout optimization
 */

/**
 * A single piece of angle in a run
 */
export interface AnglePiece {
  /** Length of this angle piece (mm) */
  length: number;
  /** Number of brackets on this piece */
  bracketCount: number;
  /** Spacing between brackets on this piece (mm) */
  spacing: number;
  /** Distance from left end of piece to first bracket (mm) */
  startOffset: number;
  /** Absolute positions of brackets from left end of piece (mm) */
  positions: number[];
  /** Whether this is a standard length from the table */
  isStandard: boolean;
}

/**
 * A complete segmentation option for a run
 */
export interface RunSegmentation {
  /** Total run length (mm) */
  totalLength: number;
  /** Array of angle pieces making up this run */
  pieces: AnglePiece[];
  /** Total number of brackets across all pieces */
  totalBrackets: number;
  /** Total number of angle pieces */
  pieceCount: number;
  /** Number of 10mm gaps between pieces */
  gapCount: number;
  /** Total gap distance (mm) */
  totalGapDistance: number;
  /** Average bracket spacing across the run (mm) */
  averageSpacing: number;
  /** Number of different piece lengths (lower is better for standardization) */
  uniquePieceLengths: number;
  /** Score for ranking (lower is better) */
  score: number;
}

/**
 * Edge distance constraints for bracket placement
 */
export interface EdgeDistanceConstraints {
  /** Minimum distance from angle end to bracket (mm) - typically 35mm */
  e_min: number;
  /** Maximum distance from brickwork edge to bracket (mm) - typically 0.5 × Bcc */
  e_max: number;
}

/**
 * Request for optimizing a multi-piece run
 */
export interface RunOptimizationRequest {
  /** Total run length to be supported (mm) */
  totalRunLength: number;
  /** Bracket center-to-center spacing from optimization (mm) */
  bracketCentres: number;
  /** Maximum manufacturable angle length (mm) - default 1490 */
  maxAngleLength?: number;
  /** Gap between angle pieces (mm) - default 10 */
  gapBetweenPieces?: number;
  /** Manufacturing increment for angle lengths (mm) - default 5 */
  lengthIncrement?: number;
  /** Minimum edge distance from angle end (mm) - default 35 */
  minEdgeDistance?: number;
  /** Maximum edge distance from brickwork edge (mm) - default 0.5 × Bcc */
  maxEdgeDistance?: number;
}

/**
 * Result from run optimization
 */
export interface RunOptimizationResult {
  /** The selected optimal segmentation */
  optimal: RunSegmentation;
  /** All evaluated segmentation options (sorted by score) */
  allOptions: RunSegmentation[];
  /** Material summary */
  materialSummary: {
    /** Total angle length required (mm) */
    totalAngleLength: number;
    /** Total number of angle pieces */
    totalPieces: number;
    /** Total number of brackets */
    totalBrackets: number;
    /** Breakdown by piece length */
    pieceLengthBreakdown: Array<{
      length: number;
      count: number;
      isStandard: boolean;
    }>;
  };
}

/**
 * Standard length table entry
 */
export interface StandardLengthEntry {
  /** Bracket center-to-center spacing (mm) */
  bracketCentres: number;
  /** Available standard angle lengths for this spacing (mm) */
  lengths: number[];
}
