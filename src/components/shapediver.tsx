import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createSession, createViewport, ISessionApi, viewports, ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Box, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveHorizontal, Eye } from 'lucide-react';

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
    // New JSON-based parameters for the new model
    bracketJSON?: string;
    angleJSON?: string;
    runJSON?: string;

    // Callback function to receive output values
    onOutputsChange?: (outputs: ShapeDiverOutputs) => void;
}

// New model uses JSON inputs instead of individual parameters
// EXACT 1-to-1 mapping between our JSON files and ShapeDiver parameter IDs:
//
// bracketJSON (our variable) → input_bracketJSON (ShapeDiver param) → ID: 070a9b35-2f0b-4f17-8f41-b1974cab7540
// angleJSON (our variable)   → input_angleJSON (ShapeDiver param)   → ID: 50fcae5e-a936-4699-80a2-75ab83690f7a
// runJSON (our variable)     → input_runJSON (ShapeDiver param)     → ID: 6e7d3bda-6352-410e-a760-0c1c41559de4
//
const SHAPEDIVER_PARAMS = {
    BRACKET: {
        id: '070a9b35-2f0b-4f17-8f41-b1974cab7540',
        name: 'input_bracketJSON',
        description: 'Bracket specifications JSON'
    },
    ANGLE: {
        id: '50fcae5e-a936-4699-80a2-75ab83690f7a',
        name: 'input_angleJSON',
        description: 'Angle assembly JSON'
    },
    RUN: {
        id: '6e7d3bda-6352-410e-a760-0c1c41559de4',
        name: 'input_runJSON',
        description: 'Run context JSON (includes support type)'
    }
};


