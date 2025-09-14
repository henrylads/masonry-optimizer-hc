import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createSession, createViewport, ISessionApi } from '@shapediver/viewer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for parameter values
type ParameterValue = string | number | boolean;

// Define the structure of ShapeDiver output data
export interface ShapeDiverOutputs {
  totalSystemWeight?: number;
  totalSystemEmbodiedCarbon?: number;
  totalSystemPerimeterLength?: number;
}

// Define types for ShapeDiver content objects to avoid 'any'
interface ShapeDiverContentItem {
  value?: unknown;
  data?: unknown;
}

interface ShapeDiverOutput {
  content?: ShapeDiverContentItem[];
}

interface ShapeDiverCardProps {
    title?: string;
    className?: string;
    // Define expected keys from the application side
    initialParameters?: Partial<Record<'sku' | 'bracket_type' | 'bracket_material_grade' | 'angle_material_grade' | 
    'material_grade' | 'bracket_thickness' | 'bracket_length' | 'bracket_height' | 'bolt_diameter' | 'toe_plate_type' | 
    'back_notch_option' | 'back_notch_length' | 'notch_height' | 'support_type' | 'angle_type' | 
    'profile_thickness' | 'profile_length' | 'profile_height' | 'angle_length' | 'bracket_count' | 
    'bracket_spacing' | 'start_offset' | 'spacing_gap' | 'slab_thickness', ParameterValue>>;
    
    // Callback function to receive output values
    onOutputsChange?: (outputs: ShapeDiverOutputs) => void;
}

// Mapping from application keys to the EXACT ShapeDiver parameter IDs
// Using IDs instead of names to avoid duplicate parameter name issues
const paramIdMapping: Record<string, string> = {
    'support_type': '337cfa15-5d22-492d-af0b-4969d6ac4b3a', // Support Type [S/I]
    'bracket_material_grade': 'acede6ae-cc51-4747-9868-bc0c9f68fec1', // Material Grade [304/316] for brackets
    'bracket_thickness': '05110fb6-6b78-42ba-8e1e-76af929c2df9', // Bracket Thickness [mm]
    'bracket_length': '3063d112-349a-4bc6-b428-c5233b0a6cef', // Bracket Length [mm]
    'back_notch_height': '17958f34-ed17-4069-a27e-6463e82f1107', // Back Notch Height [mm] : 10-200
    'fixing_diameter': 'af7c556e-f628-4bed-b71d-e1ac60cd963c', // Fixing Diameter [mm]
    'back_notch_length': 'bfa0e582-3416-4878-a6ad-ebb45aa84961', // Back Notch Length [mm] : 10-200
    'toe_plate_type': '00a1860e-0b09-4fb6-b839-f20a21377263', // Toe Plate Type [S/I]
    'back_notch_option': '21d79fb1-95fd-4ba8-b4d5-7d8cca231fc3', // Back Notch Option
    'bracket_height': '7930e553-2e98-4269-a9bb-2c92e6fbf900', // Bracket Height [mm]
    'slab_thickness': '4cf90fe8-0036-4d3d-a384-d7bdf3e7b62e', // Slab thickness [mm]
    
    // Backward compatibility - legacy material_grade maps to bracket material grade
    'material_grade': 'acede6ae-cc51-4747-9868-bc0c9f68fec1', // Material Grade [304/316] for brackets (legacy)
    
    // Angle-specific parameters
    'angle_type': 'a7810331-b00c-4bb1-b60e-5a399f318236', // Angle Type [S/I]
    'angle_material_grade': '9222bb3a-d90e-43d0-979d-27035d508f77', // Material Grade [304/316] for angles
    'profile_thickness': 'b99c3cba-33b2-4ce3-aa02-eb31a0e9d110', // Profile Thickness [mm]
    'profile_length': 'c230176f-ba6c-4a2c-b553-61681bf9161d', // Profile Length [mm]
    'profile_height': '70cf3ed7-721c-4772-a704-782373b4c034', // Profile Height [mm]
    
    // Bracket positioning parameters
    'angle_length': 'c08f3598-084e-4f59-9778-109c711a347e', // Total Angle Length [mm]
    'bracket_count': '4e4d2dec-32e1-4964-a7b2-4eed2553cd6e', // Bracket Count [#]
    'bracket_spacing': '4258ae1b-6044-4c70-8af8-29b73a301257', // C/C distance [mm]
    'start_offset': '70118ce5-77ad-47c5-8e25-30eac545ad92', // Distance from start [mm]
    'spacing_gap': 'de72784f-60fa-4440-8cf7-835042f9a69f', // Spacing Gap [mm]
};

