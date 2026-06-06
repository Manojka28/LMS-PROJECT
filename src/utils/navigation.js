export const getDashboardPath = (role) => {
  if (!role) return '/login';
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'instructor':
      return '/instructor/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/login';
  }
};
