import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useCourseTopics,
  useCreateCourseTopic,
  useUpdateCourseTopic,
  useDeleteCourseTopic,
} from '@/hooks/useCourseTopics';

interface CourseSyllabusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

export function CourseSyllabusDialog({ open, onOpenChange, courseId, courseName }: CourseSyllabusDialogProps) {
  const { data: topics = [], isLoading } = useCourseTopics(courseId);
  const createTopic = useCreateCourseTopic();
  const updateTopic = useUpdateCourseTopic();
  const deleteTopic = useDeleteCourseTopic();

  const [newTopic, setNewTopic] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newTopic.trim()) return;
    createTopic.mutate({
      course_id: courseId,
      topic_name: newTopic.trim(),
      sort_order: topics.length,
    }, {
      onSuccess: () => { setNewTopic(''); },
    });
  };

  const handleEdit = (id: string) => {
    if (!editName.trim()) return;
    updateTopic.mutate({ id, topic_name: editName.trim() }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const startEdit = (topic: any) => {
    setEditingId(topic.id);
    setEditName(topic.topic_name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Syllabus</DialogTitle>
          <DialogDescription>Content topics for marksheet: {courseName}</DialogDescription>
        </DialogHeader>

        {/* Add new topic */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Topic / Subject Name</Label>
            <Input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Enter topic name"
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <Button size="icon" onClick={handleAdd} disabled={createTopic.isPending || !newTopic.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Topics list */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No topics added yet. Add subjects/topics that will appear on the marksheet.</div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Topic / Subject</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((topic, idx) => (
                  <TableRow key={topic.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      {editingId === topic.id ? (
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8"
                          onKeyDown={e => e.key === 'Enter' && handleEdit(topic.id)} autoFocus />
                      ) : (
                        <span className="cursor-pointer hover:text-primary" onClick={() => startEdit(topic)}>
                          {topic.topic_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === topic.id ? (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(topic.id)}
                            disabled={updateTopic.isPending}>Save</Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                            onClick={() => deleteTopic.mutate({ id: topic.id, courseId })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
