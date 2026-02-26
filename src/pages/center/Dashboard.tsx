import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserPlus,
  Package,
  ShoppingCart,
  ArrowUpRight,
  IndianRupee,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CenterLayout from '@/layouts/CenterLayout';
import { useCenterDashboard } from '@/hooks/useCenterDashboard';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function CenterDashboard() {
  const { user } = useAuth();
  const { stats, stockItems, recentEnquiries, recentAdmissions, isLoading, isStatsLoading, isStockLoading, isEnquiriesLoading, isAdmissionsLoading } = useCenterDashboard(user?.centerId);

  const dashboardStats = [
    {
      label: 'Active Students',
      value: stats?.activeStudents?.toString() || '0',
      change: `of ${stats?.totalStudents || 0}`,
      trend: 'up',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'New Enquiries',
      value: stats?.newEnquiries?.toString() || '0',
      change: `of ${stats?.totalEnquiries || 0}`,
      trend: 'up',
      icon: UserPlus,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Stock Available',
      value: stats?.totalStock?.toString() || '0',
      change: stats?.lowStockCount ? `${stats.lowStockCount} low` : 'units',
      trend: 'neutral',
      icon: Package,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Loyalty Points',
      value: stats?.loyaltyPoints?.toString() || '0',
      change: 'points earned',
      trend: 'neutral',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: 'completed orders',
      trend: 'up',
      icon: IndianRupee,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <CenterLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening at {user?.centerName || 'your center'}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/center/stock">
                <Package className="w-4 h-4 mr-2" />
                View Stock
              </Link>
            </Button>
            <Button asChild>
              <Link to="/center/students">
                <UserPlus className="w-4 h-4 mr-2" />
                New Admission
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 stagger-children">
          {dashboardStats.map((stat) => (
            <Card key={stat.label} className="card-hover border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      {stat.change}
                    </div>
                  )}
                  {stat.trend === 'neutral' && (
                    <span className="text-sm text-muted-foreground">{stat.change}</span>
                  )}
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
          {/* Stock Overview */}
          <Card className="lg:col-span-2 border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-heading text-lg">Stock Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/center/stock">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isStockLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No stock items yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        item.low ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.low ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}
                        >
                          <BookOpen className={`w-5 h-5 ${item.low ? 'text-destructive' : 'text-primary'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Stock Item</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`text-xl font-bold ${item.low ? 'text-destructive' : ''}`}>
                            {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">units</p>
                        </div>
                        {item.low && (
                          <Badge variant="destructive" className="whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full mt-4" variant="outline" asChild>
                <Link to="/center/orders">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order More Stock
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Enquiries */}
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-info" />
                  Recent Enquiries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEnquiriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentEnquiries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No enquiries yet</p>
                ) : (
                  recentEnquiries.map((enquiry) => (
                    <div key={enquiry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{enquiry.name}</p>
                        <p className="text-xs text-muted-foreground">{enquiry.course_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={enquiry.status === 'new' ? 'default' : 'secondary'}
                          className="text-xs capitalize"
                        >
                          {enquiry.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(enquiry.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/center/enquiries">View All Enquiries</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Admissions */}
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Recent Admissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmissionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentAdmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No admissions yet</p>
                ) : (
                  recentAdmissions.map((admission) => (
                    <div
                      key={admission.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10"
                    >
                      <div>
                        <p className="text-sm font-medium">{admission.name}</p>
                        <p className="text-xs text-muted-foreground">{admission.course_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(admission.admission_date)}</span>
                    </div>
                  ))
                )}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/center/students">View All Students</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CenterLayout>
  );
}
