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

    if (req.method === 'POST') { // Change method check to POST
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

            // Check if the user has the necessary role to delete users
            if (userRole !== 'admin' && userRole !== 'editor') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Extract the userid from the request body
            const { cat_id } = req.body; // Assuming the user ID is sent in the request body

            if (!cat_id) {
                return res.status(400).json({ message: 'Something is wrong' });
            }

            const db = await connectToDatabase();

            // Check if the user exists
            const existingUser = await db.collection('news_categories').findOne({ cat_id: cat_id });

            if (!existingUser) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Delete the user
            await db.collection('news_categories').deleteOne({ cat_id: cat_id });

            res.status(200).json({ message: 'Category deleted successfully' });
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
