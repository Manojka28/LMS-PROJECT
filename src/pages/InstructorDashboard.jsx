import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import AnalyticsCards from '../components/AnalyticsCards';
import InstructorCourseTable from '../components/InstructorCourseTable';
import MagneticButton from '../components/MagneticButton';
import { useAuth } from '../context/AuthContext';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const data = await api.get('/instructor/dashboard/analytics');
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/instructor/courses`, {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filter
      });
      if (data.success) {
        setCourses(data.courses);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses();
    }, 300); // debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [fetchCourses]);

  const handlePublishToggle = async (courseId, newStatus) => {
    try {
      const action = newStatus ? 'publish' : 'unpublish';
      await api.put(`/course/${courseId}/${action}`);
      fetchCourses(); // refresh table
      fetchAnalytics(); // refresh analytics
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await api.delete(`/course/${courseId}`);
      fetchCourses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Instructor Dashboard</h1>
          <p className="muted" style={{ margin: '5px 0 0 0' }}>Welcome back, {user?.name}</p>
        </div>
        <Link to="/instructor/create-course">
          <MagneticButton className="green-btn ripple-btn">+ Create New Course</MagneticButton>
        </Link>
      </div>

      <AnalyticsCards analytics={analytics} />

      <InstructorCourseTable
        courses={courses}
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setCurrentPage}
        onSearch={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        onFilterChange={(f) => {
          setFilter(f);
          setCurrentPage(1);
        }}
        onPublishToggle={handlePublishToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
