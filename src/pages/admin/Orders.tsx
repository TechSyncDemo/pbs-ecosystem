import { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  Banknote,
  CreditCard,
  Warehouse,
  Building,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@radix-ui/react-label';
import { useAllOrders, useOrderStats, useUpdateOrderStatus, type OrderWithDetails } from '@/hooks/useOrders';
import { useCenters } from '@/hooks/useCenters';
import { useAllCenterStocks } from '@/hooks/useStock';

export default function AdminOrders() {
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  const { data: orders = [], isLoading: ordersLoading } = useAllOrders();
  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const { data: centers = [] } = useCenters();
  const { data: centerStocks = [] } = useAllCenterStocks();
  const updateOrderStatus = useUpdateOrderStatus();

  const handleApprovePayment = () => {
    if (!selectedOrder) return;

    updateOrderStatus.mutate(
      { id: selectedOrder.id, status: 'approved', payment_status: 'paid', order: selectedOrder },
      {
        onSuccess: () => {
          setIsVerifyOpen(false);
          setSelectedOrder(null);
        },
      }
    );
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning hover:bg-warning/90"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentIcon = (paymentStatus: string | null) => {
    if (paymentStatus === 'paid') {
      return <CreditCard className="w-4 h-4 text-success" />;
    }
    return <Banknote className="w-4 h-4 text-muted-foreground" />;
  };

  const filteredStocks = selectedCenterId
    ? centerStocks.filter(s => s.center_id === selectedCenterId)
    : [];

  const copy = (text?: string | null, label = 'Value') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const isPaid = selectedOrder?.payment_status === 'paid';
  const hasRzp = !!selectedOrder?.razorpay_payment_id;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Order & Stock Monitoring</h1>
          <p className="text-muted-foreground mt-1">Verify payments and monitor center inventory.</p>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders"><Package className="w-4 h-4 mr-2" />Order Dashboard</TabsTrigger>
            <TabsTrigger value="inventory"><Warehouse className="w-4 h-4 mr-2" />Center Inventory Monitor</TabsTrigger>
          </TabsList>

          {/* Order Dashboard Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>All Center Orders</CardTitle>
                <CardDescription>Review and approve payments for all incoming orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Order No</TableHead>
                          <TableHead>Center</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No orders found
                            </TableCell>
                          </TableRow>
                        ) : (
                          orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.order_no}</TableCell>
                              <TableCell>{order.center_name}</TableCell>
                              <TableCell>Rs. {Number(order.total_amount).toLocaleString('en-IN')}</TableCell>
                              <TableCell className="flex items-center gap-2">
                                {getPaymentIcon(order.payment_status)}
                                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                              </TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell>
                                {order.status === 'pending' && (
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsVerifyOpen(true); }}>
                                    Verify
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Center Inventory Monitor Tab */}
          <TabsContent value="inventory" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Live Center Stock</CardTitle>
                    <CardDescription>Select a center to view its live inventory.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-72">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select onValueChange={setSelectedCenterId}>
                      <SelectTrigger><SelectValue placeholder="Select a center..." /></SelectTrigger>
                      <SelectContent>
                        {centers.map(center => (
                          <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Item</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedCenterId ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            Please select a center to view its inventory.
                          </TableCell>
                        </TableRow>
                      ) : filteredStocks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            No inventory data for this center.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStocks.map((stock) => (
                          <TableRow key={stock.id}>
                            <TableCell className="font-medium">{stock.stock_items?.name}</TableCell>
                            <TableCell>{stock.stock_items?.code}</TableCell>
                            <TableCell className="text-center font-bold">{stock.quantity}</TableCell>
                            <TableCell>{new Date(stock.last_updated).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Manual Payment Verification Dialog */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Payment for {selectedOrder?.order_no}</DialogTitle>
            <DialogDescription>
              Center: {selectedOrder?.center_name} <br />
              Amount: Rs. {Number(selectedOrder?.total_amount || 0).toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Razorpay Receipt</Label>
              {isPaid ? (
                <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
              ) : (
                <Badge className="bg-warning hover:bg-warning/90"><Clock className="w-3 h-3 mr-1" />Unpaid</Badge>
              )}
            </div>

            {hasRzp ? (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Razorpay Order ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-background border rounded px-2 py-1 truncate">
                      {selectedOrder?.razorpay_order_id || '—'}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(selectedOrder?.razorpay_order_id, 'Order ID')}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Razorpay Payment ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-background border rounded px-2 py-1 truncate">
                      {selectedOrder?.razorpay_payment_id || '—'}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(selectedOrder?.razorpay_payment_id, 'Payment ID')}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {selectedOrder?.razorpay_signature && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Signature (HMAC-SHA256)</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs bg-background border rounded px-2 py-1 truncate">
                        {selectedOrder.razorpay_signature}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(selectedOrder.razorpay_signature, 'Signature')}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-semibold">Rs. {Number(selectedOrder?.total_amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid at</div>
                    <div className="font-medium">{selectedOrder?.updated_at ? new Date(selectedOrder.updated_at).toLocaleString('en-IN') : '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-success pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Signature verified server-side via HMAC-SHA256.
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-warning/10 border-warning/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">No Razorpay payment recorded</div>
                  <div className="text-muted-foreground mt-1">
                    The center has not completed Razorpay checkout for this order. Approving manually will release stock without payment confirmation.
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button onClick={handleApprovePayment} disabled={updateOrderStatus.isPending}>
              {updateOrderStatus.isPending
                ? 'Approving...'
                : isPaid
                ? 'Release Stock'
                : 'Mark Paid & Release Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
