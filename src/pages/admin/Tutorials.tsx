import { useState, useRef } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, BookText, Upload, ExternalLink, FileText } from 'lucide-react';
import { useTutorials, useCreateTutorial, useUpdateTutorial, useDeleteTutorial, TutorialWithDetails } from '@/hooks/useTutorials';
import { useAuthorizations } from '@/hooks/useAuthorizations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminTutorials() {
  const { data: tutorials = [], isLoading } = useTutorials();
  const { data: authorizations = [] } = useAuthorizations();
  const createTutorial = useCreateTutorial();
  const updateTutorial = useUpdateTutorial();
  const deleteTutorial = useDeleteTutorial();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TutorialWithDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedAuthIds, setSelectedAuthIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setLink('');
    setSelectedAuthIds([]);
    setFileUrl('');
    setFileName('');
    setFileSize(null);
    setDialogOpen(true);
  };

  const openEdit = (t: TutorialWithDetails) => {
    setEditing(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setLink(t.link || '');
    setSelectedAuthIds(t.authorization_ids || []);
    setFileUrl(t.file_url || '');
    setFileName(t.file_name || '');
    setFileSize(t.file_size);
    setDialogOpen(true);
  };

  const toggleAuth = (id: string) => {
    setSelectedAuthIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('tutorials').upload(path, file);
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('tutorials').getPublicUrl(path);
    setFileUrl(urlData.publicUrl);
    setFileName(file.name);
    setFileSize(file.size);
    setUploading(false);
    toast.success('File uploaded');
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (selectedAuthIds.length === 0) { toast.error('Select at least one authorization'); return; }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_size: fileSize,
      authorization_ids: selectedAuthIds,
    };

    if (editing) {
      await updateTutorial.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createTutorial.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tutorial?')) return;
    await deleteTutorial.mutateAsync(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Tutorials</h1>
            <p className="text-muted-foreground mt-1">Manage tutorials & resources for centers</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Tutorial</Button>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : tutorials.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No tutorials yet. Add one to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Authorizations</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorials.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.title}</p>
                          {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(t.authorization_names || []).map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.link ? (
                          <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                            <ExternalLink className="w-3 h-3" />Link
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {t.file_url ? (
                          <a href={t.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                            <FileText className="w-3 h-3" />{t.file_name || 'PDF'}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Tutorial' : 'Add New Tutorial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tutorial title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={3} />
            </div>
            <div>
              <Label>Authorizations *</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1">
                {authorizations.filter(a => a.status === 'active').map(auth => (
                  <div key={auth.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`auth-${auth.id}`}
                      checked={selectedAuthIds.includes(auth.id)}
                      onCheckedChange={() => toggleAuth(auth.id)}
                    />
                    <label htmlFor={`auth-${auth.id}`} className="text-sm cursor-pointer">{auth.name}</label>
                  </div>
                ))}
                {authorizations.filter(a => a.status === 'active').length === 0 && (
                  <p className="text-sm text-muted-foreground">No active authorizations found.</p>
                )}
              </div>
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>PDF Document (optional)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading...' : 'Upload PDF'}
                </Button>
                {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createTutorial.isPending || updateTutorial.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
