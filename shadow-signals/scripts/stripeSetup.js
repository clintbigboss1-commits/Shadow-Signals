'use strict';
require('dotenv').config();
const Stripe = require('stripe');
const fs   = require('fs');
const path = require('path');

if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_key_here') {
  console.error('❌ Set STRIPE_SECRET_KEY in your .env first');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

async function setup() {
  const mode = process.env.STRIPE_SECRET_KEY.includes('test') ? 'TEST' : 'LIVE';
  console.log(`\n💳 Setting up Stripe products (${mode} mode)...\n`);

  const plans = [
    {
      name: 'Shadow Signals — Starter',
      key:  'STARTER',
      amount: 999,       // $9.99 AUD
      description: 'Top 5 +EV plays daily. Perfect for casual punters.',
    },
    {
      name: 'Shadow Signals — Pro',
      key:  'PRO',
      amount: 1999,      // $19.99 AUD
      description: 'Full +EV scanner, arb finder, CLV tracker. Unlimited access.',
    },
    {
      name: 'Shadow Signals — Elite',
      key:  'ELITE',
      amount: 4999,      // $49.99 AUD
      description: 'API access, multi-account tools, private syndicate Discord.',
    },
  ];

  const envUpdates = {};

  for (const plan of plans) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan: plan.key.toLowerCase() },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'aud',
      recurring: { interval: 'month' },
      nickname: `${plan.key} Monthly`,
      metadata: { plan: plan.key.toLowerCase() },
    });

    const envKey = `STRIPE_PRICE_${plan.key}_MONTH`;
    envUpdates[envKey] = price.id;
    console.log(`✅ ${plan.name}: ${price.id}`);
  }

  // Write price IDs to .env
  const envPath = path.join(process.cwd(), '.env');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  for (const [k, v] of Object.entries(envUpdates)) {
    const regex = new RegExp(`^${k}=.*$`, 'm');
    if (regex.test(env)) {
      env = env.replace(regex, `${k}=${v}`);
    } else {
      env += `\n${k}=${v}`;
    }
  }

  fs.writeFileSync(envPath, env.trim() + '\n');

  console.log('\n✅ Price IDs saved to .env');
  console.log('\n📡 Now create a Stripe webhook:');
  console.log('   1. Go to: dashboard.stripe.com/webhooks');
  console.log('   2. Click "Add endpoint"');
  console.log('   3. URL: https://YOUR-DOMAIN/api/payments/webhook');
  console.log('   4. Select events:');
  console.log('      • checkout.session.completed');
  console.log('      • customer.subscription.updated');
  console.log('      • customer.subscription.deleted');
  console.log('      • invoice.payment_failed');
  console.log('   5. Copy the signing secret → STRIPE_WEBHOOK_SECRET in .env');
  console.log('\nNext: npm run server (or npm run dev)\n');
}

setup().catch(err => {
  console.error('❌ Stripe setup failed:', err.message);
  process.exit(1);
});
