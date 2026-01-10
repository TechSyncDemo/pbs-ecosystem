import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalCenters: number;
  activeCenters: number;
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  order_no: string;
  center_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface TopCenter {
  id: string;
  name: string;
  student_count: number;
  total_revenue: number;
}

export function useAdminDashboard() {
  // Fetch dashboard stats
  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [centersRes, studentsRes, coursesRes, ordersRes] = await Promise.all([
        supabase.from('centers').select('id, status'),
        supabase.from('students').select('id, status'),
        supabase.from('courses').select('id, status'),
        supabase.from('orders').select('id, status, total_amount'),
      ]);

      if (centersRes.error) throw centersRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const centers = centersRes.data || [];
      const students = studentsRes.data || [];
      const courses = coursesRes.data || [];
      const orders = ordersRes.data || [];

      return {
        totalCenters: centers.length,
        activeCenters: centers.filter(c => c.status === 'active').length,
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.status === 'active').length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      };
    },
  });

  // Fetch recent orders with center info
  const recentOrdersQuery = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          total_amount,
          status,
          created_at,
          centers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(order => ({
        id: order.id,
        order_no: order.order_no,
        center_name: (order.centers as any)?.name || 'Unknown Center',
        total_amount: Number(order.total_amount),
        status: order.status || 'pending',
        created_at: order.created_at,
      }));
    },
  });

  // Fetch top centers by student count
  const topCentersQuery = useQuery({
    queryKey: ['admin-top-centers'],
    queryFn: async (): Promise<TopCenter[]> => {
      const { data: centers, error: centersError } = await supabase
        .from('centers')
        .select('id, name')
        .eq('status', 'active');

      if (centersError) throw centersError;

      // Get student counts per center
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('center_id');

      if (studentsError) throw studentsError;

      // Get order totals per center
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('center_id, total_amount')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const centerStats = (centers || []).map(center => {
        const studentCount = (students || []).filter(s => s.center_id === center.id).length;
        const totalRevenue = (orders || [])
          .filter(o => o.center_id === center.id)
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        return {
          id: center.id,
          name: center.name,
          student_count: studentCount,
          total_revenue: totalRevenue,
        };
      });

      return centerStats
        .sort((a, b) => b.student_count - a.student_count)
        .slice(0, 4);
    },
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    recentOrders: recentOrdersQuery.data || [],
    isOrdersLoading: recentOrdersQuery.isLoading,
    topCenters: topCentersQuery.data || [],
    isTopCentersLoading: topCentersQuery.isLoading,
    isLoading: statsQuery.isLoading || recentOrdersQuery.isLoading || topCentersQuery.isLoading,
  };
}
