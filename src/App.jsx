import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './components/common/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumLoadingScreen from './components/common/PremiumLoadingScreen';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DashboardPlaceholder = lazy(() => import('./pages/DashboardPlaceholder'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetailsPage = lazy(() => import('./pages/CourseDetailsPage'));
const CreateCoursePage = lazy(() => import('./pages/CreateCoursePage'));
const EditCoursePage = lazy(() => import('./pages/EditCoursePage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CoursePlayerPage = lazy(() => import('./pages/CoursePlayerPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const VerificationPortal = lazy(() => import('./pages/VerificationPortal'));
const CareerRoadmapPage = lazy(() => import('./pages/CareerRoadmapPage'));
const PlacementDashboard = lazy(() => import('./pages/PlacementDashboard'));
const InterviewCenter = lazy(() => import('./pages/InterviewCenter'));
const CourseIntelligenceCenter = lazy(() => import('./pages/CourseIntelligenceCenter'));
const CheckoutFlow = lazy(() => import('./pages/CheckoutFlow'));
const InstructorEarnings = lazy(() => import('./pages/InstructorEarnings'));
const AdminFinanceCenter = lazy(() => import('./pages/AdminFinanceCenter'));
const AICoachPage = lazy(() => import('./pages/AICoachPage'));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Suspense fallback={<PremiumLoadingScreen />}>
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
              </Suspense>
            </BrowserRouter>
          </WishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
