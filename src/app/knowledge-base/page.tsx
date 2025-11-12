'use client'

import { useState } from 'react'
import { AuthHeader } from '@/components/auth-header'
import { AppSidebar } from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileText, Link2, BookOpen, Settings, Trash2, ExternalLink, Upload, Globe } from 'lucide-react'

// Mock data for demonstration
const mockKnowledgeItems = [
  {
    id: '1',
    name: 'Eurocode 5: Design of timber structures',
    type: 'document' as const,
    description: 'Design standards for timber structures including masonry support systems',
    category: 'Standards',
    source: 'eurocode-5.pdf',
    addedDate: '2024-01-15',
    size: '2.4 MB',
    pages: 125
  },
  {
    id: '2',
    name: 'CFS Cast-in Channel Product Catalog',
    type: 'document' as const,
    description: 'Technical specifications and load tables for CFS channel systems',
    category: 'Product Documentation',
    source: 'cfs-catalog-2024.pdf',
    addedDate: '2024-02-20',
    size: '5.1 MB',
    pages: 89
  },
  {
    id: '3',
    name: 'Company Design Guidelines',
    type: 'document' as const,
    description: 'Internal design standards and best practices for masonry support design',
    category: 'Internal Standards',
    source: 'design-guidelines-v3.pdf',
    addedDate: '2024-03-10',
    size: '1.8 MB',
    pages: 45
  },
  {
    id: '4',
    name: 'British Standards Institution',
    type: 'website' as const,
    description: 'Access to BS standards and technical guidance documents',
    category: 'Standards',
    source: 'https://www.bsigroup.com',
    addedDate: '2024-01-20'
  },
  {
    id: '5',
    name: 'Steel Section Properties Database',
    type: 'website' as const,
    description: 'Comprehensive database of structural steel section properties',
    category: 'Reference Data',
    source: 'https://www.steelconstruction.info',
    addedDate: '2024-02-15'
  }
]

export default function KnowledgeBasePage() {
  const [knowledgeItems, setKnowledgeItems] = useState(mockKnowledgeItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newItemType, setNewItemType] = useState<'document' | 'website'>('document')

  // Filter knowledge items
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(knowledgeItems.map(item => item.category)))]

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to remove this knowledge source?')) {
      setKnowledgeItems(items => items.filter(item => item.id !== id))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />

      <div className="flex-1 flex">
        <AppSidebar />

        <div className="flex-1 overflow-auto">
          <div className="py-8 px-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
                <p className="text-muted-foreground">
                  Upload documents, standards, and reference materials to enhance AI assistance with domain-specific knowledge
                </p>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-black/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Knowledge Source
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Knowledge Source</DialogTitle>
                    <DialogDescription>
                      Add documents, standards, or websites to your knowledge base
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Type Selection */}
                    <div className="space-y-2">
                      <Label>Source Type</Label>
                      <Select value={newItemType} onValueChange={(v: 'document' | 'website') => setNewItemType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Document or PDF
                            </div>
                          </SelectItem>
                          <SelectItem value="website">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Website or URL
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newItemType === 'document' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Upload Document</Label>
                          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-1">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOC, DOCX up to 50MB
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                          placeholder="https://example.com"
                          type="url"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="e.g., Eurocode 5 Design Standards" />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe what this knowledge source contains and when it should be used..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select defaultValue="standards">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standards">Standards</SelectItem>
                          <SelectItem value="product">Product Documentation</SelectItem>
                          <SelectItem value="internal">Internal Standards</SelectItem>
                          <SelectItem value="reference">Reference Data</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-black hover:bg-black/90 text-white">
                      Add to Knowledge Base
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Info Banner */}
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">How Knowledge Base Works</h3>
                    <p className="text-sm text-blue-800">
                      Documents and websites you add here will be processed and made available to the AI assistant.
                      When you use the chat feature, the AI can reference this knowledge to provide more accurate,
                      context-aware answers specific to your standards and practices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search knowledge sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c !== 'all').map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Knowledge Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          {item.type === 'document' ? (
                            <FileText className="h-5 w-5 text-primary" />
                          ) : (
                            <Globe className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1 line-clamp-2">
                            {item.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4 line-clamp-2">
                      {item.description}
                    </CardDescription>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {item.type === 'document' ? (
                          <FileText className="h-3 w-3" />
                        ) : (
                          <Link2 className="h-3 w-3" />
                        )}
                        <span className="truncate">{item.source}</span>
                        {item.type === 'website' && (
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        )}
                      </div>

                      {item.type === 'document' && (
                        <div className="flex items-center gap-4">
                          <span>{item.size}</span>
                          <span>{item.pages} pages</span>
                        </div>
                      )}

                      <div>Added {item.addedDate}</div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-3 w-3 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No knowledge sources found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first knowledge source to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
