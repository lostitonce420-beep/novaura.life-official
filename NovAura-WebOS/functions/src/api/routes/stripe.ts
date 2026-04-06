import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { createOrderFromSession } from './orders';

const router = Router();

// Initialize Stripe (requires environment variable)
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('[Stripe] STRIPE_SECRET_KEY not set. Stripe features will be disabled.');
}
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2026-03-25.dahlia' as any,
}) : null;

const PLATFORM_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

/**
 * Helper to get royalty percentage from license tier.
 */
const getRoyaltyFromTier = (tier: string): number => {
  switch (tier) {
    case 'art_3pct': return 3.0;
    case 'music_1pct': return 1.0;
    case 'integration_10pct': return 10.0;
    case 'functional_15pct': return 15.0;
    case 'source_20pct': return 20.0;
    case 'opensource': return 0;
    default: return 0;
  }
};

/**
 * Recursively calculates revenue splits for an asset sale.
 */
interface RoyaltySplit {
  recipientId: string;
  amountCents: number;
  percentageUsed: number;
  reason: string;
}

const calculateBackendRevenueSplits = async (
  asset: any,
  salePriceCents: number,
  db: admin.firestore.Firestore
): Promise<RoyaltySplit[]> => {
  const splits: RoyaltySplit[] = [];
  
  // 1. Platform Fee (Fixed 10%)
  const platformFeePercentage = 10.0;
  const platformFeeAmount = Math.round(salePriceCents * (platformFeePercentage / 100));
  const remainingPot = salePriceCents - platformFeeAmount;

  // 2. Collect splits
  const initialSplits: { recipientId: string, percentage: number, reason: string }[] = [];
  
  if (asset.foundationAssets && asset.foundationAssets.length > 0) {
    for (const foundationId of asset.foundationAssets) {
      const foundationDoc = await db.collection('assets').doc(foundationId).get();
      if (foundationDoc.exists) {
        const foundation = foundationDoc.data();
        const royaltyPercent = getRoyaltyFromTier(foundation?.licenseTier || '');
        if (royaltyPercent > 0) {
          initialSplits.push({
            recipientId: foundation?.creatorId,
            percentage: royaltyPercent,
            reason: `Foundation Royalty: ${foundation?.title}`
          });
        }
      }
    }
  }

  if (asset.revenueSplits && asset.revenueSplits.length > 0) {
    for (const split of asset.revenueSplits) {
      initialSplits.push({
        recipientId: split.userId,
        percentage: split.percentage,
        reason: `${split.role === 'original_creator' ? 'Original Creator' : 'Collaborator'} Share`
      });
    }
  }

  const totalExternalPercentage = initialSplits.reduce((acc, s) => acc + (s.percentage || 0), 0);
  const scalingFactor = totalExternalPercentage > 50 ? 50 / totalExternalPercentage : 1;

  for (const split of initialSplits) {
    const scaledPercentage = split.percentage * scalingFactor;
    const amount = Math.round(remainingPot * (scaledPercentage / 100));
    
    splits.push({
      recipientId: split.recipientId,
      amountCents: amount,
      percentageUsed: Number(scaledPercentage.toFixed(2)),
      reason: `${split.reason} (${scaledPercentage.toFixed(1)}%${scalingFactor < 1 ? ' scaled' : ''})`
    });
  }

  const externalPayoutTotal = splits.reduce((acc, s) => acc + s.amountCents, 0);
  const mainCreatorAmount = remainingPot - externalPayoutTotal;

  if (mainCreatorAmount > 0) {
    splits.push({
      recipientId: asset.creatorId,
      amountCents: mainCreatorAmount,
      percentageUsed: Number(((mainCreatorAmount / salePriceCents) * 100).toFixed(2)),
      reason: "Main Creator Guaranteed Stake"
    });
  }

  return splits;
};

// Helper to check if Stripe is configured
const checkStripe = (res: Response): boolean => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe not configured', message: 'Payment processing is currently unavailable' });
    return false;
  }
  return true;
};

