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
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CenterLayout from '@/layouts/CenterLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCenterStock, useCenterStockStats } from '@/hooks/useStock';
import { format } from 'date-fns';

export default function CenterStock() {
  const { user } = useAuth();
  const centerId = user?.centerId;

  const { data: stockData = [], isLoading } = useCenterStock(centerId);
  const { data: stats } = useCenterStockStats(centerId);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredStock = stockData.filter(
    (item) =>
      item.stock_item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stock_item?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = stockData.filter((item) => item.quantity <= 5);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stockData.length}</p>
                  <p className="text-sm text-muted-foreground">Item Types</p>
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
                  <p className="text-2xl font-bold">{stats?.lowStock || 0}</p>
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
                    The following items have low inventory (≤5 units):
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lowStockItems.map((item) => (
                      <Badge key={item.id} variant="destructive">
                        {item.stock_item?.name} ({item.quantity} left)
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
            {filteredStock.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {stockData.length === 0 ? 'No stock items yet. Place an order to get started!' : 'No items match your search.'}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={item.id} className="table-row-hover">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              item.quantity <= 5 ? 'bg-destructive/10' : 'bg-primary/10'
                            }`}>
                              <BookOpen className={`w-5 h-5 ${
                                item.quantity <= 5 ? 'text-destructive' : 'text-primary'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{item.stock_item?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.stock_item?.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.stock_item?.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{item.stock_item?.category || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xl font-bold ${
                            item.quantity <= 5 ? 'text-destructive' : ''
                          }`}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.last_updated), 'dd/MM/yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.quantity <= 5 ? (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Low Stock
                            </Badge>
                          ) : item.quantity <= 10 ? (
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
            )}
          </CardContent>
        </Card>
      </div>
    </CenterLayout>
  );
}
