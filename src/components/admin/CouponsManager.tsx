import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Ticket } from 'lucide-react';
import { useCoupons, useUpsertCoupon, useDeleteCoupon, useToggleCouponStatus, type Coupon } from '@/hooks/useCoupons';
import { format } from 'date-fns';

const empty = {
  id: '',
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  max_discount: '' as any,
  min_order_amount: 0,
  usage_limit: '' as any,
  per_center_limit: '' as any,
  valid_from: '',
  valid_until: '',
  status: 'active' as 'active' | 'inactive',
};

export default function CouponsManager() {
  const { data: coupons = [], isLoading } = useCoupons();
  const upsert = useUpsertCoupon();
  const del = useDeleteCoupon();
  const toggle = useToggleCouponStatus();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const startCreate = () => { setForm(empty); setOpen(true); };
  const startEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      max_discount: c.max_discount ?? '',
      min_order_amount: Number(c.min_order_amount || 0),
      usage_limit: c.usage_limit ?? '',
      per_center_limit: c.per_center_limit ?? '',
      valid_from: c.valid_from ? c.valid_from.slice(0, 10) : '',
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : '',
      status: c.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) return;
    const payload: any = {
      code: form.code,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_discount: form.max_discount === '' || form.max_discount === null ? null : Number(form.max_discount),
      min_order_amount: Number(form.min_order_amount || 0),
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      per_center_limit: form.per_center_limit === '' ? null : Number(form.per_center_limit),
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : new Date().toISOString(),
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      status: form.status,
    };
    if (form.id) payload.id = form.id;
    await upsert.mutateAsync(payload);
    setOpen(false);
  };

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Ticket className="w-5 h-5" /> Coupon Codes</CardTitle>
          <CardDescription>Create and manage discount codes that centers can apply at checkout.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}><Plus className="w-4 h-4 mr-2" />New Coupon</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
              <DialogDescription>Configure the code, discount and limits.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="grid gap-2 col-span-2">
                <Label>Coupon Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>Description (optional)</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Discount Value</Label>
                <Input type="number" min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
              {form.discount_type === 'percentage' && (
                <div className="grid gap-2">
                  <Label>Max Discount (₹, optional)</Label>
                  <Input type="number" min="0" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} placeholder="No cap" />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Minimum Order Amount (₹)</Label>
                <Input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Total Usage Limit</Label>
                <Input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" />
              </div>
              <div className="grid gap-2">
                <Label>Per-Center Limit</Label>
                <Input type="number" min="0" value={form.per_center_limit} onChange={(e) => setForm({ ...form, per_center_limit: e.target.value })} placeholder="Unlimited" />
              </div>
              <div className="grid gap-2">
                <Label>Valid From</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 col-span-2">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive coupons cannot be redeemed.</p>
                </div>
                <Switch checked={form.status === 'active'} onCheckedChange={(c) => setForm({ ...form, status: c ? 'active' : 'inactive' })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No coupons yet. Create your first one!</div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}%${c.max_discount ? ` (max ₹${c.max_discount})` : ''}`
                        : `₹${c.discount_value}`}
                    </TableCell>
                    <TableCell>₹{c.min_order_amount}</TableCell>
                    <TableCell>
                      {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(c.valid_from), 'dd MMM yy')}
                      {c.valid_until ? ` – ${format(new Date(c.valid_until), 'dd MMM yy')}` : ' onwards'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.status === 'active'}
                        onCheckedChange={(checked) => toggle.mutate({ id: c.id, status: checked ? 'active' : 'inactive' })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                        if (confirm(`Delete coupon ${c.code}?`)) del.mutate(c.id);
                      }}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
