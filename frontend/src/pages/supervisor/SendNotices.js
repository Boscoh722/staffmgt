import React from 'react';
import { useNavigate } from 'react-router-dom';

// Send Notices feature removed. Redirect to supervisor dashboard.
const SendNotices = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/supervisor');
  }, [navigate]);
  return null;
};

export default SendNotices;