/**
 * Creates or retrieves a Stripe Connect Express account for a Creator.
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    if (!checkStripe(res)) return;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const userData = userDoc.data();
    let stripeAccountId = userData?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe!.accounts.create({
        type: 'express',
        country: 'US',
        email: userData?.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
      });
      stripeAccountId = account.id;
      await userRef.update({ stripeAccountId, stripeConnectStatus: 'pending' });
    }

    const accountLink = await stripe!.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${PLATFORM_URL}/creator/settings?tab=payouts&refresh=true`,
      return_url: `${PLATFORM_URL}/creator/settings?tab=payouts&success=true`,
      type: 'account_onboarding',
    });

    return res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Creates a Stripe Checkout Session.
 * Handles both one-time payments (assets) and subscriptions (membership plans).
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    if (!checkStripe(res)) return;
    const { userId, items } = req.body;
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing userId or items' });
    }

    const isSubscription = items[0].asset?.type === 'subscription';

    // For subscriptions, we need to create/get a recurring price
    if (isSubscription) {
      const item = items[0];
      const planId = item.asset.id.replace('membership-', '');
      const unitAmount = item.asset.price; // Already in cents from frontend

      // Create or retrieve a product for this membership tier
      const productName = item.asset.title;
      const productDescription = item.asset.shortDescription;

      // Create a new price for this subscription (Stripe requires recurring prices for subscriptions)
      const price = await stripe!.prices.create({
        unit_amount: unitAmount,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: productName,
          description: productDescription,
          metadata: { 
            planId: planId,
            type: 'membership'
          }
        },
      });

      const session = await stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: userId,
        success_url: `${PLATFORM_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${PLATFORM_URL}/pricing?canceled=true`,
        metadata: { 
          userId, 
          type: 'subscription',
          planId: planId,
          tier: planId
        },
        subscription_data: {
          metadata: {
            userId,
            planId,
            tier: planId
          }
        }
      });

      return res.json({ url: session.url });
    }

    // One-time payment (asset purchase)
    const line_items = items.map((item: any) => {
      const unitAmount = item.customPrice || item.asset.price;
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.asset.title,
            description: item.asset.shortDescription,
            metadata: { assetId: item.asset.id, creatorId: item.asset.creatorId }
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    });

    const session = await stripe!.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      client_reference_id: userId,
      success_url: `${PLATFORM_URL}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PLATFORM_URL}/checkout?canceled=true`,
      metadata: { userId, type: 'asset_purchase' }
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Verify a completed checkout session — called by OrdersPage on success redirect.
 * GET /stripe/session/:sessionId
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    if (!checkStripe(res)) return;
    const { sessionId } = req.params;
    const session = await stripe!.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product', 'payment_intent']
    });

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed', status: session.payment_status });
    }

    const items = session.line_items?.data.map((item: any) => ({
      assetId: item.price?.product?.metadata?.assetId,
      assetTitle: item.price?.product?.name,
      thumbnail: item.price?.product?.images?.[0] || null,
      amountPaid: item.amount_total,
    })) || [];

    return res.json({
      verified: true,
      sessionId: session.id,
      userId: session.client_reference_id,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
      items,
    });
  } catch (error: any) {
    console.error('Session verify error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Stripe Webhook — receives raw body for signature verification.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  if (webhookSecret) {
    const sig = req.headers['stripe-signature'];
    try {
      // req.body is a Buffer here (express.raw middleware applied in app.ts)
      event = stripe!.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
    }
  } else {
    // Dev mode — no signature verification
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const db = admin.firestore();

  try {
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled && account.details_submitted) {
        const snapshot = await db.collection('users').where('stripeAccountId', '==', account.id).get();
        if (!snapshot.empty) await snapshot.docs[0].ref.update({ stripeConnectStatus: 'active' });
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) return res.status(400).json({ error: 'Missing client_reference_id' });
      
      const userRef = db.collection('users').doc(userId);

      if (session.mode === 'subscription') {
        const planId = session.metadata?.planId || session.metadata?.tier || 'spark';
        await userRef.update({
          stripeSubscriptionId: session.subscription as string,
          membershipTier: planId,
          subscriptionStatus: 'active',
          subscriptionStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Stripe Webhook] Subscription activated for user ${userId}, tier: ${planId}`);
      }

      if (session.mode === 'payment') {
        const lineItems = await stripe!.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
        const purchasedAssetIds: string[] = [];

        for (const item of lineItems.data) {
          const product = item.price?.product as Stripe.Product;
          if (product && product.metadata?.assetId) {
            const assetId = product.metadata.assetId;
            purchasedAssetIds.push(assetId);

            const assetDoc = await db.collection('assets').doc(assetId).get();
            if (!assetDoc.exists) continue;
            const assetData = assetDoc.data();

            // ── Create order record + unlock download ────────────────────────
            try {
              await createOrderFromSession(
                session.id,
                userId,
                assetId,
                item.amount_total || 0,
                db
              );
            } catch (err) {
              console.error(`[Webhook] createOrderFromSession failed for ${assetId}:`, err);
            }

            // ── Calculate and execute revenue splits ─────────────────────────
            const splits = await calculateBackendRevenueSplits(assetData, item.amount_total!, db);

            for (const split of splits) {
              const recipientDoc = await db.collection('users').doc(split.recipientId).get();
              const recipientStripeId = recipientDoc.data()?.stripeAccountId;

              // Write royalty ledger entry regardless of Stripe Connect status
              const ledgerRef = await db.collection('royalty_ledger').add({
                stripeSessionId: session.id,
                assetId,
                assetTitle: product.name,
                recipientId: split.recipientId,
                amount: split.amountCents,
                percentage: split.percentageUsed,
                reason: split.reason,
                status: 'pending_transfer',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });

              // Execute Stripe transfer if creator has Connect account
              if (recipientStripeId && split.amountCents > 0) {
                try {
                  const transfer = await stripe!.transfers.create({
                    amount: split.amountCents,
                    currency: 'usd',
                    destination: recipientStripeId,
                    transfer_group: session.id,
                    description: `NovAura: ${split.reason} | Asset: ${product.name}`,
                  });
                  await ledgerRef.update({ stripeTransferId: transfer.id, status: 'transferred' });
                } catch (err) {
                  console.error(`Transfer error to ${split.recipientId}:`, err);
                  await ledgerRef.update({ status: 'transfer_failed' });
                }
              }
            }
          }
        }

        if (purchasedAssetIds.length > 0) {
          await userRef.update({
            purchasedAssetIds: admin.firestore.FieldValue.arrayUnion(...purchasedAssetIds)
          });
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          subscriptionStatus: subscription.status,
          membershipTier: (subscription.status === 'active') ? snapshot.docs[0].data()?.membershipTier : 'free'
        });
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  return res.status(200).json({ received: true });
});

export default router;
