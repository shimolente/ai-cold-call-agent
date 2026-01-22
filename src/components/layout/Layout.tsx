import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/campaigns')) return 'campaigns';
    if (path.startsWith('/contacts')) return 'contacts';
    if (path.startsWith('/usps')) return 'usps';
    if (path.startsWith('/overview')) return 'overview';
    return 'overview';
  };

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={getCurrentPage()} onNavigate={handleNavigate} />
      <main className="flex-1 ml-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;