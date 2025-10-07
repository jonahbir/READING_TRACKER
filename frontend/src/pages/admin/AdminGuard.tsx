import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { checkAdmin } from '../../api/api';

// Minimal inline call to GET /analytics to verify admin role. If 401/403 => redirect.
const AdminGuard: React.FC = () => {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      const ok = await checkAdmin();
      setAllowed(ok);
    };
    run();
  }, []);

  if (allowed === null) {
    return <div className="text-white">Checking permissions…</div>;
  }
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default AdminGuard;


