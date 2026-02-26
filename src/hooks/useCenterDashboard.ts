import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CenterDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalEnquiries: number;
  newEnquiries: number;
  totalStock: number;
  lowStockCount: number;
  totalRevenue: number;
  loyaltyPoints: number;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  low: boolean;
}

export interface RecentEnquiry {
  id: string;
  name: string;
  course_name: string;
  status: string;
  created_at: string;
}

export interface RecentAdmission {
  id: string;
  name: string;
  course_name: string;
  admission_date: string;
}

export function useCenterDashboard(centerId?: string) {
  // Fetch dashboard stats for the center
  const statsQuery = useQuery({
    queryKey: ['center-dashboard-stats', centerId],
    queryFn: async (): Promise<CenterDashboardStats> => {
      const [studentsRes, enquiriesRes, stockRes, ordersRes, centerRes] = await Promise.all([
        supabase.from('students').select('id, status'),
        supabase.from('enquiries').select('id, status'),
        supabase.from('center_stock').select('id, quantity'),
        supabase.from('orders').select('id, total_amount, status'),
        centerId
          ? supabase.from('centers').select('loyalty_points').eq('id', centerId).single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (enquiriesRes.error) throw enquiriesRes.error;
      if (stockRes.error) throw stockRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const students = studentsRes.data || [];
      const enquiries = enquiriesRes.data || [];
      const stock = stockRes.data || [];
      const orders = ordersRes.data || [];

      const completedOrders = orders.filter(o => o.status === 'completed');

      return {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        totalEnquiries: enquiries.length,
        newEnquiries: enquiries.filter(e => e.status === 'new').length,
        totalStock: stock.reduce((sum, s) => sum + (s.quantity || 0), 0),
        lowStockCount: stock.filter(s => s.quantity < 10).length,
        totalRevenue: completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        loyaltyPoints: (centerRes.data as any)?.loyalty_points || 0,
      };
    },
    enabled: true,
  });

  // Fetch stock items with low stock warnings
  const stockQuery = useQuery({
    queryKey: ['center-stock-overview', centerId],
    queryFn: async (): Promise<StockItem[]> => {
      const { data, error } = await supabase
        .from('center_stock')
        .select(`
          id,
          quantity,
          stock_items (id, name)
        `)
        .order('quantity', { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: (item.stock_items as any)?.name || 'Unknown Item',
        quantity: item.quantity,
        low: item.quantity < 10,
      }));
    },
    enabled: true,
  });

  // Fetch recent enquiries
  const enquiriesQuery = useQuery({
    queryKey: ['center-recent-enquiries', centerId],
    queryFn: async (): Promise<RecentEnquiry[]> => {
      const { data, error } = await supabase
        .from('enquiries')
        .select(`
          id,
          name,
          status,
          created_at,
          courses (name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map(enquiry => ({
        id: enquiry.id,
        name: enquiry.name,
        course_name: (enquiry.courses as any)?.name || 'Not specified',
        status: enquiry.status || 'new',
        created_at: enquiry.created_at,
      }));
    },
    enabled: true,
  });

  // Fetch recent admissions
  const admissionsQuery = useQuery({
    queryKey: ['center-recent-admissions', centerId],
    queryFn: async (): Promise<RecentAdmission[]> => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          admission_date,
          courses (name)
        `)
        .order('admission_date', { ascending: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map(student => ({
        id: student.id,
        name: student.name,
        course_name: (student.courses as any)?.name || 'Unknown Course',
        admission_date: student.admission_date,
      }));
    },
    enabled: true,
  });

  return {
    stats: statsQuery.data,
    isStatsLoading: statsQuery.isLoading,
    stockItems: stockQuery.data || [],
    isStockLoading: stockQuery.isLoading,
    recentEnquiries: enquiriesQuery.data || [],
    isEnquiriesLoading: enquiriesQuery.isLoading,
    recentAdmissions: admissionsQuery.data || [],
    isAdmissionsLoading: admissionsQuery.isLoading,
    isLoading: statsQuery.isLoading || stockQuery.isLoading || enquiriesQuery.isLoading || admissionsQuery.isLoading,
  };
}
