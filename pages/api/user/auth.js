// pages/api/authenticate.js

import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN);
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
    try {
      // Retrieve token from cookies
      const token = req.cookies.token;

      if (!token) {
        // If token is not present, user is not authenticated
        console.error('not getting token from request');
        return res.status(401).json({ authenticated: false });
      }

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      if (!userId) {
        // If userId is not present in token, token is invalid
        console.error('user id is invalid');
        return res.status(401).json({ authenticated: false });
      }

      // Check if user exists in the database
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ userid: userId });

      if (!user) {
        // If user does not exist, user is not authenticated
        console.error('user is not available');
        return res.status(401).json({ authenticated: false });
      }

      // User is authenticated
      console.error('api working good');
      return res.status(200).json({ authenticated: true });
    } catch (error) {
      // If token is invalid or expired, user is not authenticated
      console.error('Error verifying token:', error);
      return res.status(401).json({ authenticated: false });
    }
  } else {
    // Method not allowed
    console.error('method not allowed');
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
