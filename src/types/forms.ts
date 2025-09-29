export interface MasonryInputs {
  slab_thickness: number;
  cavity: number;
  support_level: number;
  characteristic_load?: number;
  masonry_density?: number;
  masonry_thickness?: number;
  masonry_height?: number | undefined;
  notch_height: number;
  notch_depth: number;
  showDetailedVerifications?: boolean;
  fixing_position?: number;
}

export interface ValidationRules {
  slab_thickness: {
    min: number;
    max: number;
  };
  cavity: {
    min: number;
    max: number;
  };
  support_level: {
    min: number;
    max: number;
  };
  masonry_density: {
    min: number;
    max: number;
  };
  masonry_thickness: {
    min: number;
    max: number;
  };
  masonry_height: {
    min: number;
    max: number;
  };
  notch_height: {
    min: number;
    max: number;
  };
  notch_depth: {
    min: number;
    max: number;
  };
  fixing_position: {
    min: number;
    max: number;
  };
}

export const validationRules: ValidationRules = {
  slab_thickness: {
    min: 150,
    max: 500
  },
  cavity: {
    min: 50,
    max: 400
  },
  support_level: {
    min: -500,
    max: 500
  },
  masonry_density: {
    min: 1500,
    max: 2500
  },
  masonry_thickness: {
    min: 50,
    max: 250
  },
  masonry_height: {
    min: 1,
    max: 10
  },
  notch_height: {
    min: 0,
    max: 200
  },
  notch_depth: {
    min: 0,
    max: 200
  },
  fixing_position: {
    min: 75,
    max: 400
  }
}; 