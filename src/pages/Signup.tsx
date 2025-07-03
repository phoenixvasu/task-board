import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trello, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    const res = await register(name, email, password);
    if (res.success) {
      toast.success('Account created! Welcome!');
      navigate('/');
    } else {
      if (res.error?.includes('Name, email, and password are required')) {
        toast.error('Please fill in all fields');
      } else if (res.error?.includes('Invalid email format')) {
        toast.error('Invalid email format.');
      } else if (res.error?.includes('Password must be at least')) {
        toast.error('Password must be at least 6 characters.');
      } else if (res.error?.includes('Email already in use')) {
        toast.error('Email already in use.');
      } else {
        toast.error(res.error || 'Signup failed');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trello size={32} className="text-primary" />
              <span className="text-2xl font-bold text-gray-900">TaskBoard</span>
            </div>
            <p className="text-gray-600">Create your account</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup; 