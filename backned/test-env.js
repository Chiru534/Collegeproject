import dotenv from 'dotenv';
dotenv.config();

// Only logging first few characters for security
console.log({
  mongoDbUri: process.env.MONGODB_URI?.substring(0, 20) + '...',
  emailUser: process.env.EMAIL_USER,
  emailPassLength: process.env.EMAIL_PASS?.length,
  jwtSecretLength: process.env.JWT_SECRET?.length
});