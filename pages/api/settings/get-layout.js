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

            // Find the layout news document
            const layoutNewsDocument = await db.collection('layout_news').findOne({}, { projection: { _id: 0 } });

            // If the document is not found, send an empty object instead of 404
            // if (!layoutNewsDocument) {
            //     return res.status(200).json({});
            // }

            res.status(200).json(layoutNewsDocument);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
    
}

