import { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  Banknote,
  CreditCard,
  Eye,
  Warehouse,
  Building,
} from 'lucide-react';
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
      { id: selectedOrder.id, status: 'completed', payment_status: 'paid' },
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
                              <TableCell>₹{Number(order.total_amount).toLocaleString('en-IN')}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment for {selectedOrder?.order_no}</DialogTitle>
            <DialogDescription>
              Center: {selectedOrder?.center_name} <br />
              Amount: ₹{Number(selectedOrder?.total_amount || 0).toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Payment Receipt</Label>
            <div className="mt-2 border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-muted/50">
              <p className="text-sm text-muted-foreground">Receipt preview would be shown here.</p>
              <Button variant="link" className="mt-2">
                View Full Receipt <Eye className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button onClick={handleApprovePayment} disabled={updateOrderStatus.isPending}>
              {updateOrderStatus.isPending ? 'Approving...' : 'Approve & Release Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
