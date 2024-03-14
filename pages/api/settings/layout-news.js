import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Set Access-Control-Allow-Origin header dynamically based on the request origin
  const origin = req.headers.origin;
  const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app'];
  
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
        const {
            category1, category2, category3, category4, category5, category6, category7, category8, category9, category10, category11, category12, category13, category14, category15, category16, category17, category18, category19, category20, category21,
        } = req.body;

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

            // Define the document to insert or update
            const layoutNewsDocument = {
                category1,
                category2,
                category3,
                category4,
                category5,
                category6,
                category7,
                category8,
                category9,
                category10,
                category11,
                category12,
                category13,
                category14,
                category15,
                category16,
                category17,
                category18,
                category19,
                category20,
                category21,
            };

            // Find the existing document
            const existingDocument = await db.collection('layout_news').findOne({});

            // Update or insert based on the existence of the document
            if (existingDocument) {
                await db.collection('layout_news').updateOne({}, { $set: layoutNewsDocument });
            } else {
                await db.collection('layout_news').insertOne(layoutNewsDocument);
            }

            res.status(201).json({ message: 'Layout News Updated successfully' });
        } catch (error) {
            console.error(error);
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            res.status(500).json({ message: 'Server Error' });
        }
    }
    else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
    
}

