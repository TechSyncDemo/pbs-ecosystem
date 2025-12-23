import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  BookOpen,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  GraduationCap,
  Award,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';

// Mock data for dashboard
const stats = [
  {
    label: 'Total Centers',
    value: '48',
    change: '+3',
    trend: 'up',
    icon: Building2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: 'Active Students',
    value: '2,847',
    change: '+127',
    trend: 'up',
    icon: Users,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    label: 'Total Courses',
    value: '24',
    change: '+2',
    trend: 'up',
    icon: BookOpen,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    label: 'Revenue (MTD)',
    value: '₹12.4L',
    change: '+18%',
    trend: 'up',
    icon: IndianRupee,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const recentOrders = [
  { id: 'ORD-2024-001', center: 'PBS Delhi Center', amount: '₹45,000', status: 'Approved', date: '2 hours ago' },
  { id: 'ORD-2024-002', center: 'PBS Mumbai Center', amount: '₹28,500', status: 'Pending', date: '4 hours ago' },
  { id: 'ORD-2024-003', center: 'PBS Bangalore Center', amount: '₹62,000', status: 'Approved', date: '6 hours ago' },
  { id: 'ORD-2024-004', center: 'PBS Chennai Center', amount: '₹35,000', status: 'Approved', date: '8 hours ago' },
];

const pendingActions = [
  { type: 'Results', count: 12, label: 'pending declarations' },
  { type: 'Orders', count: 5, label: 'manual verification' },
  { type: 'Certificates', count: 28, label: 'ready to print' },
];

const topCenters = [
  { name: 'PBS Delhi Center', students: 245, revenue: '₹4.2L' },
  { name: 'PBS Mumbai Center', students: 198, revenue: '₹3.8L' },
  { name: 'PBS Bangalore Center', students: 176, revenue: '₹3.2L' },
  { name: 'PBS Chennai Center', students: 154, revenue: '₹2.9L' },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your ecosystem.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/admin/reports">View Reports</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/centers">
                <Building2 className="w-4 h-4 mr-2" />
                Add Center
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="card-hover border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {stat.change}
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold font-heading">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-heading text-lg">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/orders">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.center}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.amount}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={order.status === 'Approved' ? 'default' : 'secondary'}
                          className={order.status === 'Approved' ? 'bg-success hover:bg-success/90' : ''}
                        >
                          {order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{order.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Pending */}
          <div className="space-y-6">
            {/* Pending Actions */}
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingActions.map((action) => (
                  <div
                    key={action.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-warning">{action.count}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{action.type}</p>
                        <p className="text-xs text-muted-foreground">{action.label}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Centers */}
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Top Performing Centers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCenters.map((center, index) => (
                  <div
                    key={center.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-warning/20 text-warning' :
                        index === 1 ? 'bg-muted-foreground/20 text-muted-foreground' :
                        index === 2 ? 'bg-warning/10 text-warning/70' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{center.name}</p>
                        <p className="text-xs text-muted-foreground">{center.students} students</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-success">{center.revenue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
