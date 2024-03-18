import { connectToDatabase } from '../../../db';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
    // Set Access-Control-Allow-Origin header dynamically based on the request origin
    const origin = req.headers.origin;
    const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app', 'https://eimattro.com', 'http://localhost:3000'];
  
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

    if (req.method === 'Post') {
        try {
            // Extract the ad name from the query parameters
            const ad_name = req.body;

            if (!ad_name) {
                return res.status(400).json({ message: 'ad_name value is required' });
            }

            const db = await connectToDatabase();

            // Find the ad by its name
            const ad = await db.collection('ads').findOne({ ad_name: ad_name });

            if (!ad) {
                return res.status(404).json({ message: 'Ad not found' });
            }

            if (ad.status === 'Show') {
                // Return image and link fields if ad status is 'show'
                res.status(200).json({ image: ad.image, link: ad.link });
            } else {
                // Return false if ad status is not 'show'
                res.status(200).json({ data: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
