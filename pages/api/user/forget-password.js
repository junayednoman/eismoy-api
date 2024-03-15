import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Set Access-Control-Allow-Origin header dynamically based on the request origin
  const origin = req.headers.origin;
  const allowedOrigins = ['https://eisomoy-dashboard-node.vercel.app', 'https://ei-matro.vercel.app', 'https://ei-matro-dusky.vercel.app'];
  
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
    const { email, resetUrl } = req.body;

    try {
      const db = await connectToDatabase();

      // Check if email exists in the database
      const user = await db.collection('users').findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate forget password token
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
      });

      // Update user record with forget password token
      await db.collection('users').updateOne({ email }, { $set: { forget_password_token: token } });

      // Send email with forget password link
      const resetLink = `${resetUrl}/${token}`;
      await sendResetPasswordEmail(email, resetLink);

      res.status(200).json({ message: `An email has been sent to ${email} with instructions to reset your password` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

async function sendResetPasswordEmail(email, resetLink) {
  // Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // Use SSL
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Setup email data
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password',
    text: `You are receiving this email because you (or someone else) have requested to reset your password. 
           Please click on the following link to reset your password: ${resetLink}`,
    html: `You are receiving this email because you (or someone else) have requested to reset your password. <br><br>
           Please click on the following link to reset your password: <a href="${resetLink}">${resetLink}</a>`,
  };

  // Send email
  await transporter.sendMail(mailOptions);
}
