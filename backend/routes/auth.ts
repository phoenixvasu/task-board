import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Register
interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

router.post('/register', asyncHandler(async (req: express.Request<{}, {}, RegisterRequestBody>, res: express.Response) => {
  const { name, email, password, avatar } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use.' });
  const user = await User.create({ name, email, password, avatar });
  const safeUser: SafeUser = { id: String(user._id), name: user.name, email: user.email, avatar: user.avatar };
  res.status(201).json({ user: safeUser });
}));

// Login
interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponseUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface LoginResponseBody {
  token: string;
  user: LoginResponseUser;
}

router.post(
  '/login',
  asyncHandler(
    async (
      req: express.Request<{}, {}, LoginRequestBody>,
      res: express.Response<LoginResponseBody | { message: string }>
    ) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }
      const user = await User.findOne({ email }).select('+password');
      if (!user) return res.status(400).json({ message: 'Email does not exist.' });
      const match = await user.comparePassword(password);
      if (!match) return res.status(400).json({ message: 'Incorrect password.' });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
      const safeUser: LoginResponseUser = { id: String(user._id), name: user.name, email: user.email, avatar: user.avatar };
      res.json({ token, user: safeUser });
    }
  )
);

// Profile (protected)
interface ProfileRequest extends express.Request {
  user?: {
    id: string;
  };
}

interface ProfileResponseUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ProfileResponseBody {
  user: ProfileResponseUser;
}

router.get(
  '/profile',
  auth,
  asyncHandler(
    async (
      req: ProfileRequest,
      res: express.Response<ProfileResponseBody | { message: string }>
    ) => {
      const user = await User.findById(req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      const safeUser: ProfileResponseUser = { id: String(user._id), name: user.name, email: user.email, avatar: user.avatar };
      res.json({ user: safeUser });
    }
  )
);

export default router;