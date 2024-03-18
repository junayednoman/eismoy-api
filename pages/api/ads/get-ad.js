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
            const { ad_name } = req.body; // Include ad_name in the request body

            // Check if ad_name is provided
            if (!ad_name) {
                res.status(400).json({ message: 'Ad name is required' });
                return;
            }

            // Fetch the ad from the database based on the provided ad name
            const db = await connectToDatabase();

            const query = { ad_name: ad_name, status: "Show" };

            // Fetch the ad based on the query
            const ad = await db.collection('ads')
                .findOne(query);
            if (ad) {
                res.status(200).json(ad);
            } else {
                res.status(404).json({ message: 'Ad not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}