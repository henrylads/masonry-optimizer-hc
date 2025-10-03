"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RunLayoutDisplay } from '@/components/run-layout-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';

function RunLayoutContent() {
  const searchParams = useSearchParams();
  const bccFromUrl = searchParams.get('bcc');
  const [bracketCentres, setBracketCentres] = useState<number>(bccFromUrl ? Number(bccFromUrl) : 500);

  // Update bracket centres if URL parameter changes
  useEffect(() => {
    if (bccFromUrl) {
      setBracketCentres(Number(bccFromUrl));
    }
  }, [bccFromUrl]);

  return (
    <main className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Close Window
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Run Layout Optimizer</h1>
          <p className="text-muted-foreground mt-2">
            Calculate optimal angle piece segmentation for long masonry support runs (0-250m+)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bracket Spacing Configuration</CardTitle>
            <CardDescription>
              Set the bracket center-to-center spacing from your optimization results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bracketCentres">Bracket Centers (Bcc) - mm</Label>
                <Input
                  id="bracketCentres"
                  type="number"
                  value={bracketCentres}
                  onChange={(e) => setBracketCentres(Number(e.target.value))}
                  min={200}
                  max={500}
                  step={50}
                />
                <p className="text-xs text-muted-foreground">
                  Common values: 200, 250, 300, 350, 400, 450, 500mm
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <RunLayoutDisplay bracketCentres={bracketCentres} />

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>1. Standard Lengths:</strong> The optimizer uses pre-calculated standard angle lengths
              based on your bracket spacing (e.g., 500mm Bcc → [1490mm, 990mm]).
            </p>
            <p>
              <strong>2. Segmentation:</strong> Long runs are split into multiple pieces with 10mm gaps between them
              (5mm each side for masonry detailing).
            </p>
            <p>
              <strong>3. Optimization:</strong> The algorithm minimizes total bracket count while maintaining:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>35mm minimum edge distance from angle ends</li>
              <li>Maximum 0.5 × Bcc distance from brickwork edge</li>
              <li>Symmetric bracket placement for non-standard pieces</li>
              <li>At least 2 brackets per piece &gt;150mm</li>
            </ul>
            <p>
              <strong>4. Material Minimization:</strong> Standard lengths are preferred to minimize component variety
              and simplify manufacturing.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function RunLayoutPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">Loading...</div>
      </main>
    }>
      <RunLayoutContent />
    </Suspense>
  );
}
