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
import {
  ShoppingCart,
  Search,
  Plus,
  Package,
  IndianRupee,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  QrCode,
} from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { toast } from 'sonner';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-2024-101',
    date: '2024-03-20',
    items: [
      { course: 'Advanced Computer Applications', type: 'Kit', qty: 10, unitPrice: 8000 },
    ],
    total: 80000,
    status: 'Approved',
    paymentMethod: 'Razorpay',
  },
  {
    id: 'ORD-2024-100',
    date: '2024-03-18',
    items: [
      { course: 'Digital Marketing', type: 'Kit', qty: 5, unitPrice: 6500 },
      { course: 'Tally Prime', type: 'Exam Only', qty: 3, unitPrice: 2000 },
    ],
    total: 38500,
    status: 'Approved',
    paymentMethod: 'Razorpay',
  },
  {
    id: 'ORD-2024-099',
    date: '2024-03-15',
    items: [
      { course: 'Web Development', type: 'Kit', qty: 8, unitPrice: 9500 },
    ],
    total: 76000,
    status: 'Pending',
    paymentMethod: 'Bank Transfer',
  },
];

const availableCourses = [
  { name: 'Advanced Computer Applications', kitPrice: 8000, examPrice: 3000 },
  { name: 'Diploma in Digital Marketing', kitPrice: 6500, examPrice: 2500 },
  { name: 'Certificate in Tally Prime', kitPrice: 4000, examPrice: 2000 },
  { name: 'Web Development Fundamentals', kitPrice: 9500, examPrice: 3500 },
  { name: 'Certificate in Python Programming', kitPrice: 7500, examPrice: 3000 },
];

export default function CenterOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{
    course: string;
    type: 'Kit' | 'Exam Only';
    qty: number;
    unitPrice: number;
  }>>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState<'Kit' | 'Exam Only'>('Kit');
  const [quantity, setQuantity] = useState('1');

  const filteredOrders = mockOrders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.course.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddItem = () => {
    const course = availableCourses.find((c) => c.name === selectedCourse);
    if (!course) return;

    const unitPrice = selectedType === 'Kit' ? course.kitPrice : course.examPrice;
    setOrderItems([
      ...orderItems,
      {
        course: selectedCourse,
        type: selectedType,
        qty: parseInt(quantity),
        unitPrice,
      },
    ]);
    setSelectedCourse('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const orderTotal = orderItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);

  const handlePayWithCard = () => {
    toast.success('Order placed successfully!', {
      description: 'Redirecting to payment gateway...',
    });
    setIsOrderDialogOpen(false);
    setOrderItems([]);
  };

  const handlePayWithQR = () => {
    toast.success('Order placed successfully!', {
      description: 'Generating QR code for payment...',
    });
    setIsOrderDialogOpen(false);
    setOrderItems([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-success hover:bg-success/90';
      case 'Pending':
        return 'bg-warning hover:bg-warning/90';
      case 'Rejected':
        return 'bg-destructive hover:bg-destructive/90';
      default:
        return '';
    }
  };

  return (
    <CenterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground mt-1">Purchase course kits and manage orders</p>
          </div>
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
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
                  Select courses and quantities to purchase inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {/* Add Item Form */}
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label>Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((course) => (
                          <SelectItem key={course.name} value={course.name}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label>Type</Label>
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as 'Kit' | 'Exam Only')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kit">Kit</SelectItem>
                        <SelectItem value="Exam Only">Exam Only</SelectItem>
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
                  <div className="col-span-2">
                    <Button onClick={handleAddItem} disabled={!selectedCourse} className="w-full">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.course}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{item.qty}</TableCell>
                            <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{(item.qty * item.unitPrice).toLocaleString()}
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
                <Button variant="outline" onClick={handlePayWithQR} disabled={orderItems.length === 0}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Pay with QR
                </Button>
                <Button onClick={handlePayWithCard} disabled={orderItems.length === 0}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Cards etc
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
                  <p className="text-2xl font-bold">{mockOrders.length}</p>
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
                  <p className="text-2xl font-bold">{mockOrders.filter(o => o.status === 'Approved').length}</p>
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
                  <p className="text-2xl font-bold">{mockOrders.filter(o => o.status === 'Pending').length}</p>
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
                    ₹{(mockOrders.reduce((acc, o) => acc + o.total, 0) / 1000).toFixed(0)}K
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
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Order ID</TableHead>
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
                          <span className="font-medium">{order.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{item.course}</span>
                              <span className="text-muted-foreground"> × {item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">₹{order.total.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'Approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {order.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
