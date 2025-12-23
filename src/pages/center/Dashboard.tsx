import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  IndianRupee,
  GraduationCap,
  AlertCircle,
  Clock,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CenterLayout from '@/layouts/CenterLayout';

// Mock data for center dashboard
const stats = [
  {
    label: 'Active Students',
    value: '127',
    change: '+8',
    trend: 'up',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: 'New Enquiries',
    value: '24',
    change: '+5',
    trend: 'up',
    icon: UserPlus,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    label: 'Stock Available',
    value: '85',
    change: 'units',
    trend: 'neutral',
    icon: Package,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    label: 'Monthly Revenue',
    value: '₹2.4L',
    change: '+12%',
    trend: 'up',
    icon: IndianRupee,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const stockItems = [
  { course: 'Advanced Computer Applications', available: 25, low: false },
  { course: 'Diploma in Digital Marketing', available: 18, low: false },
  { course: 'Certificate in Tally Prime', available: 5, low: true },
  { course: 'Web Development Fundamentals', available: 12, low: false },
  { course: 'Certificate in Python Programming', available: 3, low: true },
];

const recentEnquiries = [
  { name: 'Arun Kumar', course: 'Digital Marketing', time: '2 hours ago', status: 'New' },
  { name: 'Meera Joshi', course: 'Web Development', time: '4 hours ago', status: 'Callback' },
  { name: 'Rakesh Singh', course: 'Tally Prime', time: '6 hours ago', status: 'New' },
];

const recentAdmissions = [
  { name: 'Priya Verma', course: 'Python Programming', date: 'Today' },
  { name: 'Ankit Sharma', course: 'Digital Marketing', date: 'Yesterday' },
  { name: 'Neha Gupta', course: 'Computer Applications', date: '2 days ago' },
];

export default function CenterDashboard() {
  const { user } = useAuth();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {stats.map((stat) => (
            <Card key={stat.label} className="card-hover border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.trend === 'up' && (
                    <div className="flex items-center gap-1 text-sm font-medium text-success">
                      {stat.change}
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  )}
                  {stat.trend === 'neutral' && (
                    <span className="text-sm text-muted-foreground">{stat.change}</span>
                  )}
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
          {/* Stock Overview */}
          <Card className="lg:col-span-2 border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-heading text-lg">Stock Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/center/stock">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockItems.map((item) => (
                  <div
                    key={item.course}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      item.low ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.low ? 'bg-destructive/10' : 'bg-primary/10'
                      }`}>
                        <BookOpen className={`w-5 h-5 ${item.low ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{item.course}</p>
                        <p className="text-sm text-muted-foreground">Course Kit</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className={`text-xl font-bold ${item.low ? 'text-destructive' : ''}`}>
                          {item.available}
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
                {recentEnquiries.map((enquiry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{enquiry.name}</p>
                      <p className="text-xs text-muted-foreground">{enquiry.course}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={enquiry.status === 'New' ? 'default' : 'secondary'} className="text-xs">
                        {enquiry.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{enquiry.time}</p>
                    </div>
                  </div>
                ))}
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
                {recentAdmissions.map((admission, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{admission.name}</p>
                      <p className="text-xs text-muted-foreground">{admission.course}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{admission.date}</span>
                  </div>
                ))}
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