// For debugging purposes - mapping from parameter IDs to names
const paramIdToNameMapping: Record<string, string> = {
    '337cfa15-5d22-492d-af0b-4969d6ac4b3a': 'Support Type [S/I]',
    'acede6ae-cc51-4747-9868-bc0c9f68fec1': 'Bracket Material Grade [304/316]',
    '05110fb6-6b78-42ba-8e1e-76af929c2df9': 'Bracket Thickness [mm]',
    '3063d112-349a-4bc6-b428-c5233b0a6cef': 'Bracket Length [mm]',
    '17958f34-ed17-4069-a27e-6463e82f1107': 'Back Notch Height [mm] : 10-200',
    'af7c556e-f628-4bed-b71d-e1ac60cd963c': 'Fixing Diameter [mm]',
    'bfa0e582-3416-4878-a6ad-ebb45aa84961': 'Back Notch Length [mm] : 10-200',
    '00a1860e-0b09-4fb6-b839-f20a21377263': 'Toe Plate Type [S/I]',
    '21d79fb1-95fd-4ba8-b4d5-7d8cca231fc3': 'Back Notch Option',
    '7930e553-2e98-4269-a9bb-2c92e6fbf900': 'Bracket Height [mm]',
    '4cf90fe8-0036-4d3d-a384-d7bdf3e7b62e': 'Slab thickness [mm]',
    'a7810331-b00c-4bb1-b60e-5a399f318236': 'Angle Type [S/I]',
    '9222bb3a-d90e-43d0-979d-27035d508f77': 'Angle Material Grade [304/316]',
    'b99c3cba-33b2-4ce3-aa02-eb31a0e9d110': 'Profile Thickness [mm]',
    'c230176f-ba6c-4a2c-b553-61681bf9161d': 'Profile Length [mm]',
    '70cf3ed7-721c-4772-a704-782373b4c034': 'Profile Height [mm]',
    'c08f3598-084e-4f59-9778-109c711a347e': 'Total Angle Length [mm]',
    '4e4d2dec-32e1-4964-a7b2-4eed2553cd6e': 'Bracket Count [#]',
    '4258ae1b-6044-4c70-8af8-29b73a301257': 'C/C distance [mm]',
    '70118ce5-77ad-47c5-8e25-30eac545ad92': 'Distance from start [mm]',
    'de72784f-60fa-4440-8cf7-835042f9a69f': 'Spacing Gap [mm]',
};

