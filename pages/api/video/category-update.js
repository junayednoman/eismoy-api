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

  if (req.method === 'POST') {
    const { cat_id, categoryName, slug, parent, metaTitle, metaDescription, focusKeyword } = req.body;

    // Check if required fields are empty
    if (!cat_id) {
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
      if (userRole !== 'admin' && userRole !== 'editor') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const db = await connectToDatabase();

      // Construct update data
      const updateData = {
        categoryName,
        slug,
        parent,
        metaTitle,
        metaDescription,
        focusKeyword,

      };

      // Update user
      await db.collection('gallery_categories').updateOne(
        { cat_id: cat_id },
        {
          $set: updateData
        }
      );

      res.status(200).json({ message: 'Category updated successfully' });
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
