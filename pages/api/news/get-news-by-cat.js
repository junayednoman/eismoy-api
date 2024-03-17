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
            // Extract slug from the request body
            const { slug, skip, limit } = req.body;

            if (!slug) {
                return res.status(400).json({ message: 'Slug is required' });
            }

            const db = await connectToDatabase();

            // Find the category name based on the provided slug
            const category = await db.collection('news_categories').findOne({ slug });

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Query to find news items by category name and publish status
            const query = {
                category: category.categoryName, // Get category name from the news_categories collection
                publish_status: "Published"
            };

            // Find total count of news items matching the query
            const totalCount = await db.collection('news').countDocuments(query);

            // Find news items based on the query with server-side pagination
            let newsItems;
            if (limit) {
                newsItems = await db.collection('news')
                    .find(query)
                    .sort({ _id: -1 }) // Sort by _id in descending order (latest first)
                    .skip(skip ? parseInt(skip) : 0) // Skip items if pagination is applied
                    .limit(parseInt(limit)) // Limit the number of items returned
                    .toArray();
            } else {
                newsItems = await db.collection('news')
                    .find(query)
                    .sort({ _id: -1 }) // Sort by _id in descending order (latest first)
                    .skip(skip ? parseInt(skip) : 0) // Skip items if pagination is applied
                    .toArray();
            }

            // Return response with news items, total count, and category name
            res.status(200).json({ newsItems, totalCount, category: category.categoryName });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
