import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api';
import Button from '../components/ui/Button';
import { CheckCircle, XCircle, Loader, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const InviteAccept: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token: authToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardInfo, setBoardInfo] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', { state: { returnUrl: `/invite/${token}` } });
      return;
    }

    handleInviteAccept();
  }, [token, isAuthenticated, navigate]);

  const handleInviteAccept = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/sharing/invite/accept', { token }, authToken);
      
      if (response.boardId) {
        setIsSuccess(true);
        setBoardInfo(response);
        toast.success('Successfully joined board!');
        
        // Redirect to the board after a short delay
        setTimeout(() => {
          navigate(`/board/${response.boardId}`);
        }, 2000);
      } else {
        setError('Failed to join board');
      }
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      setError(error.message || 'Failed to accept invite');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="animate-spin mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Processing Invite...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we add you to the board.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invite Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button variant="primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to the Board!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have successfully joined the board. You will be redirected shortly.
          </p>
          {boardInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Board Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Users size={14} className="mr-2" />
                  <span>Role: {boardInfo.role}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-2" />
                  <span>Joined: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          <Button variant="primary" onClick={() => navigate(`/board/${boardInfo?.boardId}`)}>
            Go to Board
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAccept; 