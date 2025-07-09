import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Workflow, 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  BarChart3,
  ArrowUpRight,
  Calendar
} from "lucide-react";

// Mock data
const kpiData = [
  {
    title: "Active Campaigns",
    value: "24",
    change: "+12%",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Total Flows",
    value: "156",
    change: "+8%",
    icon: Workflow,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    title: "Active Users",
    value: "2,847",
    change: "+23%",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    title: "Success Rate",
    value: "94.2%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

const recentFlows = [
  {
    id: 1,
    name: "Welcome Onboarding",
    status: "Active",
    lastModified: "2 hours ago",
    messages: 1247,
    completion: 87
  },
  {
    id: 2,
    name: "Product Catalog",
    status: "Active",
    lastModified: "5 hours ago",
    messages: 892,
    completion: 92
  },
  {
    id: 3,
    name: "Customer Support",
    status: "Draft",
    lastModified: "1 day ago",
    messages: 0,
    completion: 45
  },
  {
    id: 4,
    name: "Order Tracking",
    status: "Active",
    lastModified: "2 days ago",
    messages: 634,
    completion: 78
  },
  {
    id: 5,
    name: "Feedback Collection",
    status: "Paused",
    lastModified: "3 days ago",
    messages: 234,
    completion: 100
  }
];

export function Dashboard() {
  return (
    <div className="flex-1 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Konverse</h1>
            <p className="text-gray-600 mt-1">Manage your WhatsApp business flows and campaigns</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {kpi.change} from last month
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit group-hover:bg-blue-200 transition-colors">
                  <PlusCircle className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Create New Campaign</CardTitle>
                <CardDescription>
                  Launch a new WhatsApp marketing campaign with custom flows
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-3 bg-green-100 rounded-full w-fit group-hover:bg-green-200 transition-colors">
                  <Workflow className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Build Flow</CardTitle>
                <CardDescription>
                  Design interactive conversation flows with drag-and-drop builder
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-3 bg-purple-100 rounded-full w-fit group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Manage Templates</CardTitle>
                <CardDescription>
                  Create and organize message templates for your campaigns
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recent Flows */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Flows</h2>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flow Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFlows.map((flow) => (
                  <TableRow key={flow.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">{flow.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={flow.status === 'Active' ? 'default' : 
                               flow.status === 'Draft' ? 'secondary' : 'outline'}
                        className={
                          flow.status === 'Active' ? 'bg-green-100 text-green-800' :
                          flow.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {flow.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{flow.messages.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${flow.completion}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{flow.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {flow.lastModified}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}