// Helper function to format values based on parameter name patterns
const formatParameterValue = (paramId: string, value: ParameterValue): string => {
    if (value === null || value === undefined) {
        console.warn(`Parameter ${paramIdToNameMapping[paramId] || paramId} received null/undefined value.`);
        return ""; 
    }

    const paramName = paramIdToNameMapping[paramId] || '';

    // Specific formatting for Bracket Thickness
    if (paramId === '05110fb6-6b78-42ba-8e1e-76af929c2df9') { // Bracket Thickness [mm]
        if (value === 3) return "0";
        if (value === 4) return "1";
        console.warn(`Unsupported bracket thickness value: ${value}. Defaulting to index 0.`);
        return "0"; 
    }

    // Specific formatting for Profile Thickness
    if (paramId === 'b99c3cba-33b2-4ce3-aa02-eb31a0e9d110') { // Profile Thickness [mm]
        if (value === 3) return "0";
        if (value === 4) return "1";
        if (value === 5) return "2";
        if (value === 6) return "3";
        if (value === 8) return "4";
        console.warn(`Unsupported profile thickness value: ${value}. Defaulting to index 1 (4mm).`);
        return "1"; 
    }

    // Specific formatting for Fixing Diameter
    if (paramId === 'af7c556e-f628-4bed-b71d-e1ac60cd963c') { // Fixing Diameter [mm]
        // Parameter expects index as string: "0" (M8), "1" (M10), "2" (M12), "3" (M16)
        // Handle numeric input or string input like "M10"
        let diameterNumber = NaN;
        if (typeof value === 'number') {
            diameterNumber = value;
        } else if (typeof value === 'string' && value.toUpperCase().startsWith('M')) {
             diameterNumber = parseInt(value.substring(1), 10);
        }

        if (!isNaN(diameterNumber)) {
            if (diameterNumber === 8) return "0";
            if (diameterNumber === 10) return "1";
            if (diameterNumber === 12) return "2";
            if (diameterNumber === 16) return "3";
        }
        
        // Fallback/Default if value doesn't match known diameters
        console.warn(`Unsupported fixing diameter value: ${value}. Defaulting to index 1 (M10).`);
        return "1"; // Default to M10
    }

    // Handle "Distance from start [mm]" parameter - convert to integer
    if (paramId === '70118ce5-77ad-47c5-8e25-30eac545ad92') { // Distance from start [mm]
        return Math.round(Number(value)).toString();
    }

    // Handle other bracket positioning parameters that need to be integers
    if (paramId === 'c08f3598-084e-4f59-9778-109c711a347e' || // Total Angle Length [mm]
        paramId === '4258ae1b-6044-4c70-8af8-29b73a301257' || // C/C distance [mm]
        paramId === 'de72784f-60fa-4440-8cf7-835042f9a69f') { // Spacing Gap [mm]
        return Math.round(Number(value)).toString();
    }

    // Handle bracket count explicitly as an integer
    if (paramId === '4e4d2dec-32e1-4964-a7b2-4eed2553cd6e') { // Bracket Count [#]
        return Math.round(Number(value)).toString();
    }

    // Handle slab thickness as an integer
    if (paramId === '4cf90fe8-0036-4d3d-a384-d7bdf3e7b62e') { // Slab thickness [mm]
        return Math.round(Number(value)).toString();
    }

    // Handle profile dimensions as integers
    if (paramId === 'c230176f-ba6c-4a2c-b553-61681bf9161d' || // Profile Length [mm]
        paramId === '70cf3ed7-721c-4772-a704-782373b4c034') { // Profile Height [mm]
        return Math.round(Number(value)).toString();
    }

    // Handle boolean for "Back Notch Option"
    if (paramId === '21d79fb1-95fd-4ba8-b4d5-7d8cca231fc3') { // Back Notch Option
        return String(value).toLowerCase() === 'true' ? 'true' : 'false';
    }

    // Support Type [S/I]: "0" (Standard AMS), "1" (Inverted AMS)
    if (paramId === '337cfa15-5d22-492d-af0b-4969d6ac4b3a') { // Support Type [S/I]
        // Assuming app sends 'Standard'/'A' or 'Inverted'/'B'
        const upperValue = String(value).toUpperCase();
        if (upperValue === 'INVERTED' || upperValue === 'B') {
             return "1"; // Inverted AMS
        }
        // Default to Standard AMS for 'Standard', 'A', or anything else
        return "0"; 
    }

    // Angle Type [S/I]: "0" (Standard), "1" (Inverted)
    if (paramId === 'a7810331-b00c-4bb1-b60e-5a399f318236') { // Angle Type [S/I]
        const upperValue = String(value).toUpperCase();
        if (upperValue === 'INVERTED' || upperValue === 'B') {
             return "1"; // Inverted
        }
        // Default to Standard for 'Standard', 'A', or anything else
        return "0"; 
    }

    // Bracket Material Grade [304/316]: "0" (304), "1" (316)
    if (paramId === 'acede6ae-cc51-4747-9868-bc0c9f68fec1') { // Bracket Material Grade [304/316]
         // Assuming app sends '304' or '316' as string or number
        if (String(value) === '316') {
            return "1"; // 316
        }
        // Default to 304 for '304' or anything else
        return "0"; 
    }

    // Angle Material Grade [304/316]: "0" (304), "1" (316)
    if (paramId === '9222bb3a-d90e-43d0-979d-27035d508f77') { // Angle Material Grade [304/316]
         // Assuming app sends '304' or '316' as string or number
        if (String(value) === '316') {
            return "1"; // 316
        }
        // Default to 304 for '304' or anything else
        return "0"; 
    }

    // Toe Plate Type [S/I]: "0" (Standard Toe Plate), "1" (Inverted Toe Plate)
    if (paramId === '00a1860e-0b09-4fb6-b839-f20a21377263') { // Toe Plate Type [S/I]
         // Assuming app sends 'Standard' or 'Inverted' (case-insensitive check)
        if (String(value).toUpperCase() === 'INVERTED') {
            return "1"; // Inverted Toe Plate
        }
         // Default to Standard for 'Standard' or anything else
        return "0"; 
    }

    // For other parameters expecting simple numeric strings (like length, height)
    if (paramName.includes('[mm]') || paramName.includes('[#]')) {
        // This now only applies to params *not* handled above (thickness, diameter)
        return String(value);
    }
    
    // Default: convert to string
    return String(value);
};


