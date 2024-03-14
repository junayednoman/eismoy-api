import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

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

    if (req.method === 'POST') {
        
        const { ad_name, image, link, status } = req.body;

        const adDoc = {
            ad_name,
            image,
            link,
            status
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

            // Check if user role is not admin or editor
            if (userRole !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            const db = await connectToDatabase();

            // Find the existing document
            const existingDocument = await db.collection('ads').findOne({ad_name: ad_name});

            // Update or insert based on the existence of the document
            if (existingDocument) {
                await db.collection('ads').updateOne({ad_name: ad_name}, { $set: adDoc });
            } else {
                await db.collection('ads').insertOne(adDoc);
            }

            res.status(201).json({ message: 'Ad Updated successfully' });
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
