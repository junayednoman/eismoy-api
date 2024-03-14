// pages/api/details.js
import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
      // Allow requests from all subdomains of vercel.app
  const origin = req.headers.origin;
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Origin, X-Requested-With, Content-Type, Accept, X-HTTP-Method-Override'
    );
  
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(200).end(); // Respond with 200 status code for preflight requests
      return;
    }
  if (req.method === 'GET') {
    // Parse token from request cookies
    const token = req.cookies.token;

    try {
      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      // Fetch specific fields of user details from the database based on userid
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ userid: userId }, { projection: { userid: 1, name: 1, email: 1, created_at: 1, updated_at: 1, role: 1, display_name: 1, _id: 0 } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
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
