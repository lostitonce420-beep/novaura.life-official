/**
 * Billing Window - Payments & Subscription Management
 * TODO: Add actual pricing tiers
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2 } from 'lucide-react';

// TODO: Replace with actual pricing tiers when finalized
const PLANS = [];

export default function BillingWindow() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-medium">Billing & Plans</h1>
        </div>
        <p className="text-white/50">Pricing coming soon</p>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <p className="text-white/50 text-lg">Pricing tiers are being finalized.</p>
          <p className="text-white/30 mt-2">Check back soon for updates.</p>
        </div>
      </div>
    </div>
  );
}
