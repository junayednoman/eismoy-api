import { connectToDatabase } from '../../../db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { password, confirmPassword, token } = req.body;

    // Validate password and confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
      const db = await connectToDatabase();

      // Find user by forget password token
      const user = await db.collection('users').findOne({ forget_password_token: token });
      if (!user) {
        return res.status(404).json({ message: 'Invalid or expired token' });
      }

      // Update user's password
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

      // Clear forget password token
      await db.collection('users').updateOne({ _id: user._id }, { $set: { forget_password_token: null } });

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
