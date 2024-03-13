import { connectToDatabase } from '../../../db';

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
      const { category, limit, skipItem, skipNews } = req.query;


 
      
      // Fetch all news from the database based on the provided parameters
      const db = await connectToDatabase();

      let query = {};
      
      // Apply category filter if provided
      if (category) {
        const categoryRegex = new RegExp(category, 'i');
        query.category = { $regex: categoryRegex };
      }
      
      // Apply skip value if provided
      let skip = 0;
      if (skipItem && !isNaN(parseFloat(skipItem))) {
        skip = Math.max(0, parseInt(skipItem)); // Ensure skip value is non-negative
      }

      // Apply news ID filter to skip if provided
      if (skipNews) {
        const skipNewsIds = skipNews.split(',').map(id => id.trim());
        query._id = { $nin: skipNewsIds }; // Exclude news with provided IDs
      }

      // Fetch news based on the query
      let news;
      if (limit) {
        news = await db.collection('news')
          .find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();
      } else {
        news = await db.collection('news')
          .find(query)
          .skip(skip)
          .toArray();
      }

      res.status(200).json(news);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
