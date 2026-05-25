import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  Plus,
  Package,
  IndianRupee,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterOrders, useCreateOrder } from '@/hooks/useOrders';
import { useCenterAuthorizations } from '@/hooks/useCenterCourses';
import { validateCoupon, applyCouponToOrder, type ValidatedCoupon } from '@/hooks/useCoupons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateOrderBill } from '@/lib/generateOrderBill';

declare global {
  interface Window { Razorpay?: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CenterOrders() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: orders = [], isLoading } = useCenterOrders(centerId);
  const { data: centerCourses = [] } = useCenterAuthorizations(centerId);
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();

  const { data: centerInfo } = useQuery({
    queryKey: ['center-info', centerId],
    queryFn: async () => {
      if (!centerId) return null;
      const { data, error } = await supabase
        .from('centers')
        .select('name, code, address, city, state, pincode, phone, email')
        .eq('id', centerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!centerId,
  });

  // Fetch ALL courses belonging to the authorizations the center is approved for
  const courseIds = centerCourses.map((cc: any) => cc.course_id);
  const { data: approvedCourses = [] } = useQuery({
    queryKey: ['center-approved-courses', centerId, courseIds.join(',')],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      // Step 1: resolve authorization_ids from the center's assigned courses
      const { data: assigned, error: assignedErr } = await supabase
        .from('courses')
        .select('authorization_id')
        .in('id', courseIds);
      if (assignedErr) throw assignedErr;
      const authIds = Array.from(
        new Set((assigned || []).map(c => c.authorization_id).filter(Boolean))
      ) as string[];
      if (authIds.length === 0) {
        // Fallback: just return the directly assigned courses
        const { data, error } = await supabase
          .from('courses')
          .select('id, name, code, fee, exam_fee')
          .in('id', courseIds)
          .eq('status', 'active');
        if (error) throw error;
        return data || [];
      }
      // Step 2: fetch all active courses under those authorizations
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code, fee, exam_fee')
        .in('authorization_id', authIds)
        .eq('status', 'active')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: courseIds.length > 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{
    course_id: string;
    name: string;
    qty: number;
    unit_price: number;
  }>>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const filteredOrders = orders.filter(
    (order) =>
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = (type: 'full_course' | 'exam_only') => {
    const course = approvedCourses.find((c) => c.id === selectedCourse);
    if (!course) return;

    const price = type === 'exam_only' ? Number(course.exam_fee || 0) : Number(course.fee || 0);
    const itemName = `${course.name} (${type === 'exam_only' ? 'Exam Only' : 'Book + Exam'})`;

    const existingIndex = orderItems.findIndex(i => i.name === itemName);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].qty += parseInt(quantity);
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          course_id: course.id,
          name: itemName,
          qty: parseInt(quantity),
          unit_price: price,
        },
      ]);
    }
    setSelectedCourse('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const orderTotal = orderItems.reduce((acc, item) => acc + item.qty * item.unit_price, 0);
  const discount = appliedCoupon?.valid ? Number(appliedCoupon.discount_amount || 0) : 0;
  const afterDiscount = Math.max(0, orderTotal - discount);
  const convenienceFee = Math.round(afterDiscount * 0.03 * 100) / 100;
  const finalTotal = Math.round((afterDiscount + convenienceFee) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!centerId || !couponInput.trim() || orderTotal <= 0) return;
    setValidatingCoupon(true);
    setCouponError(null);
    const res = await validateCoupon(couponInput, centerId, orderTotal);
    setValidatingCoupon(false);
    if (!res.valid) {
      setCouponError(res.error || 'Invalid coupon');
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(res);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const generateOrderNo = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const timestamp = now.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${year}${timestamp}${random}`;
  };

  const buildBillDataFromOrder = (order: any) => {
    const items: { name: string; qty: number; unit_price: number }[] =
      (order.order_items || []).map((it: any) => ({
        name: it.stock_items?.name || 'Item',
        qty: Number(it.quantity || 0),
        unit_price: Number(it.unit_price || 0),
      }));
    const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const discount = Number(order.discount_amount || 0);
    const total = Number(order.total_amount || 0);
    const conv = Math.max(0, Math.round((total - (subtotal - discount)) * 100) / 100);
    const addressParts = [centerInfo?.address, centerInfo?.city, centerInfo?.state, centerInfo?.pincode].filter(Boolean);
    return {
      orderNo: order.order_no,
      orderDate: format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a'),
      centerName: centerInfo?.name || user?.centerName || '',
      centerCode: centerInfo?.code,
      centerAddress: addressParts.join(', '),
      centerPhone: centerInfo?.phone || undefined,
      centerEmail: centerInfo?.email || undefined,
      items,
      subtotal,
      discount,
      couponCode: order.coupon_code,
      convenienceFee: conv,
      total,
      razorpayPaymentId: order.razorpay_payment_id || order.payment_id,
      razorpayOrderId: order.razorpay_order_id,
    };
  };

  const startRazorpayCheckout = async (orderRow: any, amountInr: number) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error('Failed to load payment gateway'); return; }

    const { data: rpOrder, error: fnErr } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount_inr: amountInr, receipt: orderRow.order_no },
    });
    if (fnErr || !rpOrder?.razorpay_order_id) {
      toast.error(fnErr?.message || rpOrder?.error || 'Could not initiate payment');
      return;
    }

    // Persist razorpay order id so retries reuse it
    await supabase.from('orders').update({ razorpay_order_id: rpOrder.razorpay_order_id }).eq('id', orderRow.id);

    const rzp = new window.Razorpay({
      key: rpOrder.key_id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      order_id: rpOrder.razorpay_order_id,
      name: 'Proactive B-School',
      description: `Order ${orderRow.order_no}`,
      prefill: {
        name: centerInfo?.name || user?.centerName || '',
        email: centerInfo?.email || user?.email || '',
        contact: centerInfo?.phone || '',
      },
      theme: { color: '#0f4c81' },
      handler: async (resp: any) => {
        const { data: vr, error: vErr } = await supabase.functions.invoke('verify-razorpay-payment', {
          body: {
            order_id: orderRow.id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          },
        });
        if (vErr || !vr?.success) {
          toast.error(vErr?.message || vr?.error || 'Payment verification failed');
          return;
        }
        toast.success('Payment successful — stock released');
        queryClient.invalidateQueries({ queryKey: ['center-orders'] });
        queryClient.invalidateQueries({ queryKey: ['center-stock'] });

        // Re-fetch order with items for bill
        const { data: full } = await supabase
          .from('orders')
          .select('*, order_items(*, stock_items(name, code))')
          .eq('id', orderRow.id)
          .single();
        if (full) {
          full.razorpay_payment_id = resp.razorpay_payment_id;
          full.razorpay_order_id = resp.razorpay_order_id;
          generateOrderBill(buildBillDataFromOrder(full));
        }
      },
      modal: {
        ondismiss: () => {
          toast.message('Payment cancelled — order saved as pending, you can retry.');
        },
      },
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!centerId || orderItems.length === 0) return;

    // Look up stock_item_ids for each course
    const courseIdsInOrder = [...new Set(orderItems.map(i => i.course_id))];
    const { data: stockItems, error: siError } = await supabase
      .from('stock_items')
      .select('id, course_id')
      .in('course_id', courseIdsInOrder);

    if (siError || !stockItems) {
      toast.error('Failed to resolve stock items for courses');
      return;
    }

    const courseToStockItem = new Map(stockItems.map(si => [si.course_id, si.id]));

    const missing = orderItems.filter(i => !courseToStockItem.get(i.course_id));
    if (missing.length > 0) {
      toast.error('Stock item not configured for one or more selected courses. Please contact admin.');
      return;
    }

    const created = await createOrder.mutateAsync({
      order: {
        center_id: centerId,
        order_no: generateOrderNo(),
        total_amount: finalTotal,
        status: 'pending',
        payment_status: 'pending',
        notes: 'Razorpay',
      },
      items: orderItems.map(item => ({
        stock_item_id: courseToStockItem.get(item.course_id)!,
        quantity: item.qty,
        unit_price: item.unit_price,
        total_price: item.qty * item.unit_price,
      })),
    });

    if (appliedCoupon?.valid && created?.id) {
      await applyCouponToOrder(appliedCoupon.code!, centerId, created.id, orderTotal);
    }

    setIsOrderDialogOpen(false);
    setOrderItems([]);
    handleRemoveCoupon();

    if (created?.id) {
      await startRazorpayCheckout({ ...created, order_no: created.order_no }, Number(finalTotal));
    }
  };

  const handleRetryPayment = async (order: any) => {
    await startRazorpayCheckout(order, Number(order.total_amount || 0));
  };

  const handleDownloadBill = (order: any) => {
    generateOrderBill(buildBillDataFromOrder(order));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-success hover:bg-success/90';
      case 'pending': // This covers orders awaiting super admin approval
        return 'bg-warning hover:bg-warning/90';
      case 'rejected':
        return 'bg-destructive hover:bg-destructive/90';
      default:
        return '';
    }
  };

  const stats = {
    total: orders.length,
    approved: orders.filter(o => o.status === 'completed' || o.status === 'approved').length,
    pending: orders.filter(o => o.status === 'pending').length,
    totalValue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  };

  if (isLoading) {
    return (
      <CenterLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CenterLayout>
    );
  }

  return (
    <CenterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground mt-1">Purchase course kits and exam fees</p>
          </div>
          <Dialog open={isOrderDialogOpen} onOpenChange={(open) => {
            setIsOrderDialogOpen(open);
            if (!open) { setOrderItems([]); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Select courses from your approved authorizations to order kits or exam fees.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {/* Add Course Item */}
                <div className="flex gap-2 items-end pt-2">
                  <div className="flex-grow">
                    <Label>Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-shrink-0">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => handleAddItem('full_course')}
                      disabled={!selectedCourse}
                      variant="outline"
                    >
                      Book + Exam.
                    </Button>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => handleAddItem('exam_only')}
                      disabled={!selectedCourse}
                      variant="outline"
                    >
                      Only Exam.
                    </Button>
                  </div>
                </div>

                {approvedCourses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No courses approved for your center. Contact admin for authorization.
                  </p>
                )}

                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Course</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.qty}</TableCell>
                            <TableCell className="text-right">Rs. {item.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">
                              Rs. {(item.qty * item.unit_price).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleRemoveItem(index)}
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Order Total */}
                {orderItems.length > 0 && (
                  <div className="space-y-3">
                    {/* Coupon */}
                    <div className="space-y-2">
                      <Label>Coupon Code (optional)</Label>
                      {appliedCoupon?.valid ? (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-success/40 bg-success/10">
                          <div className="text-sm">
                            <span className="font-mono font-semibold">{appliedCoupon.code}</span>
                            <span className="text-muted-foreground"> applied — you save Rs. {discount.toLocaleString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>Remove</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                          />
                          <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponInput.trim() || validatingCoupon}>
                            {validatingCoupon && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Apply
                          </Button>
                        </div>
                      )}
                      {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rs. {orderTotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-sm text-success">
                          <span>Discount ({appliedCoupon?.code})</span>
                          <span>− Rs. {discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Convenience Fee (3%)</span>
                        <span>Rs. {convenienceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-medium">Order Total <span className="text-xs text-muted-foreground font-normal">(incl. GST &amp; convenience fees)</span></span>
                        <span className="text-2xl font-bold">Rs. {finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handlePlaceOrder()}
                  disabled={orderItems.length === 0 || createOrder.isPending}
                >
                  {createOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Rs. {finalTotal.toLocaleString()}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    Rs. {(stats.totalValue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">Order History</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {orders.length === 0 ? 'No orders yet. Place your first order!' : 'No orders match your search.'}
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Order No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="table-row-hover">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{order.order_no}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(order.created_at), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.order_items?.map((item: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{item.stock_items?.name || 'Item'}</span>
                                <span className="text-muted-foreground"> × {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">Rs. {Number(order.total_amount).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.payment_status || 'pending'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${getStatusColor(order.status || 'pending')}`}>
                            {order.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {order.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.payment_status === 'paid' ? (
                            <Button variant="outline" size="sm" onClick={() => handleDownloadBill(order)}>
                              <Download className="w-3.5 h-3.5 mr-1" /> Bill
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" onClick={() => handleRetryPayment(order)}>
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Pay Now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
