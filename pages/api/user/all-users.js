// pages/api/all-users.js
import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  
  if (req.method === 'GET') {
    // Parse token from request cookies
    const token = req.cookies.token;

    try {
      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user role is admin
      if (decodedToken.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Fetch all user details from the database
      const db = await connectToDatabase();
      const users = await db.collection('users').find({}, { projection: { _id: 0, password: 0, forget_password_token: 0 } }).toArray(); // Exclude _id, password, and forget_password_token fields
      
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
