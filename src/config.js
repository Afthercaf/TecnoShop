import dotenv from 'dotenv';
dotenv.config();

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; 

export const PORT = process.env.PORT || 4000;
// config.js
export const MONGODB_URI = process.env.MONGODB_URI; 

export const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const FRONTEND_URL = process.env.FRONTEND_URL;

export const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
export const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
export const PAYPAL_API = process.env.PAYPAL_API; 

