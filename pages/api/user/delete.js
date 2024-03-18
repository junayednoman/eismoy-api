import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Set Access-Control-Allow-Origin header dynamically based on the request origin
  const origin = req.headers.origin;
  const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app', 'https://eimattro.com', 'http://localhost:3000'];
  
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

    if (req.method === 'POST') { // Change method check to POST
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

            // Check if the user has the necessary role to delete users
            if (userRole !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Extract the userid from the request body
            const { userId } = req.body; // Assuming the user ID is sent in the request body

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const db = await connectToDatabase();

            // Check if the user exists
            const existingUser = await db.collection('users').findOne({ userid: userId });

            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Delete the user
            await db.collection('users').deleteOne({ userid: userId });

            res.status(200).json({ message: 'User deleted successfully' });
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
