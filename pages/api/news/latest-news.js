import { connectToDatabase } from '../../../db';

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
            const { category, limit, skipItem, skipNews } = req.body; // Include newsIds in the request body

            // Fetch all news from the database based on the provided parameters
            const db = await connectToDatabase();

            let query = { publish_status: "Published" };

            // Fetch news based on the query, sorted by _id in descending order
            let news;
            if (limit) {
                news = await db.collection('news')
                    .find(query)
                    .sort({ _id: -1 })
                    .limit(parseInt(limit))
                    .toArray();
            } else {
                news = await db.collection('news')
                    .find(query)
                    .sort({ _id: -1 })
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