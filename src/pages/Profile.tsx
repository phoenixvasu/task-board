import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    setIsLoading(true);
    try {
      updateUser({ name, email, avatar });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-secondary rounded-lg shadow p-8">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">My Profile</h2>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <img
            src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
            alt="Avatar"
            className="w-20 h-20 rounded-full border"
          />
          <input
            type="text"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            placeholder="Avatar URL (optional)"
            className="input w-full dark:bg-darkbg dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input w-full dark:bg-darkbg dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input w-full dark:bg-darkbg dark:text-white"
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default Profile; 