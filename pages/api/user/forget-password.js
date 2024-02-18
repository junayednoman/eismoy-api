import { connectToDatabase } from '../../../db';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
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
