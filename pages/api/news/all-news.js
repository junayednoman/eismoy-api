import { connectToDatabase } from '../../../db';
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
      const { page = req.query.page, limit = req.query.limit, sortColumn = req.query.sortColumn, sortOrder = req.query.sortOrder, search = req.query.search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate the number of documents to skip

      // Fetch all user details from the database
      const db = await connectToDatabase();

      let categories;
      let totalCount;

      const query = {};

      if (decodedToken.role === 'reporter') {
        const user = await db.collection('users').findOne({ userid: decodedToken.userId });
        const displayName = user.display_name;

        query.created_by = displayName;
      }

      // Apply search filter for all fields
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const searchFields = ['title', 'category', 'highlight', 'reporter_name', 'publish_status', 'created_by', 'published_by', 'last_modified_by', 'created_datetime', 'published_datetime', 'modified_datetime'];
        query.$or = searchFields.map((field) => ({ [field]: { $regex: searchRegex } }));
      }

      // Fetch categories based on the query and apply sorting
      categories = await db.collection('news')
        .find(query)
        .sort({ created_datetime: -1 }) // Sort by creation date in descending order (latest first)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Count total matching documents for pagination
      totalCount = await db.collection('news').countDocuments(query);

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
