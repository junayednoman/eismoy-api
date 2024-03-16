import { connectToDatabase } from '../../../db';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
    // Set Access-Control-Allow-Origin header dynamically based on the request origin
    const origin = req.headers.origin;
    const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app', 'https://ei-matro-dusky.vercel.app', 'http://localhost:3000'];
  
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
        try {
            // Extract the newsid from the request body
            const { newsid } = req.body;

            if (!newsid) {
                return res.status(400).json({ message: 'id is required' });
            }

            const db = await connectToDatabase();

            const objectId = ObjectId.createFromHexString(newsid);

            // Find the current news item by its _id
            const currentNewsItem = await db.collection('news').findOne({ _id: objectId, publish_status: "Published" });

            if (!currentNewsItem) {
                return res.status(404).json({ message: 'News not found' });
            }

            // Find the previous news item
            const previousNewsItem = await db.collection('news').findOne(
                { _id: { $lt: objectId }, publish_status: "Published" },
                { sort: { _id: -1 }, limit: 1 }
            );

            // Find the next news item
            const nextNewsItem = await db.collection('news').findOne(
                { _id: { $gt: objectId }, publish_status: "Published" },
                { sort: { _id: 1 }, limit: 1 }
            );

            res.status(200).json({ currentNewsItem, previousNewsItem, nextNewsItem });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
