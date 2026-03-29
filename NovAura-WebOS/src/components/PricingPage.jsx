import React from 'react';
import { motion } from 'framer-motion';

// TODO: Replace with actual pricing tiers when finalized
export default function PricingPage() {
  return (
    <div className="min-h-full bg-background text-foreground p-8 overflow-auto">
      <div className="max-w-4xl mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4">Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Pricing tiers are being finalized. Check back soon.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
