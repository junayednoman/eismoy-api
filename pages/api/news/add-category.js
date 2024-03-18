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

  if (req.method === 'POST') {
    const { categoryName, slug, parent, metaTitle, metaDescription, focusKeyword } = req.body;

    // Check if required fields are empty
    if (!categoryName || !slug || !metaTitle || !metaDescription || !focusKeyword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Parse token from request cookies
      const token = req.cookies.token;

      // Parse token from request query to test in postman
      //const token = req.query.token;

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Extract user's role
      const userRole = decodedToken.role;

      // Check if user role is not admin or editor
      if (userRole !== 'admin' && userRole !== 'editor') {
        return res.status(403).json({ message: 'Forbidden' });
        }

      const db = await connectToDatabase();

      // Get the latest user document to determine the next userid
      const latesCat = await db.collection('news_categories').find().sort({ cat_id: -1 }).limit(1).toArray();
      let nextCatId = 1;

      if (latesCat.length > 0) {
        nextCatId = latesCat[0].cat_id + 1;
      }

      // Check if user exists
      const existingCat = await db.collection('news_categories').findOne({ categoryName });

      if (existingCat) {
        return res.status(400).json({ message: 'Category already exists' });
      }

      // Create category
      await db.collection('news_categories').insertOne({
        cat_id: nextCatId,
        categoryName,
        slug,
        parent: parent || null, // Set parent to null if it's empty
        news_count: 0, 
        metaTitle,
        metaDescription,
        focusKeyword
    });

      res.status(201).json({ message: 'Category created successfully' });
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
