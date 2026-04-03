import React, { useState } from 'react';
import { Sparkles, RefreshCw, Heart, Save, ArrowLeft, Shirt } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const OCCASIONS = [
  { id: 'office', label: 'Office / Work', icon: '💼', vibe: 'Professional yet stylish' },
  { id: 'casual', label: 'Casual Hangout', icon: '☕', vibe: 'Relaxed and comfortable' },
  { id: 'date', label: 'Date Night', icon: '💕', vibe: 'Elegant and alluring' },
  { id: 'gym', label: 'Gym / Active', icon: '💪', vibe: 'Performance and comfort' },
  { id: 'beach', label: 'Beach Day', icon: '🏖️', vibe: 'Breezy and fun' },
  { id: 'party', label: 'Party / Club', icon: '🎉', vibe: 'Bold and statement' },
  { id: 'fantasy', label: 'Fantasy Cosplay', icon: '🧙', vibe: 'Otherworldly and creative' },
  { id: 'gothic', label: 'Gothic Night', icon: '🦇', vibe: 'Dark elegance' },
];

// Pre-generated outfit suggestions per occasion
const OUTFIT_DB = {
  office: [
    { top: '👔 Fitted Blazer', bottom: '👖 Tailored Slacks', shoes: '👞 Oxford Leather', acc: '⌚ Classic Watch', tip: 'Layer with a thin knit for warmth.' },
    { top: '👕 Silk Blouse', bottom: '👖 Pencil Skirt', shoes: '👠 Block Heels', acc: '📿 Pearl Necklace', tip: 'Neutral tones project confidence.' },
    { top: '🧥 Structured Vest', bottom: '👖 High-waist Trousers', shoes: '👟 Minimalist Loafers', acc: '🕶️ Blue-light Glasses', tip: 'Vest over turtleneck is timeless.' },
  ],
  casual: [
    { top: '👕 Graphic Tee', bottom: '👖 Straight Jeans', shoes: '👟 Clean Sneakers', acc: '🎒 Canvas Bag', tip: 'Rolled cuffs add instant style.' },
    { top: '🧶 Oversized Knit', bottom: '👖 Joggers', shoes: '👟 Platform Trainers', acc: '🧢 Dad Cap', tip: 'Monochrome keeps it sleek.' },
    { top: '👕 Henley Tee', bottom: '🩳 Cargo Shorts', shoes: '🩴 Slides', acc: '📿 Beaded Bracelet', tip: 'Earth tones work great for casual.' },
  ],
  date: [
    { top: '👔 Slim Fit Shirt', bottom: '👖 Dark Wash Jeans', shoes: '👞 Chelsea Boots', acc: '🌹 Cologne', tip: 'One statement piece only.' },
    { top: '👗 Little Black Dress', bottom: '-', shoes: '👠 Strappy Heels', acc: '💎 Drop Earrings', tip: 'Less is more. Let the fit speak.' },
    { top: '🧥 Leather Jacket', bottom: '👖 Slim Chinos', shoes: '👢 Ankle Boots', acc: '⌚ Minimalist Watch', tip: 'The jacket does the heavy lifting.' },
  ],
  gym: [
    { top: '🏋️ Compression Tank', bottom: '🩳 Training Shorts', shoes: '👟 Cross-trainers', acc: '🎧 Sport Earbuds', tip: 'Moisture-wicking fabric is key.' },
    { top: '👕 Dry-fit Tee', bottom: '👖 Yoga Leggings', shoes: '👟 Running Shoes', acc: '💧 Water Bottle', tip: 'Dark colors hide sweat stains.' },
  ],
  beach: [
    { top: '🩱 Swim Top', bottom: '🩳 Board Shorts', shoes: '🩴 Flip Flops', acc: '🕶️ Polarized Shades', tip: 'SPF is the real accessory.' },
    { top: '👕 Linen Shirt', bottom: '🩳 Linen Shorts', shoes: '👟 Espadrilles', acc: '🧢 Straw Hat', tip: 'Natural fabrics breathe best.' },
  ],
  party: [
    { top: '✨ Sequin Top', bottom: '👖 Leather Pants', shoes: '👠 Platform Boots', acc: '💎 Statement Chain', tip: 'Go bold or stay home.' },
    { top: '👔 Satin Shirt', bottom: '👖 Slim Trousers', shoes: '👞 Monk Straps', acc: '🕶️ Tinted Shades', tip: 'Satin catches every light.' },
  ],
  fantasy: [
    { top: '🧥 Elven Cloak', bottom: '👖 Leather Breeches', shoes: '👢 Knee Boots', acc: '⚔️ Belt Dagger', tip: 'Layering builds the fantasy.' },
    { top: '👘 Mage Robes', bottom: '👖 Flowing Pants', shoes: '👢 Wrapped Sandals', acc: '🔮 Crystal Pendant', tip: 'Deep purples and golds = magic.' },
  ],
  gothic: [
    { top: '🖤 Velvet Corset', bottom: '👖 High-waist Skirt', shoes: '👢 Platform Boots', acc: '📿 Choker', tip: 'Black on black, always.' },
    { top: '🧥 Victorian Coat', bottom: '👖 Slim Trousers', shoes: '👢 Buckle Boots', acc: '🌹 Cameo Brooch', tip: 'One crimson accent piece adds drama.' },
  ],
};

