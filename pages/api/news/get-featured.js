import { connectToDatabase } from '../../../db';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
      // Allow requests from all subdomains of vercel.app
  const origin = req.headers.origin;
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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
