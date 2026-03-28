import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe (uses an environment variable in production)
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-03-25.dahlia' as any,
});

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

/**
 * Creates or retrieves a Stripe Connect Express account for a Creator.
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const userData = userDoc.data();
    let stripeAccountId = userData?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: userData?.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'individual',
      });
      stripeAccountId = account.id;
      await userRef.update({ stripeAccountId, stripeConnectStatus: 'pending' });
    }

    const accountLink = await stripe.accountLinks.create({
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
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body;
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing userId or items' });
    }

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: items[0].asset?.type === 'subscription' ? 'subscription' : 'payment',
      line_items,
      client_reference_id: userId,
      success_url: `${PLATFORM_URL}/orders?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PLATFORM_URL}/checkout?canceled=true`,
      metadata: { userId, type: items[0].asset?.type === 'subscription' ? 'subscription' : 'asset_purchase' }
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Stripe Webhook.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const event = req.body;
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
        await userRef.update({
          stripeSubscriptionId: session.subscription as string,
          membershipTier: session.metadata?.tier || 'pro',
          subscriptionStatus: 'active'
        });
      }

      if (session.mode === 'payment') {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
        const purchasedAssetIds: string[] = [];
        
        for (const item of lineItems.data) {
          const product = item.price?.product as Stripe.Product;
          if (product && product.metadata?.assetId) {
            purchasedAssetIds.push(product.metadata.assetId);

            const assetDoc = await db.collection('assets').doc(product.metadata.assetId).get();
            if (!assetDoc.exists) continue;
            const assetData = assetDoc.data();

            const splits = await calculateBackendRevenueSplits(assetData, item.amount_total!, db);
            
            for (const split of splits) {
              const recipientDoc = await db.collection('users').doc(split.recipientId).get();
              const recipientStripeId = recipientDoc.data()?.stripeAccountId;

              if (recipientStripeId && split.amountCents > 0) {
                try {
                  const transfer = await stripe.transfers.create({
                    amount: split.amountCents,
                    currency: 'usd',
                    destination: recipientStripeId,
                    transfer_group: session.id,
                    description: `NovAura: ${split.reason} | Asset: ${product.name}`,
                  });

                  await db.collection('royalty_ledger').add({
                    orderId: session.id,
                    assetId: product.metadata.assetId,
                    recipientId: split.recipientId,
                    amount: split.amountCents,
                    percentage: split.percentageUsed,
                    reason: split.reason,
                    stripeTransferId: transfer.id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                } catch (err) {
                  console.error(`Transfer error to ${split.recipientId}:`, err);
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
