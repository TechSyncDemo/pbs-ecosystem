import { useState } from 'react';
import { BookText, Filter, Download, FileText } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for tutorials
const mockTutorials = [
  {
    id: 1,
    title: 'Introduction to Digital Marketing',
    description: 'A comprehensive guide covering the basics of SEO, SEM, and social media marketing.',
    course: 'Diploma in Digital Marketing',
    fileUrl: '/tutorials/digital-marketing-intro.pdf',
    uploadDate: '2024-05-15',
  },
  {
    id: 2,
    title: 'Advanced Tally Prime Features',
    description: 'Explore advanced features like payroll management, GST compliance, and inventory control.',
    course: 'Certificate in Tally Prime',
    fileUrl: '/tutorials/tally-advanced.pdf',
    uploadDate: '2024-05-10',
  },
  {
    id: 3,
    title: 'React Hooks Deep Dive',
    description: 'Master React Hooks including useState, useEffect, useContext, and custom hooks.',
    course: 'Web Development Fundamentals',
    fileUrl: '/tutorials/react-hooks.pdf',
    uploadDate: '2024-05-05',
  },
  {
    id: 4,
    title: 'Python for Data Science',
    description: 'Learn how to use Python with libraries like Pandas, NumPy, and Matplotlib for data analysis.',
    course: 'Certificate in Python Programming',
    fileUrl: '/tutorials/python-data-science.pdf',
    uploadDate: '2024-04-28',
  },
  {
    id: 5,
    title: 'On-Page SEO Checklist',
    description: 'A handy checklist for optimizing your web pages for search engines.',
    course: 'Diploma in Digital Marketing',
    fileUrl: '/tutorials/seo-checklist.pdf',
    uploadDate: '2024-04-20',
  },
];

const courses = [
  'All Courses',
  'Diploma in Digital Marketing',
  'Certificate in Tally Prime',
  'Web Development Fundamentals',
  'Certificate in Python Programming',
];

export default function CenterTutorials() {
  const [courseFilter, setCourseFilter] = useState('All Courses');

  const filteredTutorials = mockTutorials.filter(tutorial =>
    courseFilter === 'All Courses' || tutorial.course === courseFilter
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
                {courses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map(tutorial => (
            <Card key={tutorial.id} className="flex flex-col border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-start gap-3"><FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" /> {tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge variant="secondary">{tutorial.course}</Badge>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Uploaded: {new Date(tutorial.uploadDate).toLocaleDateString()}</p>
                <Button size="sm" asChild>
                  <a href={tutorial.fileUrl} download><Download className="w-4 h-4 mr-2" />Download</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </CenterLayout>
  );
}