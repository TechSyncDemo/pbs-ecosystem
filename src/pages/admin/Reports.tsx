import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Building,
  BookOpen,
  Calendar,
  Search,
  ClipboardList,
  IndianRupeeIcon,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAllStudents } from '@/hooks/useStudents';
import { useEnquiries } from '@/hooks/useEnquiries';
import { useCenters } from '@/hooks/useCenters';
import { useCourses } from '@/hooks/useCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useAllEnquiries() {
  return useQuery({
    queryKey: ['all-enquiries-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*, centers(name), courses(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(e => ({
        ...e,
        center_name: (e.centers as any)?.name || '',
        course_name: (e.courses as any)?.name || '',
      }));
    },
  });
}

function useAllCenterStocks() {
  return useQuery({
    queryKey: ['all-center-stocks-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_stock')
        .select('*, centers(name), stock_items(name, code, course_id)')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      return data.map(s => ({
        ...s,
        center_name: (s.centers as any)?.name || '',
        item_name: (s.stock_items as any)?.name || '',
        item_code: (s.stock_items as any)?.code || '',
      }));
    },
  });
}

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} records`);
}

export default function AdminReports() {
  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const { data: enquiries = [], isLoading: enquiriesLoading } = useAllEnquiries();
  const { data: centers = [] } = useCenters();
  const { data: courses = [] } = useCourses();
  const { data: stocks = [], isLoading: stocksLoading } = useAllCenterStocks();

  const [enquiryFilters, setEnquiryFilters] = useState({ center: 'all', course: 'all', startDate: '', endDate: '' });
  const [studentFilters, setStudentFilters] = useState({ center: 'all', course: 'all', startDate: '', endDate: '' });
  const [dueFilters, setDueFilters] = useState({ center: 'all' });
  const [examFilters, setExamFilters] = useState({ center: 'all', status: 'all' });
  const [inventoryFilters, setInventoryFilters] = useState({ center: 'all', search: '' });

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      if (enquiryFilters.center !== 'all' && e.center_id !== enquiryFilters.center) return false;
      if (enquiryFilters.course !== 'all' && e.course_id !== enquiryFilters.course) return false;
      const date = e.created_at?.slice(0, 10) || '';
      if (enquiryFilters.startDate && date < enquiryFilters.startDate) return false;
      if (enquiryFilters.endDate && date > enquiryFilters.endDate) return false;
      return true;
    });
  }, [enquiries, enquiryFilters]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (studentFilters.center !== 'all' && s.center_id !== studentFilters.center) return false;
      if (studentFilters.course !== 'all' && s.course_id !== studentFilters.course) return false;
      if (studentFilters.startDate && s.admission_date < studentFilters.startDate) return false;
      if (studentFilters.endDate && s.admission_date > studentFilters.endDate) return false;
      return true;
    });
  }, [students, studentFilters]);

  const dueStudents = useMemo(() => {
    return students
      .filter(s => Number(s.fee_pending || 0) > 0)
      .filter(s => dueFilters.center === 'all' || s.center_id === dueFilters.center);
  }, [students, dueFilters]);

  const examStudents = useMemo(() => {
    return students.filter(s => {
      if (examFilters.center !== 'all' && s.center_id !== examFilters.center) return false;
      if (examFilters.status !== 'all' && s.status !== examFilters.status) return false;
      return true;
    });
  }, [students, examFilters]);

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      if (inventoryFilters.center !== 'all' && s.center_id !== inventoryFilters.center) return false;
      if (inventoryFilters.search && !s.item_name.toLowerCase().includes(inventoryFilters.search.toLowerCase())) return false;
      return true;
    });
  }, [stocks, inventoryFilters]);

  const CenterCourseFilters = ({ filters, setFilters, showDates = true }: { filters: any; setFilters: any; showDates?: boolean }) => (
    <div className="flex flex-wrap items-center gap-4 mt-4">
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-muted-foreground" />
        <Select value={filters.center} onValueChange={v => setFilters((p: any) => ({ ...p, center: v }))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filters.course !== undefined && (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <Select value={filters.course} onValueChange={v => setFilters((p: any) => ({ ...p, course: v }))}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {showDates && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input type="date" className="w-40" value={filters.startDate || ''} onChange={e => setFilters((p: any) => ({ ...p, startDate: e.target.value }))} />
          <span className="text-muted-foreground">to</span>
          <Input type="date" className="w-40" value={filters.endDate || ''} onChange={e => setFilters((p: any) => ({ ...p, endDate: e.target.value }))} />
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reports Module</h1>
          <p className="text-muted-foreground mt-1">Generate and export various reports for analysis and auditing.</p>
        </div>

        <Tabs defaultValue="enquiry">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="enquiry"><FileText className="w-4 h-4 mr-2" />Enquiry</TabsTrigger>
            <TabsTrigger value="student"><BookOpen className="w-4 h-4 mr-2" />Student</TabsTrigger>
            <TabsTrigger value="due-list"><IndianRupeeIcon className="w-4 h-4 mr-2" />Due List</TabsTrigger>
            <TabsTrigger value="exams"><ClipboardList className="w-4 h-4 mr-2" />Exams</TabsTrigger>
            <TabsTrigger value="inventory"><Search className="w-4 h-4 mr-2" />Inventory</TabsTrigger>
          </TabsList>

          {/* Enquiry Report */}
          <TabsContent value="enquiry" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Enquiry Report</CardTitle>
                    <CardDescription>Detailed list of all enquiries with filtering options.</CardDescription>
                  </div>
                  <Button onClick={() => exportCSV('enquiry_report.csv',
                    ['Name', 'Phone', 'Course', 'Center', 'Source', 'Status', 'Date'],
                    filteredEnquiries.map(e => [e.name, e.phone, e.course_name, e.center_name, e.source || '', e.status || '', e.created_at?.slice(0, 10) || ''])
                  )}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <CenterCourseFilters filters={enquiryFilters} setFilters={setEnquiryFilters} />
              </CardHeader>
              <CardContent>
                {enquiriesLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Center</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEnquiries.length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No enquiries found</TableCell></TableRow>
                        ) : filteredEnquiries.map(e => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell>{e.phone}</TableCell>
                            <TableCell>{e.course_name || '-'}</TableCell>
                            <TableCell><Badge variant="outline">{e.center_name}</Badge></TableCell>
                            <TableCell className="capitalize">{e.source || '-'}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{e.status || 'new'}</Badge></TableCell>
                            <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Report */}
          <TabsContent value="student" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Student Report</CardTitle>
                    <CardDescription>List of all admitted students with their details.</CardDescription>
                  </div>
                  <Button onClick={() => exportCSV('student_report.csv',
                    ['Enrollment No', 'Name', 'Course', 'Center', 'Phone', 'Email', 'Course Fee', 'Fees Pending', 'Status', 'Admission Date'],
                    filteredStudents.map(s => [s.enrollment_no, s.name, s.course_name || '', s.center_name || '', s.phone, s.email || '', String(s.fee_paid || 0), String(s.fee_pending || 0), s.status || '', s.admission_date])
                  )}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <CenterCourseFilters filters={studentFilters} setFilters={setStudentFilters} />
              </CardHeader>
              <CardContent>
                {studentsLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Enrollment No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Center</TableHead>
                          <TableHead>Course Fee</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admission Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                        ) : filteredStudents.map(s => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.enrollment_no}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.course_name || '-'}</TableCell>
                            <TableCell><Badge variant="outline">{s.center_name}</Badge></TableCell>
                            <TableCell className="text-success font-medium">₹{Number(s.fee_paid || 0).toLocaleString()}</TableCell>
                            <TableCell className={Number(s.fee_pending || 0) > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>₹{Number(s.fee_pending || 0).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{s.status || 'active'}</Badge></TableCell>
                            <TableCell>{new Date(s.admission_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Due List */}
          <TabsContent value="due-list" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Due List Report</CardTitle>
                    <CardDescription>Students with pending fee balances across all centers.</CardDescription>
                  </div>
                  <Button onClick={() => exportCSV('due_list_report.csv',
                    ['Enrollment No', 'Name', 'Center', 'Course', 'Course Fee', 'Paid', 'Pending'],
                    dueStudents.map(s => [s.enrollment_no, s.name, s.center_name || '', s.course_name || '', String(Number(s.fee_paid || 0) + Number(s.fee_pending || 0)), String(s.fee_paid || 0), String(s.fee_pending || 0)])
                  )}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={dueFilters.center} onValueChange={v => setDueFilters(p => ({ ...p, center: v }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {centers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Enrollment No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Center</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Total Fee</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dueStudents.length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending dues</TableCell></TableRow>
                        ) : dueStudents.map(s => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.enrollment_no}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell><Badge variant="outline">{s.center_name}</Badge></TableCell>
                            <TableCell>{s.course_name || '-'}</TableCell>
                            <TableCell>₹{(Number(s.fee_paid || 0) + Number(s.fee_pending || 0)).toLocaleString()}</TableCell>
                            <TableCell className="text-success font-medium">₹{Number(s.fee_paid || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-destructive font-medium">₹{Number(s.fee_pending || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Status */}
          <TabsContent value="exams" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Exam Status Report</CardTitle>
                    <CardDescription>Overview of student exam statuses across centers.</CardDescription>
                  </div>
                  <Button onClick={() => exportCSV('exam_report.csv',
                    ['Enrollment No', 'Name', 'Center', 'Course', 'Status', 'Admission Date'],
                    examStudents.map(s => [s.enrollment_no, s.name, s.center_name || '', s.course_name || '', s.status || 'active', s.admission_date])
                  )}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={examFilters.center} onValueChange={v => setExamFilters(p => ({ ...p, center: v }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {centers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    <Select value={examFilters.status} onValueChange={v => setExamFilters(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active (Pending)</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="certified">Certified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Enrollment No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Center</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admission Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examStudents.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                        ) : examStudents.map(s => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.enrollment_no}</Badge></TableCell>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell><Badge variant="outline">{s.center_name}</Badge></TableCell>
                            <TableCell>{s.course_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={`capitalize ${s.status === 'certified' ? 'bg-warning hover:bg-warning/90' : s.status === 'completed' ? 'bg-success hover:bg-success/90' : ''}`} variant={s.status === 'active' ? 'secondary' : 'default'}>
                                {s.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(s.admission_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="mt-6">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inventory Report</CardTitle>
                    <CardDescription>Current stock levels across all centers.</CardDescription>
                  </div>
                  <Button onClick={() => exportCSV('inventory_report.csv',
                    ['Center', 'Item', 'Code', 'Quantity', 'Last Updated'],
                    filteredStocks.map(s => [s.center_name, s.item_name, s.item_code, String(s.quantity), new Date(s.last_updated).toLocaleDateString()])
                  )}><Download className="w-4 h-4 mr-2" />Export to Excel</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Select value={inventoryFilters.center} onValueChange={v => setInventoryFilters(p => ({ ...p, center: v }))}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Center" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {centers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search item..." className="w-48" value={inventoryFilters.search}
                      onChange={e => setInventoryFilters(p => ({ ...p, search: e.target.value }))} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stocksLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Center</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStocks.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No inventory data</TableCell></TableRow>
                        ) : filteredStocks.map(s => (
                          <TableRow key={s.id}>
                            <TableCell><Badge variant="outline">{s.center_name}</Badge></TableCell>
                            <TableCell className="font-medium">{s.item_name}</TableCell>
                            <TableCell>{s.item_code}</TableCell>
                            <TableCell className="font-bold">{s.quantity}</TableCell>
                            <TableCell>{new Date(s.last_updated).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
