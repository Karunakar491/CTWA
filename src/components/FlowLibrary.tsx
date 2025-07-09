import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter,
  Workflow,
  FileText,
  Eye,
  Edit,
  Star,
  Clock,
  Users,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Shield,
  Stethoscope,
  Calendar,
  MessageSquare,
  Heart,
  Building,
  Zap,
  Globe
} from "lucide-react";

interface FlowLibraryProps {
  onCreateFlow: () => void;
  onEditFlow: (flowId: string) => void;
}

// Enhanced mock data with comprehensive flow templates
const mockFlows = [
  {
    id: "ecom_onboarding",
    name: "E-commerce Welcome & Onboarding",
    category: "E-commerce",
    status: "Template" as const,
    description: "Welcome new customers with personalized product recommendations and account setup guidance.",
    image: "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Welcome", "Onboarding", "Personalization"],
    estimatedTime: "3-5 minutes",
    completionRate: 89,
    usageCount: 2847,
    rating: 4.8,
    features: [
      "Personalized welcome message",
      "Product category preferences",
      "Account setup assistance",
      "Special offer presentation"
    ],
    useCase: "Perfect for e-commerce businesses looking to create a smooth onboarding experience for new customers, increasing engagement and conversion rates.",
    lastModified: "2024-01-15"
  },
  {
    id: "loan_application",
    name: "Personal Loan Application",
    category: "Banking",
    status: "Template" as const,
    description: "Streamlined loan application process with document collection and eligibility assessment.",
    image: "https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Loan", "Application", "KYC", "Documents"],
    estimatedTime: "8-12 minutes",
    completionRate: 76,
    usageCount: 1234,
    rating: 4.6,
    features: [
      "Income verification",
      "Document upload (ID, salary slips)",
      "Credit score check integration",
      "Instant eligibility assessment",
      "Loan terms presentation"
    ],
    useCase: "Ideal for banks and financial institutions to digitize their loan application process, reducing paperwork and processing time while maintaining compliance.",
    lastModified: "2024-01-14"
  },
  {
    id: "insurance_quote",
    name: "Auto Insurance Quote Generator",
    category: "Insurance",
    status: "Template" as const,
    description: "Interactive insurance quote calculator with vehicle details and coverage options.",
    image: "https://images.pexels.com/photos/97080/pexels-photo-97080.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Insurance", "Quote", "Auto", "Calculator"],
    estimatedTime: "5-7 minutes",
    completionRate: 82,
    usageCount: 1876,
    rating: 4.7,
    features: [
      "Vehicle information collection",
      "Driving history assessment",
      "Coverage options selection",
      "Real-time quote calculation",
      "Policy comparison"
    ],
    useCase: "Perfect for insurance companies to provide instant quotes and streamline the policy purchase process through WhatsApp.",
    lastModified: "2024-01-13"
  },
  {
    id: "appointment_booking",
    name: "Medical Appointment Booking",
    category: "Healthcare",
    status: "Template" as const,
    description: "Complete appointment scheduling system with doctor selection and time slot booking.",
    image: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Healthcare", "Appointment", "Booking", "Schedule"],
    estimatedTime: "4-6 minutes",
    completionRate: 91,
    usageCount: 3421,
    rating: 4.9,
    features: [
      "Doctor/specialist selection",
      "Available time slots",
      "Patient information form",
      "Insurance verification",
      "Appointment confirmation"
    ],
    useCase: "Essential for healthcare providers to reduce phone calls and streamline appointment booking while improving patient experience.",
    lastModified: "2024-01-12"
  },
  {
    id: "payment_collection",
    name: "Payment Collection & Invoicing",
    category: "Fintech",
    status: "Template" as const,
    description: "Automated payment collection with invoice generation and payment method selection.",
    image: "https://images.pexels.com/photos/50987/money-card-business-credit-card-50987.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Payment", "Invoice", "Collection", "Fintech"],
    estimatedTime: "3-4 minutes",
    completionRate: 94,
    usageCount: 2156,
    rating: 4.8,
    features: [
      "Invoice details presentation",
      "Multiple payment methods",
      "Payment confirmation",
      "Receipt generation",
      "Payment reminders"
    ],
    useCase: "Ideal for businesses and service providers to automate payment collection and reduce outstanding invoices through convenient WhatsApp payments.",
    lastModified: "2024-01-11"
  },
  {
    id: "product_catalog",
    name: "Interactive Product Catalog",
    category: "E-commerce",
    status: "Template" as const,
    description: "Browse products with filtering, detailed views, and add-to-cart functionality.",
    image: "https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Catalog", "Products", "Shopping", "E-commerce"],
    estimatedTime: "Variable",
    completionRate: 87,
    usageCount: 4532,
    rating: 4.7,
    features: [
      "Product categories",
      "Search and filter options",
      "Product image carousel",
      "Detailed product information",
      "Add to cart functionality"
    ],
    useCase: "Perfect for retailers to showcase their products and enable shopping directly through WhatsApp, increasing sales conversion.",
    lastModified: "2024-01-10"
  },
  {
    id: "customer_support",
    name: "AI-Powered Customer Support",
    category: "General",
    status: "Template" as const,
    description: "Intelligent support flow with FAQ, ticket creation, and escalation options.",
    image: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Support", "FAQ", "Tickets", "AI"],
    estimatedTime: "2-8 minutes",
    completionRate: 85,
    usageCount: 5643,
    rating: 4.6,
    features: [
      "FAQ search and browse",
      "Issue categorization",
      "Ticket creation",
      "Priority assessment",
      "Agent escalation"
    ],
    useCase: "Essential for businesses to provide 24/7 customer support and reduce support ticket volume through self-service options.",
    lastModified: "2024-01-09"
  },
  {
    id: "event_registration",
    name: "Event Registration & Ticketing",
    category: "General",
    status: "Template" as const,
    description: "Complete event registration with ticket selection and payment processing.",
    image: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Events", "Registration", "Tickets", "Payment"],
    estimatedTime: "5-8 minutes",
    completionRate: 88,
    usageCount: 1987,
    rating: 4.8,
    features: [
      "Event information display",
      "Ticket type selection",
      "Attendee information form",
      "Payment processing",
      "Digital ticket delivery"
    ],
    useCase: "Perfect for event organizers to streamline registration and ticket sales while providing attendees with a seamless booking experience.",
    lastModified: "2024-01-08"
  },
  {
    id: "feedback_survey",
    name: "Customer Feedback & Survey",
    category: "General",
    status: "Template" as const,
    description: "Comprehensive feedback collection with ratings, reviews, and improvement suggestions.",
    image: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Feedback", "Survey", "Reviews", "Analytics"],
    estimatedTime: "3-5 minutes",
    completionRate: 79,
    usageCount: 3210,
    rating: 4.5,
    features: [
      "Service rating scales",
      "Multiple choice questions",
      "Open-ended feedback",
      "Photo/video uploads",
      "Follow-up actions"
    ],
    useCase: "Valuable for businesses to collect customer insights and improve service quality through structured feedback collection.",
    lastModified: "2024-01-07"
  },
  {
    id: "subscription_management",
    name: "Subscription Management Hub",
    category: "Fintech",
    status: "Template" as const,
    description: "Manage subscriptions with plan changes, billing updates, and cancellation options.",
    image: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Subscription", "Billing", "Management", "SaaS"],
    estimatedTime: "4-7 minutes",
    completionRate: 83,
    usageCount: 1654,
    rating: 4.7,
    features: [
      "Current plan overview",
      "Plan upgrade/downgrade",
      "Billing information update",
      "Payment method changes",
      "Cancellation process"
    ],
    useCase: "Essential for SaaS and subscription businesses to reduce churn and provide easy self-service subscription management.",
    lastModified: "2024-01-06"
  },
  {
    id: "kyc_verification",
    name: "KYC & Identity Verification",
    category: "Banking",
    status: "Template" as const,
    description: "Complete KYC process with document verification and identity validation.",
    image: "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["KYC", "Verification", "Identity", "Compliance"],
    estimatedTime: "8-15 minutes",
    completionRate: 72,
    usageCount: 987,
    rating: 4.4,
    features: [
      "Document photo capture",
      "Identity verification",
      "Address proof upload",
      "Biometric verification",
      "Compliance checks"
    ],
    useCase: "Critical for financial institutions to meet regulatory requirements while providing a user-friendly KYC experience.",
    lastModified: "2024-01-05"
  },
  {
    id: "order_tracking",
    name: "Order Tracking & Updates",
    category: "E-commerce",
    status: "Template" as const,
    description: "Real-time order tracking with delivery updates and customer notifications.",
    image: "https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["Tracking", "Orders", "Delivery", "Updates"],
    estimatedTime: "2-3 minutes",
    completionRate: 96,
    usageCount: 6789,
    rating: 4.9,
    features: [
      "Order status lookup",
      "Real-time tracking",
      "Delivery notifications",
      "Issue reporting",
      "Delivery confirmation"
    ],
    useCase: "Must-have for e-commerce businesses to keep customers informed and reduce support inquiries about order status.",
    lastModified: "2024-01-04"
  }
];

