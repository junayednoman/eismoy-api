import { connectToDatabase } from '../../../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Set Access-Control-Allow-Origin header dynamically based on the request origin
  const origin = req.headers.origin;
  const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app', 'https://ei-matro-dusky.vercel.app', 'http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // If the origin is not allowed, return a CORS error response
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(200).end(); // Respond with 200 status code for preflight requests
      return;
    }

  if (req.method === 'POST') {
    const { userid, name, email, password, role, display_name } = req.body;

    // Check if required fields are empty
    if (!userid || !name || !email || !role || !display_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Parse token from request cookies
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Extract user's role
      const userRole = decodedToken.role;

      // Check if the user has the necessary role to update users
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const db = await connectToDatabase();

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ userid: userid });

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Construct update data
      const updateData = {
        name,
        email,
        role,
        display_name,
        updated_at: new Date()
      };

      // Update password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      // Update user
      await db.collection('users').updateOne(
        { userid: userid },
        {
          $set: updateData
        }
      );

      res.status(200).json({ message: 'User updated successfully' });
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
