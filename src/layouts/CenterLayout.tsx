import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  GraduationCap,
  BookOpen,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const centerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/center', icon: LayoutDashboard },
  { label: 'Profile', href: '/center/profile', icon: Building },
  { label: 'Enquiries', href: '/center/enquiries', icon: UserPlus },
  { label: 'My Stock', href: '/center/stock', icon: Package },
  { label: 'Orders', href: '/center/orders', icon: ShoppingCart },
  { label: 'Students', href: '/center/students', icon: Users },
  { label: 'Tutorials', href: '/center/tutorials', icon: BookOpen },
  { label: 'Support', href: '/center/support', icon: HelpCircle },
];

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/center') {
      return location.pathname === '/center';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed h-full z-50">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/center" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-sidebar-foreground">PBS Partner</h1>
              <p className="text-xs text-sidebar-foreground/60">Center Portal</p>
            </div>
          </Link>
        </div>

        {/* Center Name Badge */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg px-3 py-2">
            <p className="text-xs text-sidebar-foreground/60">Active Center</p>
            <p className="text-sm font-medium truncate">{user?.centerName || 'My Center'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {centerNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {user?.name?.charAt(0) || 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60">Center Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
