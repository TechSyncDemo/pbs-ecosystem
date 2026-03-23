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
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
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
  const [newMarks, setNewMarks] = useState('100');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMarks, setEditMarks] = useState('');

  const handleAdd = () => {
    if (!newTopic.trim()) return;
    createTopic.mutate({
      course_id: courseId,
      topic_name: newTopic.trim(),
      max_marks: parseInt(newMarks) || 100,
      sort_order: topics.length,
    }, {
      onSuccess: () => { setNewTopic(''); setNewMarks('100'); },
    });
  };

  const handleEdit = (id: string) => {
    if (!editName.trim()) return;
    updateTopic.mutate({ id, topic_name: editName.trim(), max_marks: parseInt(editMarks) || 100 }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const startEdit = (topic: any) => {
    setEditingId(topic.id);
    setEditName(topic.topic_name);
    setEditMarks(String(topic.max_marks || 100));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Syllabus</DialogTitle>
          <DialogDescription>Topics for: {courseName}</DialogDescription>
        </DialogHeader>

        {/* Add new topic */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Topic Name</Label>
            <Input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Enter topic name"
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div className="w-24 space-y-1">
            <Label className="text-xs">Max Marks</Label>
            <Input type="number" value={newMarks} onChange={e => setNewMarks(e.target.value)} min={0} />
          </div>
          <Button size="icon" onClick={handleAdd} disabled={createTopic.isPending || !newTopic.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Topics list */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No topics added yet.</div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-24">Max Marks</TableHead>
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
                      {editingId === topic.id ? (
                        <Input type="number" value={editMarks} onChange={e => setEditMarks(e.target.value)}
                          className="h-8 w-20" onKeyDown={e => e.key === 'Enter' && handleEdit(topic.id)} />
                      ) : (
                        <span className="cursor-pointer hover:text-primary" onClick={() => startEdit(topic)}>
                          {topic.max_marks}
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
