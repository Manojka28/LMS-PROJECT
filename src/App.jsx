import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CreateCoursePage from './pages/CreateCoursePage';
import EditCoursePage from './pages/EditCoursePage';
import MyCoursesPage from './pages/MyCoursesPage';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CoursePlayerPage from './pages/CoursePlayerPage';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import VerificationPortal from './pages/VerificationPortal';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import PlacementDashboard from './pages/PlacementDashboard';
import InterviewCenter from './pages/InterviewCenter';
import CourseIntelligenceCenter from './pages/CourseIntelligenceCenter';
import CheckoutFlow from './pages/CheckoutFlow';
import InstructorEarnings from './pages/InstructorEarnings';
import AdminFinanceCenter from './pages/AdminFinanceCenter';
import AICoachPage from './pages/AICoachPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailsPage />} />
            <Route path="/verify-certificate" element={<VerificationPortal />} />
            <Route path="/verify-certificate/:token" element={<VerificationPortal />} />
            <Route
              path="/course/:id/learn"
              element={
                <ProtectedRoute roles={['student', 'admin', 'instructor']}>
                  <CoursePlayerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-courses"
              element={
                <ProtectedRoute roles={['student']}>
                  <MyCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute roles={['student']}>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/create-course"
              element={
                <ProtectedRoute roles={['instructor', 'admin']}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/edit-course/:id"
              element={
                <ProtectedRoute roles={['instructor', 'admin']}>
                  <EditCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute roles={['instructor', 'admin']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute roles={['student', 'admin', 'instructor']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/resume"
              element={
                <ProtectedRoute roles={['student']}>
                  <ResumeBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/roadmap"
              element={
                <ProtectedRoute roles={['student']}>
                  <CareerRoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/placement"
              element={
                <ProtectedRoute roles={['student']}>
                  <PlacementDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/interview/:sessionId"
              element={
                <ProtectedRoute roles={['student']}>
                  <InterviewCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/ai-coach"
              element={
                <ProtectedRoute roles={['student']}>
                  <AICoachPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/course-intelligence/:courseId"
              element={
                <ProtectedRoute roles={['instructor']}>
                  <CourseIntelligenceCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/checkout"
              element={
                <ProtectedRoute roles={['student']}>
                  <CheckoutFlow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/earnings"
              element={
                <ProtectedRoute roles={['instructor']}>
                  <InstructorEarnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/finance"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminFinanceCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
