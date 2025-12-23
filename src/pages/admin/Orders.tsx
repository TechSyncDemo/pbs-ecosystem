import { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  Banknote,
  CreditCard,
  Eye,
  Warehouse,
  Search,
  Building,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Label } from '@radix-ui/react-label';

// Mock Data
const mockOrders = [
  {
    id: 'ORD-2024-101',
    centerName: 'PBS Computer Education - City Center',
    date: '2024-05-20',
    amount: 15000,
    paymentMethod: 'Online',
    status: 'Completed',
    receiptUrl: null,
  },
  {
    id: 'ORD-2024-102',
    centerName: 'Vocational Skills Institute - Suburb',
    date: '2024-05-19',
    amount: 8500,
    paymentMethod: 'Bank Transfer',
    status: 'Pending Payment',
    receiptUrl: '/receipts/receipt-102.pdf', // Mock receipt URL
  },
  {
    id: 'ORD-2024-103',
    centerName: 'Tech Learners Hub - North',
    date: '2024-05-18',
    amount: 22000,
    paymentMethod: 'Cash',
    status: 'Pending Payment',
    receiptUrl: '/receipts/receipt-103.jpg', // Mock receipt URL
  },
];

const mockCenters = [
  { id: 'C-001', name: 'PBS Computer Education - City Center' },
  { id: 'C-002', name: 'Vocational Skills Institute - Suburb' },
  { id: 'C-003', name: 'Tech Learners Hub - North' },
];

const mockInventoryLog = {
  'C-001': [
    { date: '2024-05-01', item: 'Tally Prime Kit', opening: 0, added: 10, usedBy: null, closing: 10 },
    { date: '2024-05-03', item: 'Tally Prime Kit', opening: 10, added: 0, usedBy: 'Ravi Kumar', closing: 9 },
    { date: '2024-05-05', item: 'Tally Prime Kit', opening: 9, added: 0, usedBy: 'Sunita Sharma', closing: 8 },
    { date: '2024-05-10', item: 'Digital Marketing Kit', opening: 0, added: 5, usedBy: null, closing: 5 },
  ],
  'C-002': [
    { date: '2024-05-02', item: 'Spoken English Book', opening: 0, added: 20, usedBy: null, closing: 20 },
    { date: '2024-05-06', item: 'Spoken English Book', opening: 20, added: 0, usedBy: 'Amit Patel', closing: 19 },
  ],
  'C-003': [],
};

type Order = typeof mockOrders[0];

export default function AdminOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  const handleApprovePayment = () => {
    if (!selectedOrder) return;

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === selectedOrder.id ? { ...order, status: 'Completed' } : order
      )
    );

    toast.success(`Order ${selectedOrder.id} has been approved.`);
    setIsVerifyOpen(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'Pending Payment':
        return <Badge className="bg-warning hover:bg-warning/90"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Online':
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
      case 'Bank Transfer':
      case 'Cash':
        return <Banknote className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

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
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Order ID</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.centerName}</TableCell>
                          <TableCell>₹{order.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            {getPaymentIcon(order.paymentMethod)}
                            {order.paymentMethod}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.status === 'Pending Payment' && (
                              <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setIsVerifyOpen(true); }}>
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                    <CardDescription>Select a center to view its live inventory log for auditing.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-72">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select onValueChange={setSelectedCenterId}>
                      <SelectTrigger><SelectValue placeholder="Select a center..." /></SelectTrigger>
                      <SelectContent>
                        {mockCenters.map(center => (
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
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Opening Qty</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Used (Student)</TableHead>
                        <TableHead>Closing Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCenterId && mockInventoryLog[selectedCenterId]?.length > 0 ? (
                        mockInventoryLog[selectedCenterId].map((log, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{log.item}</TableCell>
                            <TableCell>{log.opening}</TableCell>
                            <TableCell className="text-success font-medium">{log.added > 0 ? `+${log.added}` : '-'}</TableCell>
                            <TableCell className="text-destructive">{log.usedBy || '-'}</TableCell>
                            <TableCell className="font-bold">{log.closing}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
                            {selectedCenterId ? 'No inventory data for this center.' : 'Please select a center to view its inventory.'}
                          </TableCell>
                        </TableRow>
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
            <DialogTitle>Verify Payment for {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Center: {selectedOrder?.centerName} <br />
              Amount: ₹{selectedOrder?.amount.toLocaleString('en-IN')} via {selectedOrder?.paymentMethod}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Payment Receipt</Label>
            <div className="mt-2 border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-muted/50">
              {/* In a real app, this would display the actual image or PDF */}
              <p className="text-sm text-muted-foreground">Receipt preview would be shown here.</p>
              <Button variant="link" asChild className="mt-2">
                <a href={selectedOrder?.receiptUrl} target="_blank" rel="noopener noreferrer">
                  View Full Receipt <Eye className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button onClick={handleApprovePayment}>Approve & Release Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}