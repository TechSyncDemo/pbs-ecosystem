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
  Package,
  Search,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CenterLayout from '@/layouts/CenterLayout';

// Mock stock data
const mockStock = [
  {
    id: 'stock-001',
    course: 'Advanced Computer Applications',
    category: 'IT Division',
    opening: 30,
    purchased: 10,
    used: 15,
    closing: 25,
    lastUpdated: '2024-03-18',
  },
  {
    id: 'stock-002',
    course: 'Diploma in Digital Marketing',
    category: 'IT Division',
    opening: 20,
    purchased: 5,
    used: 7,
    closing: 18,
    lastUpdated: '2024-03-19',
  },
  {
    id: 'stock-003',
    course: 'Certificate in Tally Prime',
    category: 'Vocational',
    opening: 15,
    purchased: 0,
    used: 10,
    closing: 5,
    lastUpdated: '2024-03-20',
  },
  {
    id: 'stock-004',
    course: 'Web Development Fundamentals',
    category: 'IT Division',
    opening: 18,
    purchased: 8,
    used: 14,
    closing: 12,
    lastUpdated: '2024-03-17',
  },
  {
    id: 'stock-005',
    course: 'Certificate in Python Programming',
    category: 'IT Division',
    opening: 12,
    purchased: 0,
    used: 9,
    closing: 3,
    lastUpdated: '2024-03-20',
  },
  {
    id: 'stock-006',
    course: 'Spoken English Course',
    category: 'Language',
    opening: 25,
    purchased: 5,
    used: 8,
    closing: 22,
    lastUpdated: '2024-03-15',
  },
];

export default function CenterStock() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStock = mockStock.filter(
    (item) =>
      item.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStock = mockStock.reduce((acc, item) => acc + item.closing, 0);
  const lowStockItems = mockStock.filter((item) => item.closing <= 5);
  const totalPurchased = mockStock.reduce((acc, item) => acc + item.purchased, 0);
  const totalUsed = mockStock.reduce((acc, item) => acc + item.used, 0);

  return (
    <CenterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Stock Inventory</h1>
            <p className="text-muted-foreground mt-1">Monitor course kit inventory and stock levels</p>
          </div>
          <Button asChild>
            <Link to="/center/orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Stock
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStock}</p>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPurchased}</p>
                  <p className="text-sm text-muted-foreground">Purchased (MTD)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUsed}</p>
                  <p className="text-sm text-muted-foreground">Used (MTD)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowStockItems.length}</p>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Low Stock Alert</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The following courses have low inventory (≤5 units):
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lowStockItems.map((item) => (
                      <Badge key={item.id} variant="destructive">
                        {item.course} ({item.closing} left)
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="destructive" size="sm" asChild>
                  <Link to="/center/orders">Order Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Table */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-heading">Inventory Ledger</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
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
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Opening</TableHead>
                    <TableHead className="text-center">Purchased</TableHead>
                    <TableHead className="text-center">Used</TableHead>
                    <TableHead className="text-center">Closing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => (
                    <TableRow key={item.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.closing <= 5 ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}>
                            <BookOpen className={`w-5 h-5 ${
                              item.closing <= 5 ? 'text-destructive' : 'text-primary'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{item.course}</p>
                            <p className="text-sm text-muted-foreground">
                              Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.opening}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-success font-medium">+{item.purchased}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-destructive font-medium">-{item.used}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xl font-bold ${
                          item.closing <= 5 ? 'text-destructive' : ''
                        }`}>
                          {item.closing}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.closing <= 5 ? (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : item.closing <= 10 ? (
                          <Badge className="bg-warning hover:bg-warning/90">
                            Medium
                          </Badge>
                        ) : (
                          <Badge className="bg-success hover:bg-success/90">
                            Adequate
                          </Badge>
                        )}
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
