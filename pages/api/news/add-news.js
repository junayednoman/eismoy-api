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
    const { title, description, featured_image, category, reporter_name, created_by, published_by, last_modified_by, publish_status, tags, meta_title, meta_description, meta_image, focus_keyword } = req.body;

    // Check if required fields are empty
    if (!title) {
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
      if (userRole !== 'admin' && userRole !== 'editor' && userRole !== 'reporter') {
        return res.status(403).json({ message: 'Forbidden' });
        }

        // Generate timestamps
        const currentDateTime = new Date();
        const createdDatetime = currentDateTime;
        let publishedDatetime = null; // Initialize to null
        const modifiedDatetime = null; // Initially, there is no modification

        // If the publish_status is "published", set published_datetime to the current date and time
        if (publish_status === "Published") {
            publishedDatetime = currentDateTime;
        }

      // Create a new news item document
        const newNewsItem = {
            title,
            description,
            featured_image,
            category,
            reporter_name,
            created_by,
            published_by,
            last_modified_by,
            publish_status,
            tags,
            meta_title,
            meta_description,
            meta_image,
            focus_keyword,
            created_datetime: createdDatetime,
            published_datetime: publishedDatetime,
            modified_datetime: modifiedDatetime
        };

        const db = await connectToDatabase();

        // Insert the new news item into the MongoDB collection
        await db.collection('news').insertOne(newNewsItem);

      res.status(201).json({ message: 'News created successfully' });
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
