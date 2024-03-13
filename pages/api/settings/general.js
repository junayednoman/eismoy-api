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
        const {
            site_name,
            logo_image,
            seo_title,
            meta_description,
            meta_image,
            news_scroll_status,
            event_news_status,
        } = req.body;

        // Check if required fields are empty
        if (!site_name) {
            return res.status(400).json({ message: 'Site title is required' });
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

            // Define the document to insert or update
            const generalSettingsDocument = {
                site_name,
                logo_image,
                seo_title,
                meta_description,
                meta_image,
                news_scroll_status,
                event_news_status
            };

            // Find the existing document
            const existingDocument = await db.collection('general_settings').findOne({});

            // Update or insert based on the existence of the document
            if (existingDocument) {
                await db.collection('general_settings').updateOne({}, { $set: generalSettingsDocument });
            } else {
                await db.collection('general_settings').insertOne(generalSettingsDocument);
            }

            res.status(201).json({ message: 'General Settings Updated successfully' });
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
