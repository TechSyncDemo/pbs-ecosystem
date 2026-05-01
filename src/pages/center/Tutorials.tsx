import { useState, useMemo } from 'react';
import { FileText, Download, ExternalLink, BookText, Folder } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCenterTutorials } from '@/hooks/useTutorials';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CenterTutorials() {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get center's authorization IDs from center_courses
  const { data: centerAuthIds = [] } = useQuery({
    queryKey: ['center-auth-ids', user?.centerId],
    enabled: !!user?.centerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_courses')
        .select('course_id, courses(authorization_id)')
        .eq('center_id', user!.centerId!)
        .eq('status', 'active');
      if (error) throw error;
      const authIds = [...new Set(
        (data || [])
          .map((cc: any) => cc.courses?.authorization_id)
          .filter(Boolean)
      )];
      return authIds as string[];
    },
  });

  const { data: tutorials = [], isLoading } = useCenterTutorials(centerAuthIds);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tutorials.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set).sort();
  }, [tutorials]);

  const filtered = categoryFilter === 'all'
    ? tutorials
    : categoryFilter === 'uncategorized'
      ? tutorials.filter(t => !t.category)
      : tutorials.filter(t => t.category === categoryFilter);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(t => {
      const key = t.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, [] as any);
      (map.get(key) as any).push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <CenterLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Tutorials & Resources</h1>
            <p className="text-muted-foreground mt-1">Download course materials and official guides.</p>
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-card">
                <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
                <CardContent><Skeleton className="h-6 w-1/2" /></CardContent>
                <CardFooter><Skeleton className="h-8 w-full" /></CardFooter>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tutorials available for your authorizations yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {grouped.map(([cat, items]) => (
              <section key={cat} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-heading font-semibold text-foreground">{cat}</h2>
                  <Badge variant="secondary" className="ml-1">{items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(tutorial => (
                    <Card key={tutorial.id} className="flex flex-col border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    {tutorial.title}
                  </CardTitle>
                  {tutorial.description && <CardDescription>{tutorial.description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex flex-wrap gap-1">
                    {tutorial.category && <Badge variant="outline">{tutorial.category}</Badge>}
                    {(tutorial.authorization_names || []).map((name, i) => (
                      <Badge key={i} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(tutorial.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {tutorial.link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={tutorial.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />Link
                        </a>
                      </Button>
                    )}
                    {tutorial.file_url && (
                      <Button size="sm" asChild>
                        <a href={tutorial.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-1" />PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </CenterLayout>
  );
}
