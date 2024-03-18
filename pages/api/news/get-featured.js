import { connectToDatabase } from '../../../db';

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

    if (req.method === 'GET') {
        try {
            const db = await connectToDatabase();

            // Find the featured news document
            const featuredNewsDocument = await db.collection('featured_news').findOne({}, { projection: { _id: 0 } });

            res.status(200).json(featuredNewsDocument);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
