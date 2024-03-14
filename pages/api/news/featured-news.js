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
        const { newsId1, newsId2, newsId3, newsId4, newsId5, newsId6, newsId7, newsId8, newsId9, newsId10, newsId11, newsId12 } = req.body;

        // Check if required fields are empty
        if (!newsId1 || !newsId2 || !newsId3 || !newsId4 || !newsId5 || !newsId6 || !newsId7 || !newsId8 || !newsId9 || !newsId10 || !newsId11 || !newsId12) {
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

            const featuredDoc = {
                newsId1,
                newsId2,
                newsId3,
                newsId4,
                newsId5,
                newsId6,
                newsId7,
                newsId8,
                newsId9,
                newsId10,
                newsId11,
                newsId12,
            };


            // Find the existing document
            const existingDocument = await db.collection('featured_news').findOne({});

            // Update or insert based on the existence of the document
            if (existingDocument) {
                await db.collection('featured_news').updateOne({}, { $set: featuredDoc });
            } else {
                await db.collection('featured_news').insertOne(featuredDoc);
            }

            res.status(201).json({ message: 'Featured News Updated successfully' });
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
