import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCenters from "./pages/admin/Centers";
import AdminCourses from "./pages/admin/Courses";
import AdminAuthorizations from "./pages/admin/Authorizations";
import AdminStudents from "./pages/admin/Students";
import AdminCoordinators from "./pages/admin/Coordinators";
import AdminSupport from "./pages/admin/Support";
import AdminOrders from "./pages/admin/Orders";
import AdminResults from "./pages/admin/Results";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

// Center Pages
import CenterDashboard from "./pages/center/Dashboard";
import CenterEnquiries from "./pages/center/Enquiries";
import CenterStudents from "./pages/center/Students";
import CenterStock from "./pages/center/Stock";
import CenterOrders from "./pages/center/Orders";
import CenterProfile from "./pages/center/Profile";
import CenterSupport from "./pages/center/Support";
import CenterTutorials from "./pages/center/Tutorials";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Super Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/centers" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminCenters />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminCourses />
              </ProtectedRoute>
            } />
            <Route path="/admin/authorizations" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminAuthorizations />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/support" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminSupport />
              </ProtectedRoute>
            } />
            <Route path="/admin/coordinators" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminCoordinators />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/results" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminResults />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />
            
            {/* Center Admin Routes */}
            <Route path="/center" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/center/enquiries" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterEnquiries />
              </ProtectedRoute>
            } />
            <Route path="/center/profile" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterProfile />
              </ProtectedRoute>
            } />
            <Route path="/center/students" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterStudents />
              </ProtectedRoute>
            } />
            <Route path="/center/stock" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterStock />
              </ProtectedRoute>
            } />
            <Route path="/center/orders" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterOrders />
              </ProtectedRoute>
            } />
            <Route path="/center/tutorials" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterTutorials />
              </ProtectedRoute>
            } />
            <Route path="/center/support" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterSupport />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
