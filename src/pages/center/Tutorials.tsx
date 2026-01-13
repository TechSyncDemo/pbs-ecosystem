import { useState } from 'react';
import { BookText, Filter, Download, FileText } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTutorials } from '@/hooks/useTutorials';
import { useCourses } from '@/hooks/useCourses';

export default function CenterTutorials() {
  const [courseFilter, setCourseFilter] = useState('all');

  const { data: tutorials = [], isLoading: tutorialsLoading } = useTutorials();
  const { data: courses = [] } = useCourses();

  const filteredTutorials = tutorials.filter(tutorial =>
    courseFilter === 'all' || tutorial.course_id === courseFilter
  );

  return (
    <CenterLayout>
      <div className="space-y-8">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Tutorials & Resources</h1>
            <p className="text-muted-foreground mt-1">Download course materials and official guides.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by course..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tutorials Grid */}
        {tutorialsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-card">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredTutorials.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tutorials available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => (
              <Card key={tutorial.id} className="flex flex-col border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" /> 
                    {tutorial.title}
                  </CardTitle>
                  <CardDescription>{tutorial.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Badge variant="secondary">{tutorial.course_name || 'General'}</Badge>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Uploaded: {new Date(tutorial.created_at).toLocaleDateString()}
                  </p>
                  {tutorial.file_url && (
                    <Button size="sm" asChild>
                      <a href={tutorial.file_url} download>
                        <Download className="w-4 h-4 mr-2" />Download
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CenterLayout>
  );
}