export const ShapeDiverCard: React.FC<ShapeDiverCardProps> = ({
    title = "3D Model Viewer",
    className,
    bracketJSON,
    angleJSON,
    runJSON,
    onOutputsChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sessionRef = useRef<ISessionApi | null>(null);
    const viewportIdRef = useRef<string>(`myViewport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    // Camera refs to store camera IDs
    const perspectiveCameraIdRef = useRef<string | null>(null);
    const topCameraIdRef = useRef<string | null>(null);
    const bottomCameraIdRef = useRef<string | null>(null);
    const frontCameraIdRef = useRef<string | null>(null);
    const backCameraIdRef = useRef<string | null>(null);
    const leftCameraIdRef = useRef<string | null>(null);
    const rightCameraIdRef = useRef<string | null>(null);

    // State to track current camera view
    const [currentCamera, setCurrentCamera] = useState<string>('perspective');

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

    // Camera switching function
    const handleCameraChange = useCallback((cameraView: string) => {
        const viewport = viewports[viewportIdRef.current];
        if (!viewport) {
            console.warn('Viewport not available for camera change');
            return;
        }

        let cameraId: string | null = null;

        switch (cameraView) {
            case 'perspective':
                cameraId = perspectiveCameraIdRef.current;
                break;
            case 'top':
                cameraId = topCameraIdRef.current;
                break;
            case 'bottom':
                cameraId = bottomCameraIdRef.current;
                break;
            case 'front':
                cameraId = frontCameraIdRef.current;
                break;
            case 'back':
                cameraId = backCameraIdRef.current;
                break;
            case 'left':
                cameraId = leftCameraIdRef.current;
                break;
            case 'right':
                cameraId = rightCameraIdRef.current;
                break;
            default:
                console.warn(`Unknown camera view: ${cameraView}`);
                return;
        }

        if (cameraId) {
            try {
                viewport.assignCamera(cameraId);
                viewport.update();
                setCurrentCamera(cameraView);
                console.log(`📷 Switched to ${cameraView} camera`);
            } catch (error) {
                console.error(`Error switching to ${cameraView} camera:`, error);
            }
        } else {
            console.warn(`Camera ID not found for ${cameraView} view`);
        }
    }, []);

    // ResizeObserver to handle viewport resizing
    // We need to observe the container div, not the canvas (ShapeDiver manages canvas size)
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;

                console.log(`📏 Container resized to ${width}x${height}`);

                // Tell ShapeDiver viewport to resize
                // ShapeDiver manages canvas dimensions internally
                const viewport = viewports[viewportIdRef.current];
                if (viewport && width > 0 && height > 0) {
                    try {
                        viewport.resize(width, height);
                        console.log(`✅ Viewport resized to ${width}x${height}`);
                    } catch (error) {
                        console.log(`⚠️ Could not resize viewport:`, error);
                    }
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Initialize viewport and session
    useEffect(() => {
        console.log("🔄 ShapeDiver useEffect triggered - JSON parameters:", {
            hasBracketJSON: !!bracketJSON,
            hasAngleJSON: !!angleJSON,
            hasRunJSON: !!runJSON
        });
        console.log("🔍 Canvas ref available:", !!canvasRef.current);
        let mounted = true;

        const initializeViewer = async () => {
            if (!canvasRef.current) {
                console.log("Canvas ref not found, waiting...");
                return;
            }

            // Check if we have the required JSON parameters
            if (!bracketJSON || !angleJSON || !runJSON) {
                console.log("⚠️ Missing JSON parameters - viewer not initialized");
                return;
            }

            try {
                // Create viewport
                console.log("Creating viewport with ID:", viewportIdRef.current);
                const viewport = await createViewport({
                    id: viewportIdRef.current,
                    canvas: canvasRef.current,
                    automaticResizing: true
                });
                console.log("✅ Viewport created");

                // Get the default perspective camera
                if (viewport.camera) {
                    perspectiveCameraIdRef.current = viewport.camera.id;
                    console.log("📷 Default perspective camera ID:", perspectiveCameraIdRef.current);
                }

                // Note: We'll create orthographic cameras AFTER the session is created
                // because cameras need to be assigned to a viewer, which is set up during session creation
                console.log("📷 Camera presets will be created after session initialization");

                // Only proceed with session creation if we're still mounted
                if (!mounted) return;

                console.log("🚀 Creating new ShapeDiver session with JSON-based model");
                console.log("🔍 Session config:", {
                    id: `session_${viewportIdRef.current}`,
                    embeddingTicket: '2f1fbcfa...(truncated)',
                    modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com'
                });

                // Log JSON parameter sizes for debugging
                console.log("📦 JSON parameter sizes:", {
                    bracketJSON: `${(bracketJSON.length / 1024).toFixed(2)} KB`,
                    angleJSON: `${(angleJSON.length / 1024).toFixed(2)} KB`,
                    runJSON: `${(runJSON.length / 1024).toFixed(2)} KB`
                });

                // Parse and log the supportType being sent
                try {
                    const runData = JSON.parse(runJSON);
                    console.log("🔍 Support Type being sent to ShapeDiver:", runData.runDetails?.substructure?.supportType?.value);
                } catch (e) {
                    console.error("Could not parse runJSON for debugging:", e);
                }

                // Create session with NEW embedding ticket for JSON-based model
                console.log("📡 Attempting to create ShapeDiver session...");
                const session = await createSession({
                    id: `session_${viewportIdRef.current}`,
                    ticket: '7481a9b9dc55d484c27c1163712df69c28c32da74496f095223d401431cef6048c55de2ab7688de7e7a396cbec41d6bd7c2029a96e77d9d6059691b4554f70445527fc1413322f6ebb01293442d95525d65ab7259a50a19f42e748e71afeda1f9e698067c3a920-3bc71ca75edb5e2d6893a9523fa341ca',
                    modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com',
                    viewports: [viewportIdRef.current] // Assign the viewport to the session!
                });
                console.log("✅ ShapeDiver session created successfully");
                console.log(`📺 Session assigned to viewport: ${viewportIdRef.current}`);

                if (mounted) {
                    sessionRef.current = session;
                    console.log("✅ ShapeDiver session stored in ref");

                    // Log viewport state for debugging
                    const viewport = viewports[viewportIdRef.current];
                    if (viewport) {
                        console.log("✅ Viewport assigned to session");

                        // Log canvas dimensions for debugging
                        const canvas = canvasRef.current;
                        if (canvas) {
                            const width = canvas.clientWidth;
                            const height = canvas.clientHeight;
                            console.log(`📐 Canvas dimensions at session creation: ${width}x${height}`);
                            if (width === 0 || height === 0) {
                                console.warn(`⚠️ Canvas has zero dimensions - viewport may not render correctly`);
                            }
                        }
                    }

                    // Log available parameters to find the correct parameter IDs/names
                    console.log("📋 Available ShapeDiver parameters:");
                    const parameters = session.parameters;
                    Object.entries(parameters).forEach(([key, param]: [string, any]) => {
                        console.log(`  - ID: ${param.id}`);
                        console.log(`    Name: ${param.name}`);
                        console.log(`    Display: ${param.displayname || 'N/A'}`);
                        console.log(`    Type: ${param.type}`);
                        console.log("    ---");
                    });

                    // Log available outputs
                    console.log("📋 Available ShapeDiver outputs:");
                    const outputs = session.outputs;
                    Object.entries(outputs).forEach(([key, output]: [string, any]) => {
                        console.log(`  - ID: ${output.id}`);
                        console.log(`    Name: ${output.name}`);
                        console.log(`    Display: ${output.displayname || 'N/A'}`);
                        console.log(`    Type: ${output.type || 'N/A'}`);
                        console.log("    ---");
                    });

                    // Set parameters using EXACT 1-to-1 mapping with ShapeDiver parameter IDs
                    try {
                        console.log("🎯 Setting JSON parameters using exact 1-to-1 mapping...");
                        console.log("   Mapping:");
                        console.log(`   - bracketJSON → ${SHAPEDIVER_PARAMS.BRACKET.name} (ID: ${SHAPEDIVER_PARAMS.BRACKET.id})`);
                        console.log(`   - angleJSON   → ${SHAPEDIVER_PARAMS.ANGLE.name} (ID: ${SHAPEDIVER_PARAMS.ANGLE.id})`);
                        console.log(`   - runJSON     → ${SHAPEDIVER_PARAMS.RUN.name} (ID: ${SHAPEDIVER_PARAMS.RUN.id})`);

                        // 1. bracketJSON → input_bracketJSON
                        const bracketParam = parameters[SHAPEDIVER_PARAMS.BRACKET.id];
                        if (bracketParam) {
                            bracketParam.value = bracketJSON;
                            console.log(`  ✓ Mapped bracketJSON → ${SHAPEDIVER_PARAMS.BRACKET.name}`);
                            console.log(`    Length: ${bracketJSON.length} chars`);
                        } else {
                            console.error(`  ✗ Could not find parameter ${SHAPEDIVER_PARAMS.BRACKET.name} with ID ${SHAPEDIVER_PARAMS.BRACKET.id}`);
                        }

                        // 2. angleJSON → input_angleJSON
                        const angleParam = parameters[SHAPEDIVER_PARAMS.ANGLE.id];
                        if (angleParam) {
                            angleParam.value = angleJSON;
                            console.log(`  ✓ Mapped angleJSON → ${SHAPEDIVER_PARAMS.ANGLE.name}`);
                            console.log(`    Length: ${angleJSON.length} chars`);
                        } else {
                            console.error(`  ✗ Could not find parameter ${SHAPEDIVER_PARAMS.ANGLE.name} with ID ${SHAPEDIVER_PARAMS.ANGLE.id}`);
                        }

                        // 3. runJSON → input_runJSON
                        const runParam = parameters[SHAPEDIVER_PARAMS.RUN.id];
                        if (runParam) {
                            runParam.value = runJSON;
                            console.log(`  ✓ Mapped runJSON → ${SHAPEDIVER_PARAMS.RUN.name}`);
                            console.log(`    Length: ${runJSON.length} chars`);

                            // Extra logging for runJSON to debug support type issue
                            try {
                                const runData = JSON.parse(runJSON);
                                console.log(`    ↳ supportType value: "${runData.runDetails?.substructure?.supportType?.value}"`);
                            } catch (e) {
                                console.error("    ↳ Could not parse runJSON:", e);
                            }
                        } else {
                            console.error(`  ✗ Could not find parameter ${SHAPEDIVER_PARAMS.RUN.name} with ID ${SHAPEDIVER_PARAMS.RUN.id}`);
                        }

                        console.log("✅ All 3 JSON parameters mapped successfully (1-to-1)");

                        // Trigger model computation
                        console.log("🔄 Triggering ShapeDiver model computation with new parameters...");

                        // The model should start computing automatically when parameters change
                        // We can also explicitly trigger customization
                        try {
                            await session.customize();
                            console.log("✅ Model customization triggered");
                        } catch (customizeError) {
                            console.warn("⚠️ Could not explicitly trigger customization:", customizeError);
                            console.log("   (Model will compute automatically when parameters change)");
                        }
                    } catch (paramError) {
                        console.error("❌ Error setting parameters:", paramError);
                    }

                    // Create orthographic camera presets after session is ready
                    console.log("📷 Creating orthographic camera presets...");
                    const viewportForCameras = viewports[viewportIdRef.current];
                    if (viewportForCameras) {
                        try {
                            // Top view
                            const topCamera = await viewportForCameras.createOrthographicCamera();
                            topCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
                            topCameraIdRef.current = topCamera.id;
                            console.log("  ✓ Top camera created:", topCamera.id);

                            // Bottom view
                            const bottomCamera = await viewportForCameras.createOrthographicCamera();
                            bottomCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM;
                            bottomCameraIdRef.current = bottomCamera.id;
                            console.log("  ✓ Bottom camera created:", bottomCamera.id);

                            // Front view
                            const frontCamera = await viewportForCameras.createOrthographicCamera();
                            frontCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT;
                            frontCameraIdRef.current = frontCamera.id;
                            console.log("  ✓ Front camera created:", frontCamera.id);

                            // Back view
                            const backCamera = await viewportForCameras.createOrthographicCamera();
                            backCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.BACK;
                            backCameraIdRef.current = backCamera.id;
                            console.log("  ✓ Back camera created:", backCamera.id);

                            // Left view
                            const leftCamera = await viewportForCameras.createOrthographicCamera();
                            leftCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT;
                            leftCameraIdRef.current = leftCamera.id;
                            console.log("  ✓ Left camera created:", leftCamera.id);

                            // Right view
                            const rightCamera = await viewportForCameras.createOrthographicCamera();
                            rightCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT;
                            rightCameraIdRef.current = rightCamera.id;
                            console.log("  ✓ Right camera created:", rightCamera.id);

                            console.log("✅ All camera presets created successfully");
                        } catch (cameraError) {
                            console.error("❌ Error creating camera presets:", cameraError);
                        }
                    }

                    // Extract outputs after session is ready
                    // Add a small delay to ensure the model has computed
                    setTimeout(async () => {
                        if (mounted && sessionRef.current) {
                            console.log("📊 Extracting outputs from computed model...");
                            await extractOutputs(sessionRef.current);

                            // Log camera state after model has loaded
                            const viewport = viewports[viewportIdRef.current];
                            if (viewport && viewport.camera) {
                                const camera = viewport.camera;
                                console.log("📷 Camera settings AFTER model loaded:");
                                console.log(`  Position: [${camera.position[0]}, ${camera.position[1]}, ${camera.position[2]}]`);
                                console.log(`  Target: [${camera.target[0]}, ${camera.target[1]}, ${camera.target[2]}]`);
                                console.log(`  FOV: ${camera.fov}`);
                                console.log(`  ZoomToFactor: ${camera.zoomToFactor}`);
                            }
                        }
                    }, 3000); // Increased delay to 3 seconds to give model time to compute
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
    }, [bracketJSON, angleJSON, runJSON, extractOutputs]);

    // Camera control buttons component - centered at bottom like a toolbar
    const CameraControls = () => (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border">
            {/* Perspective View */}
            <Button
                variant={currentCamera === 'perspective' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('perspective')}
                className="h-9 w-9 rounded-full"
                title="Perspective View (3D)"
            >
                <Eye className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            {/* Orthographic Views */}
            <Button
                variant={currentCamera === 'top' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('top')}
                className="h-9 w-9 rounded-full"
                title="Top View"
            >
                <ArrowUp className="h-4 w-4" />
            </Button>

            <Button
                variant={currentCamera === 'front' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('front')}
                className="h-9 w-9 rounded-full"
                title="Front View"
            >
                <Box className="h-4 w-4" />
            </Button>

            <Button
                variant={currentCamera === 'right' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('right')}
                className="h-9 w-9 rounded-full"
                title="Right View"
            >
                <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
                variant={currentCamera === 'back' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('back')}
                className="h-9 w-9 rounded-full"
                title="Back View"
            >
                <Box className="h-4 w-4 rotate-180" />
            </Button>

            <Button
                variant={currentCamera === 'left' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('left')}
                className="h-9 w-9 rounded-full"
                title="Left View"
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>

            <Button
                variant={currentCamera === 'bottom' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleCameraChange('bottom')}
                className="h-9 w-9 rounded-full"
                title="Bottom View"
            >
                <ArrowDown className="h-4 w-4" />
            </Button>
        </div>
    );

    // If no title, render canvas directly without Card wrapper to avoid padding issues
    if (!title) {
        return (
            <div ref={containerRef} className="absolute inset-0 overflow-hidden">
                <CameraControls />
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        backgroundColor: 'transparent'
                    }}
                />
            </div>
        );
    }

    // With title, use Card but remove all padding/gaps
    return (
        <Card className={`h-full w-full p-0 gap-0 shadow-none border-0 ${className || ''}`}>
            <CardHeader className="px-6 py-4">
                <CardTitle className="text-xl font-semibold text-cfs-dark">{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] w-full flex items-center justify-center p-0 relative">
                <CameraControls />
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        backgroundColor: 'transparent'
                    }}
                />
            </CardContent>
        </Card>
    );
}; 