import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const auth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    
    // Convert the ID to ObjectId if it's valid, otherwise use as string
    let userId: string;
    try {
      if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        userId = new mongoose.Types.ObjectId(decoded.id).toString();
      } else {
        userId = decoded.id;
      }
    } catch (error) {
      userId = decoded.id;
    }
    
    (req as any).user = { id: userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

export default auth;
