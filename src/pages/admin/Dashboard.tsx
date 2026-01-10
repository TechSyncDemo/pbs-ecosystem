import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  BookOpen,
  Package,
  TrendingUp,
  ArrowUpRight,
  IndianRupee,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { formatDistanceToNow } from 'date-fns';

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

export default function AdminDashboard() {
  const { stats, recentOrders, topCenters, isLoading, isStatsLoading, isOrdersLoading, isTopCentersLoading } = useAdminDashboard();

  const dashboardStats = [
    {
      label: 'Total Centers',
      value: stats?.totalCenters?.toString() || '0',
      change: `${stats?.activeCenters || 0} active`,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Students',
      value: stats?.activeStudents?.toLocaleString() || '0',
      change: `of ${stats?.totalStudents || 0}`,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses?.toString() || '0',
      change: `${stats?.activeCourses || 0} active`,
      icon: BookOpen,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: `${stats?.pendingOrders || 0} pending`,
      icon: IndianRupee,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

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
          {dashboardStats.map((stat) => (
            <Card key={stat.label} className="card-hover border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  {isStatsLoading ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    <p className="text-3xl font-bold font-heading">{stat.value}</p>
                  )}
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
              {isOrdersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
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
                          <p className="font-medium">{order.order_no}</p>
                          <p className="text-sm text-muted-foreground">{order.center_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={order.status === 'completed' ? 'default' : 'secondary'}
                            className={order.status === 'completed' ? 'bg-success hover:bg-success/90' : ''}
                          >
                            {order.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Sidebar */}
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-warning">{stats?.pendingOrders || 0}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Orders</p>
                      <p className="text-xs text-muted-foreground">pending verification</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/orders">View</Link>
                  </Button>
                </div>
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
                {isTopCentersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topCenters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No centers yet</p>
                ) : (
                  topCenters.map((center, index) => (
                    <div key={center.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? 'bg-warning/20 text-warning'
                              : index === 1
                              ? 'bg-muted-foreground/20 text-muted-foreground'
                              : index === 2
                              ? 'bg-warning/10 text-warning/70'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{center.name}</p>
                          <p className="text-xs text-muted-foreground">{center.student_count} students</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-success">
                        {formatCurrency(center.total_revenue)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