export default function OutfitGeneratorWindow() {
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [currentOutfit, setCurrentOutfit] = useState(null);
  const [outfitIdx, setOutfitIdx] = useState(0);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('saved_outfits') || '[]'); } catch { return []; }
  });

  const generate = (occasion) => {
    setSelectedOccasion(occasion);
    const outfits = OUTFIT_DB[occasion.id] || OUTFIT_DB.casual;
    setOutfitIdx(0);
    setCurrentOutfit(outfits[0]);
  };

  const nextSuggestion = () => {
    if (!selectedOccasion) return;
    const outfits = OUTFIT_DB[selectedOccasion.id] || OUTFIT_DB.casual;
    const next = (outfitIdx + 1) % outfits.length;
    setOutfitIdx(next);
    setCurrentOutfit(outfits[next]);
  };

  const saveOutfit = () => {
    if (!currentOutfit || !selectedOccasion) return;
    const entry = { ...currentOutfit, occasion: selectedOccasion.label, savedAt: new Date().toISOString() };
    const updated = [...saved, entry];
    setSaved(updated);
    kernelStorage.setItem('saved_outfits', JSON.stringify(updated));
  };

  if (selectedOccasion && currentOutfit) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => { setSelectedOccasion(null); setCurrentOutfit(null); }} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <span className="text-lg">{selectedOccasion.icon}</span>
          <span className="text-sm font-semibold">{selectedOccasion.label}</span>
          <span className="text-[10px] text-slate-400 ml-auto">Suggestion {outfitIdx + 1}/{(OUTFIT_DB[selectedOccasion.id] || []).length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Outfit pieces */}
          {[
            { label: 'Top', value: currentOutfit.top },
            { label: 'Bottom', value: currentOutfit.bottom },
            { label: 'Shoes', value: currentOutfit.shoes },
            { label: 'Accessory', value: currentOutfit.acc },
          ].filter(p => p.value && p.value !== '-').map(piece => (
            <div key={piece.label} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg">{piece.value.split(' ')[0]}</div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase">{piece.label}</div>
                <div className="text-xs font-medium">{piece.value.slice(piece.value.indexOf(' ') + 1)}</div>
              </div>
            </div>
          ))}

          {/* Styling Tip */}
          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
            <div className="text-[9px] text-purple-400 uppercase mb-1">Styling Tip</div>
            <div className="text-xs text-purple-200">{currentOutfit.tip}</div>
          </div>

          {/* My Wardrobe items */}
          {(() => {
            try {
              const wardrobe = JSON.parse(kernelStorage.getItem('clothing_items') || '[]');
              if (wardrobe.length === 0) return null;
              return (
                <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-800/50">
                  <div className="text-[9px] text-teal-400 uppercase mb-1.5">From Your Wardrobe</div>
                  <div className="flex gap-2 overflow-x-auto">
                    {wardrobe.slice(0, 6).map(item => (
                      <div key={item.id} className="shrink-0 w-14 h-14 rounded-lg border border-slate-700 flex items-center justify-center text-[9px] text-slate-400 text-center p-1"
                        style={{ background: `linear-gradient(135deg, ${item.baseColor}40, ${item.accentColor || item.baseColor}20)` }}>
                        {item.name || item.type}
                      </div>
                    ))}
                  </div>
                </div>
              );
            } catch { return null; }
          })()}

          {/* Vibe */}
          <div className="text-center text-[10px] text-slate-500 italic">Vibe: {selectedOccasion.vibe}</div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-slate-800 flex gap-2 shrink-0">
          <button onClick={nextSuggestion} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" /> Next Suggestion
          </button>
          <button onClick={saveOutfit} className="flex-1 py-2 bg-purple-600/50 hover:bg-purple-500/50 rounded-lg text-xs flex items-center justify-center gap-1">
            <Heart className="w-3 h-3" /> Save Outfit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold">Outfit Generator</span>
        {saved.length > 0 && <span className="text-[10px] text-slate-500 ml-auto">{saved.length} saved</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs text-slate-400 mb-3">Choose an occasion to generate outfit suggestions:</div>
        <div className="grid grid-cols-2 gap-2">
          {OCCASIONS.map(occ => (
            <button key={occ.id} onClick={() => generate(occ)}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-600/50 transition-all text-left group">
              <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform inline-block">{occ.icon}</span>
              <div className="text-xs font-medium">{occ.label}</div>
              <div className="text-[9px] text-slate-500">{occ.vibe}</div>
            </button>
          ))}
        </div>

        {/* Saved outfits */}
        {saved.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 mb-2">SAVED OUTFITS</div>
            <div className="space-y-1.5">
              {saved.slice(-5).reverse().map((o, i) => (
                <div key={i} className="p-2 bg-slate-900/30 rounded border border-slate-800/50 text-[10px]">
                  <div className="text-slate-300 font-medium">{o.occasion}</div>
                  <div className="text-slate-500">{o.top} + {o.bottom}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
