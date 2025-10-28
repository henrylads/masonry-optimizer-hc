# Task List: CSV Integration - Additional Products

Based on the new CSV file containing additional masonry support fixing products, here are the implementation tasks:

## Relevant Files

- `src/types/channelSpecs.ts` - Channel type definitions and interfaces (✅ Extended with R-HPTIII types and utilization factors)
- `src/types/validationTypes.ts` - Validation types for system constraints
- `src/data/channelSpecs.ts` - Channel specifications data store and initialization (✅ Updated with CSV-based init)
- `src/data/csvData.ts` - Embedded CSV data for channel specifications (✅ Created)
- `src/data/__tests__/channelSpecs.test.ts` - Unit tests for channel specifications (✅ Added tests for new types)
- `src/utils/csv-parser.ts` - New utility for parsing CSV data files (✅ Implemented with Zod validation)
- `src/utils/__tests__/csv-parser.test.ts` - Unit tests for CSV parser (✅ 18 tests covering all functionality)
- `src/utils/__tests__/csv-parser-integration.test.ts` - Integration tests with real CSV data (✅ 8 tests, 84 specs parsed successfully)
- `src/data/__tests__/channelSpecs-csv-replacement.test.ts` - CSV replacement integration tests (✅ 11 tests)
- `src/data/__tests__/channelSpecs-default-integration.test.ts` - Default behavior tests (✅ 5 tests)
- `src/calculations/bruteForceAlgorithm/index.ts` - Main optimization algorithm
- `src/calculations/verificationChecks/` - All verification check modules
- `docs/Copy of Masonry Support Fixing Data- RA- Rev-P01-CM Info.xlsx - Sheet1.csv` - Source CSV data

### Notes

- CSV contains 4 products: CPRO38, CPRO50, R-HPTIII A4 M12 (70mm), R-HPTIII A4 M12 (90mm)
- Each product has 3 slab thicknesses (200, 225, 250mm) with 7 spacing options (200-500mm)
- R-HPTIII products show 200% utilization factors - need to clarify usage rules
- New products have different edge distance patterns from existing system
- Use `npm run test` to run all tests, `npm run lint` and `npm run typecheck` for validation

## Tasks

- [x] 1.0 Update Type System for New Products
  - [x] 1.1 Extend ChannelType union to include R-HPTIII variants
  - [x] 1.2 Update ChannelSpec interface to handle variable edge distances
  - [x] 1.3 Add unit tests for new types

- [x] 2.0 Create CSV Data Parser
  - [x] 2.1 Implement CSV parser utility function
  - [x] 2.2 Add data validation for parsed CSV entries
  - [x] 2.3 Create unit tests for CSV parser
  - [x] 2.4 Handle edge cases (missing data, malformed entries)

- [x] 3.0 Integrate New Product Data
  - [x] 3.1 Update CPRO38 specifications with latest CSV values
  - [x] 3.2 Update CPRO50 specifications with latest CSV values
  - [x] 3.3 Add R-HPTIII A4 M12 (70mm embedment) specifications
  - [x] 3.4 Add R-HPTIII A4 M12 (90mm embedment) specifications
  - [x] 3.5 Update channel specs initialization function

- [ ] 4.0 Handle High Utilization Factor Products
  - [ ] 4.1 Research and document 200% utilization factor meaning
  - [ ] 4.2 Implement special handling for R-HPTIII products if needed
  - [ ] 4.3 Update optimization algorithm to handle special cases
  - [ ] 4.4 Add appropriate warnings/indicators in results

- [ ] 5.0 Update Validation and Algorithm Integration
  - [ ] 5.1 Update validation logic for new edge distance patterns
  - [ ] 5.2 Ensure brute force algorithm processes all new products
  - [ ] 5.3 Update verification checks to handle new product specifications
  - [ ] 5.4 Test optimization with new product range

- [ ] 6.0 Update User Interface Components
  - [ ] 6.1 Verify channel selection dropdown includes new products
  - [ ] 6.2 Update results display for new product naming conventions
  - [ ] 6.3 Test 3D visualization parameter mapping for new channels
  - [ ] 6.4 Update any hardcoded product assumptions in UI

- [ ] 7.0 Testing and Validation
  - [ ] 7.1 Create comprehensive test scenarios for all new products
  - [ ] 7.2 Run optimization tests with each new product type
  - [ ] 7.3 Validate results against expected CSV values
  - [ ] 7.4 Performance testing with expanded product range
  - [ ] 7.5 Run full test suite and fix any breaking changes

- [ ] 8.0 Documentation and Cleanup
  - [ ] 8.1 Update project documentation for new products
  - [ ] 8.2 Document CSV format and parsing approach
  - [ ] 8.3 Clean up any deprecated or unused code
  - [ ] 8.4 Update type documentation and comments

## Priority Order

1. **Phase 1**: Tasks 1.0-2.0 (Type system and CSV parser foundation)
2. **Phase 2**: Task 3.0 (Data integration)  
3. **Phase 3**: Tasks 4.0-5.0 (Algorithm and validation updates)
4. **Phase 4**: Tasks 6.0-8.0 (UI updates, testing, and documentation)

## Critical Questions to Resolve

1. How should 200% utilization factor products be handled in optimization?
2. Are there any specific engineering constraints for R-HPTIII products?
3. Should new products be available by default or require special selection?
4. What are the performance implications of expanded product range?

## Success Criteria

- All 4 products are selectable and functional in the optimization
- CSV data is accurately reflected in system specifications
- Optimization algorithm produces valid results for all new products
- No performance degradation with expanded product range
- All existing functionality remains intact
- Full test coverage for new features