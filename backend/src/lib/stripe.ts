import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // In development/test we might not have it, but for production it's critical.
  // We'll warn or throw depending on strictness. For now, let's allow it to fail at runtime if used.
  console.warn('STRIPE_SECRET_KEY is missing from environment variables');
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

export default stripe;
