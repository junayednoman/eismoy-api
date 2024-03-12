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
    // Parse token from request cookies
    const token = req.cookies.token;

    try {
      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user role is not admin, editor, or reporter
      if (decodedToken.role !== 'admin' && decodedToken.role !== 'editor' && decodedToken.role !== 'reporter') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Fetch pagination parameters from query string
      const { page = req.query.page, limit = req.query.limit } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate the number of documents to skip

      // Fetch all user details from the database
      const db = await connectToDatabase();

      let categories;
      let totalCount;

      if (decodedToken.role === 'reporter') {
        const user = await db.collection('users').findOne({ userid: decodedToken.userId });
        const displayName = user.display_name;

        categories = await db.collection('news')
          .find({ created_by: displayName })
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        // Count only the reporter's news items
        totalCount = await db.collection('news').countDocuments({ created_by: displayName });
      } else {
        categories = await db.collection('news')
          .find({})
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        // Count all news items for admin and editor
        totalCount = await db.collection('news').countDocuments();
      }

      res.status(200).json({ categories, totalCount });
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
