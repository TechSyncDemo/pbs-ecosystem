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
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  QrCode,
  Loader2,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterOrders, useCreateOrder } from '@/hooks/useOrders';
import { useCenterAuthorizations } from '@/hooks/useCenterCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function CenterOrders() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: orders = [], isLoading } = useCenterOrders(centerId);
  const { data: centerCourses = [] } = useCenterAuthorizations(centerId);
  const createOrder = useCreateOrder();

  // Fetch full course details for center's approved courses
  const courseIds = centerCourses.map((cc: any) => cc.course_id);
  const { data: approvedCourses = [] } = useQuery({
    queryKey: ['center-approved-courses', centerId],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code, fee, exam_fee')
        .in('id', courseIds);
      if (error) throw error;
      return data || [];
    },
    enabled: courseIds.length > 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<'full_course' | 'exam_only'>('full_course');
  const [orderItems, setOrderItems] = useState<Array<{
    course_id: string;
    name: string;
    qty: number;
    unit_price: number;
  }>>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [quantity, setQuantity] = useState('1');

  const filteredOrders = orders.filter(
    (order) =>
      order.order_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    const course = approvedCourses.find((c) => c.id === selectedCourse);
    if (!course) return;

    const price = orderType === 'exam_only' ? Number(course.exam_fee || 0) : Number(course.fee || 0);

    const existingIndex = orderItems.findIndex(i => i.course_id === selectedCourse);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].qty += parseInt(quantity);
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          course_id: course.id,
          name: `${course.name} (${orderType === 'exam_only' ? 'Exam Only' : 'Full Course'})`,
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

  const handlePlaceOrder = async (paymentMethod: string) => {
    if (!centerId || orderItems.length === 0) return;

    await createOrder.mutateAsync({
      order: {
        center_id: centerId,
        order_no: '',
        total_amount: orderTotal,
        status: 'pending',
        payment_status: 'pending',
        notes: `Payment method: ${paymentMethod} | Type: ${orderType}`,
      },
      items: orderItems.map(item => ({
        stock_item_id: item.course_id, // Using course_id as reference
        quantity: item.qty,
        unit_price: item.unit_price,
        total_price: item.qty * item.unit_price,
      })),
    });

    setIsOrderDialogOpen(false);
    setOrderItems([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-success hover:bg-success/90';
      case 'pending':
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
            <p className="text-muted-foreground mt-1">Purchase course kits and manage orders</p>
          </div>
          <Dialog open={isOrderDialogOpen} onOpenChange={(open) => {
            setIsOrderDialogOpen(open);
            if (!open) { setOrderItems([]); setOrderType('full_course'); }
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
                  Select order type and courses from your approved authorizations.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {/* Order Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order Type</Label>
                  <RadioGroup
                    value={orderType}
                    onValueChange={(v) => {
                      setOrderType(v as 'full_course' | 'exam_only');
                      setOrderItems([]); // Reset items when type changes
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="full_course" id="full_course" />
                      <Label htmlFor="full_course" className="cursor-pointer">
                        <span className="font-medium">Full Course</span>
                        <span className="text-xs text-muted-foreground block">Exam + Book (Kit)</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="exam_only" id="exam_only" />
                      <Label htmlFor="exam_only" className="cursor-pointer">
                        <span className="font-medium">Exam Only</span>
                        <span className="text-xs text-muted-foreground block">Examination fee only</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Add Course Item */}
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-7">
                    <Label>Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} — ₹{orderType === 'exam_only'
                              ? Number(course.exam_fee || 0).toLocaleString()
                              : Number(course.fee || 0).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Button onClick={handleAddItem} disabled={!selectedCourse} className="w-full">
                      Add
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
                            <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{(item.qty * item.unit_price).toLocaleString()}
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
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="text-lg font-medium">Order Total</span>
                    <span className="text-2xl font-bold">₹{orderTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePlaceOrder('QR')}
                  disabled={orderItems.length === 0 || createOrder.isPending}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Pay with QR
                </Button>
                <Button
                  onClick={() => handlePlaceOrder('Card')}
                  disabled={orderItems.length === 0 || createOrder.isPending}
                >
                  {createOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Card
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
                    ₹{(stats.totalValue / 1000).toFixed(0)}K
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
                          <span className="font-bold">₹{Number(order.total_amount).toLocaleString()}</span>
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
