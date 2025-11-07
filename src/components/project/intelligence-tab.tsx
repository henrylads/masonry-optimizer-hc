'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Brain, BookOpen, TrendingUp, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function IntelligenceTab() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Project Intelligence</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Coming Soon
          </Badge>
        </div>
        <p className="text-muted-foreground">
          AI-powered research and insights about this construction project
        </p>
      </div>

      {/* Disabled search interface */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Ask questions about this project..."
            disabled
            className="pl-10 h-12 text-base cursor-not-allowed opacity-60"
            title="Perplexity integration coming soon"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Search functionality will be available once Perplexity integration is complete
        </p>
      </div>

      {/* Feature preview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Upcoming Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Research building codes and regulations</p>
              <p className="text-sm text-muted-foreground">
                Get instant access to relevant building standards and compliance requirements
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Find similar projects and case studies</p>
              <p className="text-sm text-muted-foreground">
                Discover comparable construction projects and learn from their approaches
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Get real-time construction industry insights</p>
              <p className="text-sm text-muted-foreground">
                Stay updated with latest trends, materials, and construction methods
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Answer technical questions about materials and methods</p>
              <p className="text-sm text-muted-foreground">
                Get expert answers to specific technical queries about your project
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