export const ShapeDiverCard: React.FC<ShapeDiverCardProps> = ({ 
    title = "3D Model Viewer", 
    className, 
    initialParameters,
    onOutputsChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionRef = useRef<ISessionApi | null>(null);
    const viewportIdRef = useRef<string>(`myViewport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // State to store output values - removed unused 'outputs' variable
    const [, setOutputs] = useState<ShapeDiverOutputs>({});

    // Function to extract outputs from ShapeDiver session - now properly typed and memoized
    const extractOutputs = useCallback(async (session: ISessionApi) => {
        try {
            console.log("Extracting outputs from ShapeDiver session...");
            
            // Extract the specific outputs we need
            const newOutputs: ShapeDiverOutputs = {};
            
            // Try to get outputs by their expected names using the correct API
            try {
                const weightOutputs = session.getOutputByName('totalSystemWeight') as ShapeDiverOutput[];
                if (weightOutputs && weightOutputs.length > 0 && weightOutputs[0].content && weightOutputs[0].content.length > 0) {
                    const contentValue = (weightOutputs[0].content[0] as ShapeDiverContentItem)?.value || (weightOutputs[0].content[0] as ShapeDiverContentItem)?.data;
                    if (contentValue !== undefined) {
                        newOutputs.totalSystemWeight = parseFloat(String(contentValue));
                        console.log("Total System Weight:", newOutputs.totalSystemWeight);
                    }
                }
            } catch (e) {
                console.log("Could not get totalSystemWeight output:", e);
            }
            
            try {
                const carbonOutputs = session.getOutputByName('totalSystemEmbodiedCarbon') as ShapeDiverOutput[];
                if (carbonOutputs && carbonOutputs.length > 0 && carbonOutputs[0].content && carbonOutputs[0].content.length > 0) {
                    const contentValue = (carbonOutputs[0].content[0] as ShapeDiverContentItem)?.value || (carbonOutputs[0].content[0] as ShapeDiverContentItem)?.data;
                    if (contentValue !== undefined) {
                        newOutputs.totalSystemEmbodiedCarbon = parseFloat(String(contentValue));
                        console.log("Total System Embodied Carbon:", newOutputs.totalSystemEmbodiedCarbon);
                    }
                }
            } catch (e) {
                console.log("Could not get totalSystemEmbodiedCarbon output:", e);
            }
            
            try {
                const perimeterOutputs = session.getOutputByName('totalSystemPerimeterLength') as ShapeDiverOutput[];
                if (perimeterOutputs && perimeterOutputs.length > 0 && perimeterOutputs[0].content && perimeterOutputs[0].content.length > 0) {
                    const contentValue = (perimeterOutputs[0].content[0] as ShapeDiverContentItem)?.value || (perimeterOutputs[0].content[0] as ShapeDiverContentItem)?.data;
                    if (contentValue !== undefined) {
                        newOutputs.totalSystemPerimeterLength = parseFloat(String(contentValue));
                        console.log("Total System Perimeter Length:", newOutputs.totalSystemPerimeterLength);
                    }
                }
            } catch (e) {
                console.log("Could not get totalSystemPerimeterLength output:", e);
            }
            
            console.log("Extracted outputs:", newOutputs);
            setOutputs(newOutputs);
            
            // Call the callback if provided
            if (onOutputsChange) {
                onOutputsChange(newOutputs);
            }
        } catch (error) {
            console.error('Error extracting outputs from ShapeDiver:', error);
        }
    }, [onOutputsChange]);

    // Initialize viewport and session
    useEffect(() => {
        console.log("🔄 ShapeDiver useEffect triggered - initialParameters changed:", JSON.stringify(initialParameters, null, 2));
        console.log("🔍 Canvas ref available:", !!canvasRef.current);
        let mounted = true;

        const initializeViewer = async () => {
            if (!canvasRef.current) {
                console.log("Canvas ref not found, waiting...");
                return;
            }

            try {
                // Create viewport
                console.log("Creating viewport with ID:", viewportIdRef.current);
                await createViewport({
                    id: viewportIdRef.current,
                    canvas: canvasRef.current
                });

                // Only proceed with session creation if we're still mounted
                if (!mounted) return;

                // Build parameters
                const paramsForShapeDiver: Record<string, string> = {};
                if (initialParameters) {
                    console.log("Processing initialParameters:", initialParameters);
                    for (const [appKey, value] of Object.entries(initialParameters)) {
                        if (value === undefined || value === null) continue;

                        const paramId = paramIdMapping[appKey];
                        if (paramId) {
                            const formattedValue = formatParameterValue(paramId, value);
                            if (formattedValue !== "") {
                                paramsForShapeDiver[paramId] = formattedValue;
                                const paramName = paramIdToNameMapping[paramId] || paramId;
                                console.log(`Mapping ${appKey} to ${paramName} (ID: ${paramId}): ${formattedValue}`);
                                
                                // Special handling for legacy material_grade - also set angle material grade
                                if (appKey === 'material_grade') {
                                    const angleMaterialGradeId = '9222bb3a-d90e-43d0-979d-27035d508f77';
                                    paramsForShapeDiver[angleMaterialGradeId] = formattedValue;
                                    console.log(`Legacy material_grade: Also setting Angle Material Grade (ID: ${angleMaterialGradeId}): ${formattedValue}`);
                                }
                            }
                        }
                    }
                }

                // Create new session
                console.log("🚀 Creating new ShapeDiver session");
                const session = await createSession({
                    id: `session_${viewportIdRef.current}`,
                    ticket: '5810bf48cc038d214549c2bcb1cc7b67f3f5ca52dd9b462e489431145d0e4d7242d1ce58a1a741db19fc091450cb31cad3851a7cfdf94cd070e100dfc45c60771f22343547a5c57b3d0250899dc96bbfd0d4ce7bd79f6d19054973d9c7b44d1a011b22241fa661-b6b923d8f2b0dbd1d1bb4c4c372b6508',
                    modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com',
                    initialParameterValues: paramsForShapeDiver
                });

                if (mounted) {
                    sessionRef.current = session;
                    console.log("✅ ShapeDiver session created successfully");
                    
                    // Extract outputs after session is ready
                    // Add a small delay to ensure the model has computed
                    setTimeout(async () => {
                        if (mounted && sessionRef.current) {
                            await extractOutputs(sessionRef.current);
                        }
                    }, 1000);
                } else {
                    // If we're no longer mounted, clean up the session
                    await session.close();
                }

            } catch (error) {
                console.error('Error initializing ShapeDiver:', error);
            }
        };

        // Start initialization
        initializeViewer();

        // Cleanup function
        return () => {
            mounted = false;
            const sessionToClose = sessionRef.current;
            if (sessionToClose) {
                console.log("🔴 Closing ShapeDiver session");
                sessionToClose.close().catch(err => 
                    console.error("Error closing session:", err)
                );
                sessionRef.current = null;
            }
        };
    }, [initialParameters]); // Removed extractOutputs to prevent frequent session recreation

    return (
        <Card className={`h-full ${className}`}>
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-cfs-dark">{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] flex items-center justify-center">
                <canvas 
                    ref={canvasRef}
                    style={{ 
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent' 
                    }}
                />
            </CardContent>
        </Card>
    );
}; 