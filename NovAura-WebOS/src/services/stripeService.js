/**
 * Stripe Service - Client-side Stripe integration
 * Creates checkout sessions and handles subscription flows
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';

/**
 * Create a Stripe checkout session for subscription
 * @param {string} userId - Firebase user ID
 * @param {string} planId - Plan ID (spark, emergent, catalyst, nova, catalytic-crew)
 * @returns {Promise<{url: string}>} Stripe checkout URL
 */
export async function createSubscriptionCheckout(userId, planId) {
  const planToPriceMap = {
    'spark': { price: 999, name: 'Spark Membership' },
    'emergent': { price: 1799, name: 'Emergent Membership' },
    'catalyst': { price: 2999, name: 'Catalyst Membership' },
    'nova': { price: 7500, name: 'Nova Membership' },
    'catalytic-crew': { price: 34999, name: 'Catalytic Crew Membership' },
  };

  const plan = planToPriceMap[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const response = await fetch(`${API_BASE_URL}/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      items: [{
        asset: {
          id: `membership-${planId}`,
          title: plan.name,
          shortDescription: `NovAura ${plan.name} - Monthly Subscription`,
          price: plan.price,
          type: 'subscription',
        },
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Verify a completed checkout session
 * @param {string} sessionId - Stripe checkout session ID
 */
export async function verifyCheckoutSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/stripe/session/${sessionId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify session');
  }

  return response.json();
}

/**
 * Get current user's subscription status
 * @param {string} userId - Firebase user ID
 */
export async function getSubscriptionStatus(userId) {
  // This would fetch from your Firestore or a dedicated endpoint
  // For now, we'll return the local state from Firebase
  const { getDoc, doc } = await import('firebase/firestore');
  const { db } = await import('../config/firebase');
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return { tier: 'free', status: 'inactive' };
  
  const data = userDoc.data();
  return {
    tier: data.membershipTier || 'free',
    status: data.subscriptionStatus || 'inactive',
    subscriptionId: data.stripeSubscriptionId || null,
  };
}

/**
 * Cancel subscription
 * @param {string} subscriptionId - Stripe subscription ID
 */
export async function cancelSubscription(subscriptionId) {
  const response = await fetch(`${API_BASE_URL}/stripe/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriptionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel subscription');
  }

  return response.json();
}

/**
 * Update subscription tier
 * @param {string} subscriptionId - Current Stripe subscription ID
 * @param {string} newPlanId - New plan ID to upgrade/downgrade to
 */
export async function updateSubscription(subscriptionId, newPlanId) {
  const planToPriceMap = {
    'spark': { price: 999, name: 'Spark Membership' },
    'emergent': { price: 1799, name: 'Emergent Membership' },
    'catalyst': { price: 2999, name: 'Catalyst Membership' },
    'nova': { price: 7500, name: 'Nova Membership' },
    'catalytic-crew': { price: 34999, name: 'Catalytic Crew Membership' },
  };

  const plan = planToPriceMap[newPlanId];
  if (!plan) {
    throw new Error(`Unknown plan: ${newPlanId}`);
  }

  const response = await fetch(`${API_BASE_URL}/stripe/update-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      newPlanId,
      newPrice: plan.price,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update subscription');
  }

  return response.json();
}
