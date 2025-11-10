import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { optimizeRunLayout } from '@/calculations/runLayoutOptimizer';
import { generateBracketJSON, generateAngleJSON, generateRunJSON } from '@/utils/json-generators';
import type { OptimisationResult } from '@/types/optimizationTypes';
import type { FormDataType } from '@/types/form-schema';

interface SaveJSONRequest {
  optimizationResult: OptimisationResult;
  formInputs: FormDataType;
  designName?: string;
  projectName?: string;
}

/**
 * API endpoint for generating and saving ShapeDiver JSON files
 * POST /api/shapediver-json
 *
 * Generates three JSON files:
 * - bracketJSON: Bracket specifications from optimization
 * - angleJSON: Angle assembly with run layout
 * - runJSON: Run context from form inputs
 *
 * Files are saved to /docs/json_tests/ with timestamped filenames
 */
export async function POST(request: Request) {
  try {
    const data: SaveJSONRequest = await request.json();
    const { optimizationResult, formInputs, designName, projectName } = data;

    console.log('ShapeDiver JSON API: Received request');
    console.log('ShapeDiver JSON API: Form inputs:', {
      run_length: formInputs.run_length,
      bracket_centres: optimizationResult.genetic.bracket_centres,
      support_level: formInputs.support_level,
      cavity: formInputs.cavity,
    });

    // Validate required data
    if (!optimizationResult || !formInputs) {
      return NextResponse.json(
        { error: 'Missing required data: optimizationResult and formInputs are required' },
        { status: 400 }
      );
    }

    // Get run length from form inputs (with default)
    const runLength = formInputs.run_length ?? 1000;
    const bracketCentres = optimizationResult.genetic.bracket_centres;

    // Run the layout optimizer
    console.log('ShapeDiver JSON API: Running layout optimizer', { runLength, bracketCentres });
    const runLayoutResult = optimizeRunLayout({
      totalRunLength: runLength,
      bracketCentres: bracketCentres,
    });

    // Generate the three JSON structures
    console.log('ShapeDiver JSON API: Generating JSON structures');
    const bracketJSON = generateBracketJSON(optimizationResult, formInputs);
    const angleJSON = generateAngleJSON(optimizationResult, runLayoutResult);
    const runJSON = generateRunJSON(formInputs, optimizationResult, runLength);

    // Create timestamped filenames
    const timestamp = new Date().toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '')
      .replace(/\..+/, '')
      .substring(0, 13); // YYYYMMDD_HHMM

    const safeProjectName = (projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeDesignName = (designName || 'design').replace(/[^a-zA-Z0-9_-]/g, '_');

    const baseFilename = `${timestamp}_${safeProjectName}_${safeDesignName}`;
    const bracketFilename = `${baseFilename}_bracket.json`;
    const angleFilename = `${baseFilename}_angle.json`;
    const runFilename = `${baseFilename}_run.json`;

    // Determine the output directory
    // In production, we'll use the project root's docs/json_tests directory
    const outputDir = path.join(process.cwd(), 'docs', 'json_tests');

    // Ensure directory exists
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      console.error('ShapeDiver JSON API: Error creating directory:', err);
      return NextResponse.json(
        { error: 'Failed to create output directory' },
        { status: 500 }
      );
    }

    // Write the JSON files
    const bracketPath = path.join(outputDir, bracketFilename);
    const anglePath = path.join(outputDir, angleFilename);
    const runPath = path.join(outputDir, runFilename);

    try {
      await Promise.all([
        fs.writeFile(bracketPath, JSON.stringify(bracketJSON, null, 2), 'utf-8'),
        fs.writeFile(anglePath, JSON.stringify(angleJSON, null, 2), 'utf-8'),
        fs.writeFile(runPath, JSON.stringify(runJSON, null, 2), 'utf-8'),
      ]);

      console.log('ShapeDiver JSON API: Successfully saved files:', {
        bracketPath,
        anglePath,
        runPath,
      });

      return NextResponse.json({
        success: true,
        message: 'ShapeDiver JSON files generated successfully',
        files: {
          bracket: bracketFilename,
          angle: angleFilename,
          run: runFilename,
        },
        paths: {
          bracket: bracketPath,
          angle: anglePath,
          run: runPath,
        },
      });
    } catch (err) {
      console.error('ShapeDiver JSON API: Error writing files:', err);
      return NextResponse.json(
        {
          error: 'Failed to write JSON files',
          details: err instanceof Error ? err.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('ShapeDiver JSON API: Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate ShapeDiver JSON',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
