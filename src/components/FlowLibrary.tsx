import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Users, Calendar, MessageSquare, FileText, Zap } from 'lucide-react';
import { getTemplates, createFlowFromTemplate } from '@/services/metaApi';
import { useFlowStore } from '@/store/flowStore';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usageCount: number;
  rating: number;
  isOfficial: boolean;
  previewImage?: string;
  createdAt: string;
}

interface FlowLibraryProps {
  onCreateFlow: () => void;
  onEditFlow: (flowId: string) => void;
}

const categoryIcons = {
  'Lead Generation': Users,
  'Survey': MessageSquare,
  'Appointment': Calendar,
  'Contact': MessageSquare,
  'Support': MessageSquare,
  'Other': FileText
};

export function FlowLibrary({ onCreateFlow, onEditFlow }: FlowLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { setFlowData } = useFlowStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await getTemplates();
      setTemplates(templatesData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(templatesData.map((t: Template) => t.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      const flowName = `${template.name} - Copy`;
      const result = await createFlowFromTemplate(template.id, flowName);
      
      if (result) {
        // Set the flow data in the store and navigate to builder
        setFlowData(result.flowJson || {
          version: "7.1",
          data_api_version: "3.0",
          name: flowName,
          routing_model: {},
          screens: []
        });
        onCreateFlow();
      }
    } catch (error) {
      console.error('Failed to create flow from template:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Flow Library</h1>
          <p className="text-slate-600">
            Browse and use pre-built WhatsApp Flow templates to get started quickly
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="official">Official</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {template.isOfficial && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Official
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{template.usageCount} uses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1"
                          size="sm"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Show template preview
                            console.log('Preview template:', template.id);
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No templates found</h3>
                <p className="text-slate-600">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 6)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          Popular
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{template.usageCount} uses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{template.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="official" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates
                .filter(template => template.isOfficial)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow border-blue-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          Official
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 6)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          New
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}