type FlowCategory = "All" | "E-commerce" | "Banking" | "Insurance" | "Fintech" | "Healthcare" | "General";
type FlowStatus = "All" | "Template" | "Draft" | "Active";

const categoryIcons = {
  "E-commerce": ShoppingCart,
  "Banking": Building,
  "Insurance": Shield,
  "Fintech": CreditCard,
  "Healthcare": Stethoscope,
  "General": Globe
};

export function FlowLibrary({ onCreateFlow, onEditFlow }: FlowLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FlowCategory>("All");
  const [statusFilter, setStatusFilter] = useState<FlowStatus>("All");
  const [selectedFlow, setSelectedFlow] = useState<typeof mockFlows[0] | null>(null);
  const [showFlowDetailsModal, setShowFlowDetailsModal] = useState(false);

  // Filter flows based on search query, category, and status
  const filteredFlows = mockFlows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "All" || flow.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || flow.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleFlowCardClick = (flow: typeof mockFlows[0]) => {
    setSelectedFlow(flow);
    setShowFlowDetailsModal(true);
  };

  const handleEditFlow = () => {
    if (selectedFlow) {
      onEditFlow(selectedFlow.id);
      setShowFlowDetailsModal(false);
    }
  };

  const handleUseTemplate = () => {
    if (selectedFlow) {
      onEditFlow(selectedFlow.id);
      setShowFlowDetailsModal(false);
    }
  };

  // Get category statistics
  const categoryStats = mockFlows.reduce((acc, flow) => {
    acc[flow.category] = (acc[flow.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flow Library</h1>
              <p className="text-gray-600 mt-1">Discover and use pre-built flow templates for your business</p>
            </div>
          </div>
          <Button onClick={onCreateFlow} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Flow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{mockFlows.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Workflow className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(categoryStats).length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockFlows.reduce((sum, flow) => sum + flow.usageCount, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(mockFlows.reduce((sum, flow) => sum + flow.rating, 0) / mockFlows.length).toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Search Controls */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={categoryFilter} onValueChange={(value: FlowCategory) => setCategoryFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {Object.entries(categoryStats).map(([category, count]) => (
                      <SelectItem key={category} value={category}>
                        {category} ({count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={statusFilter} onValueChange={(value: FlowStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Template">Templates</SelectItem>
                  <SelectItem value="Draft">Drafts</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Flow Templates Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Flow Templates ({filteredFlows.length})
            </h2>
          </div>
          
          {filteredFlows.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mb-4">
                <Search className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search criteria or browse all categories
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                }}
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFlows.map((flow) => {
                const CategoryIcon = categoryIcons[flow.category as keyof typeof categoryIcons];
                
                return (
                  <Card 
                    key={flow.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden"
                    onClick={() => handleFlowCardClick(flow)}
                  >
                    <div className="relative">
                      <img
                        src={flow.image}
                        alt={flow.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-gray-800 hover:bg-white">
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {flow.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                          {flow.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight group-hover:text-purple-600 transition-colors">
                          {flow.name}
                        </CardTitle>
                        <div className="flex items-center space-x-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium text-gray-600">{flow.rating}</span>
                        </div>
                      </div>
                      <CardDescription className="text-sm line-clamp-2">
                        {flow.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1 mb-4">
                        {flow.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {flow.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{flow.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{flow.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{flow.completionRate}% completion</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{flow.usageCount.toLocaleString()} uses</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(flow.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Flow Details Modal */}
      <Dialog open={showFlowDetailsModal} onOpenChange={setShowFlowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedFlow && (
            <>
              <DialogHeader>
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedFlow.image}
                    alt={selectedFlow.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        {selectedFlow.category}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedFlow.status}
                      </Badge>
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-gray-600">{selectedFlow.rating}</span>
                      </div>
                    </div>
                    <DialogTitle className="text-2xl mb-2">{selectedFlow.name}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedFlow.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Use Case & Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{selectedFlow.useCase}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Key Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedFlow.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Tags & Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedFlow.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated Time</span>
                        <Badge variant="outline">{selectedFlow.estimatedTime}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <Badge variant="outline">{selectedFlow.completionRate}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Usage Count</span>
                        <Badge variant="outline">{selectedFlow.usageCount.toLocaleString()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Updated</span>
                        <Badge variant="outline">{new Date(selectedFlow.lastModified).toLocaleDateString()}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <Button 
                      onClick={handleUseTemplate} 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Use This Template
                    </Button>
                    <Button 
                      onClick={handleEditFlow} 
                      variant="outline" 
                      className="w-full"
                      size="lg"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Flow
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Need Help?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-600">
                      <p>Check out our documentation for implementation guides and best practices.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}