import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Filter,
  Calendar,
  Workflow,
  FileText,
  Eye
} from "lucide-react";

interface FlowsStudioProps {
  onCreateFlow: () => void;
  onEditFlow: (flowId: string) => void;
}

// Mock data for flows
const mockFlows = [
  {
    id: "flow_1",
    name: "Welcome Onboarding",
    status: "Deployed" as const,
    linkedTemplates: ["Welcome Message", "Getting Started"],
    lastModified: "2024-01-15",
    createdDate: "2024-01-10",
    messagesSent: 1247
  },
  {
    id: "flow_2",
    name: "Product Catalog Browser",
    status: "Deployed" as const,
    linkedTemplates: ["Product List", "Item Details", "Add to Cart"],
    lastModified: "2024-01-14",
    createdDate: "2024-01-08",
    messagesSent: 892
  },
  {
    id: "flow_3",
    name: "Customer Support Flow",
    status: "Draft" as const,
    linkedTemplates: ["Support Menu", "FAQ Response"],
    lastModified: "2024-01-13",
    createdDate: "2024-01-12",
    messagesSent: 0
  },
  {
    id: "flow_4",
    name: "Order Tracking System",
    status: "Deployed" as const,
    linkedTemplates: ["Order Status", "Delivery Updates"],
    lastModified: "2024-01-12",
    createdDate: "2024-01-05",
    messagesSent: 634
  },
  {
    id: "flow_5",
    name: "Feedback Collection",
    status: "Error" as const,
    linkedTemplates: ["Rating Request", "Review Form"],
    lastModified: "2024-01-11",
    createdDate: "2024-01-09",
    messagesSent: 234
  },
  {
    id: "flow_6",
    name: "Appointment Booking",
    status: "Draft" as const,
    linkedTemplates: ["Service Selection", "Time Slot Picker", "Confirmation"],
    lastModified: "2024-01-10",
    createdDate: "2024-01-07",
    messagesSent: 0
  },
  {
    id: "flow_7",
    name: "Newsletter Subscription",
    status: "Deployed" as const,
    linkedTemplates: ["Subscribe Prompt", "Preferences"],
    lastModified: "2024-01-09",
    createdDate: "2024-01-03",
    messagesSent: 456
  },
  {
    id: "flow_8",
    name: "Payment Processing",
    status: "Error" as const,
    linkedTemplates: ["Payment Options", "Receipt"],
    lastModified: "2024-01-08",
    createdDate: "2024-01-06",
    messagesSent: 123
  },
  {
    id: "flow_9",
    name: "Event Registration",
    status: "Draft" as const,
    linkedTemplates: ["Event Details", "Registration Form"],
    lastModified: "2024-01-07",
    createdDate: "2024-01-04",
    messagesSent: 0
  },
  {
    id: "flow_10",
    name: "Loyalty Program",
    status: "Deployed" as const,
    linkedTemplates: ["Points Balance", "Rewards Catalog"],
    lastModified: "2024-01-06",
    createdDate: "2024-01-02",
    messagesSent: 789
  },
  {
    id: "flow_11",
    name: "Survey Campaign",
    status: "Draft" as const,
    linkedTemplates: ["Survey Questions", "Thank You"],
    lastModified: "2024-01-05",
    createdDate: "2024-01-01",
    messagesSent: 0
  },
  {
    id: "flow_12",
    name: "Abandoned Cart Recovery",
    status: "Deployed" as const,
    linkedTemplates: ["Cart Reminder", "Discount Offer"],
    lastModified: "2024-01-04",
    createdDate: "2023-12-28",
    messagesSent: 567
  }
];

type FlowStatus = "All" | "Deployed" | "Draft" | "Error";

export function FlowsStudio({ onCreateFlow, onEditFlow }: FlowsStudioProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FlowStatus>("All");

  // Filter flows based on search query and status
  const filteredFlows = mockFlows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || flow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Deployed":
        return "default";
      case "Draft":
        return "secondary";
      case "Error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Deployed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Error":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "";
    }
  };

  const handleEditFlowClick = (flowId: string) => {
    onEditFlow(flowId);
  };

  const handleDuplicateFlow = (flowId: string) => {
    console.log(`Duplicate flow ${flowId}`);
  };

  const handleDeleteFlow = (flowId: string) => {
    console.log(`Delete flow ${flowId}`);
  };

  const handleViewFlow = (flowId: string) => {
    console.log(`View flow ${flowId}`);
  };

  return (
    <div className="flex-1 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Workflow className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flows Studio</h1>
              <p className="text-gray-600 mt-1">Design and manage your WhatsApp conversation flows</p>
            </div>
          </div>
          <Button onClick={handleCreateFlow} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" onClick={onCreateFlow} />
            Create New Flow
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
                <p className="text-sm font-medium text-gray-600">Total Flows</p>
                <p className="text-2xl font-bold text-gray-900">{mockFlows.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Workflow className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deployed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockFlows.filter(f => f.status === "Deployed").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockFlows.filter(f => f.status === "Draft").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Edit className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockFlows.filter(f => f.status === "Error").length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Search Controls */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search flows by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={(value: FlowStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Deployed">Deployed</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Flows Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Flows ({filteredFlows.length})
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Flow Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Linked Templates</TableHead>
                  <TableHead className="font-semibold">Messages Sent</TableHead>
                  <TableHead className="font-semibold">Last Modified</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No flows found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlows.map((flow) => (
                    <TableRow key={flow.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Workflow className="h-4 w-4 text-gray-600" />
                          </div>
                          <span>{flow.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(flow.status)}
                          className={getStatusBadgeClass(flow.status)}
                        >
                          {flow.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {flow.linkedTemplates.map((template, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {template}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {flow.messagesSent.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(flow.lastModified).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewFlow(flow.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEditFlowClick(flow.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Flow
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateFlow(flow.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFlow(flow.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}