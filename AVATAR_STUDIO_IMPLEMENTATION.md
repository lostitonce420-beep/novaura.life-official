# NovAura Avatar Studio - Implementation Plan
## AI-Powered Avatar & Clothing System

### Phase 1: Foundation (Week 1-2)
Build the core architecture using proven libraries.

#### 1.1 Base Avatar System
Use **Multiavatar** or **AvataaarsJs** as the skeleton:
```javascript
// Layer structure
const AVATAR_LAYERS = [
  { id: 'body', name: 'Body Base', zIndex: 0 },
  { id: 'underwear', name: 'Underwear', zIndex: 1 },
  { id: 'pants', name: 'Bottoms', zIndex: 2 },
  { id: 'shirt', name: 'Tops', zIndex: 3 },
  { id: 'jacket', name: 'Outerwear', zIndex: 4 },
  { id: 'accessories', name: 'Accessories', zIndex: 5 },
  { id: 'hair', name: 'Hair', zIndex: 6 },
];
```

#### 1.2 Canvas Compositing Engine
```typescript
interface AvatarComposer {
  // Base avatar generation
  generateBaseAvatar(prompt: string, style: Style): Promise<AvatarBase>;
  
  // Clothing generation
  generateClothing(
    type: ClothingType, 
    style: string, 
    baseAvatar: AvatarBase
  ): Promise<ClothingItem>;
  
  // Dimension mapping
  fitClothing(
    clothing: ClothingItem, 
    avatar: AvatarBase,
    anchorPoints: AnchorMap
  ): FittedClothing;
  
  // Animation
  animate(avatar: ComposedAvatar, animation: AnimationType): Promise<AnimatedAvatar>;
}
```

### Phase 2: AI Integration (Week 3-4)
Replace static parts with PixAI-generated content.

#### 2.1 Consistent Character Generation
```typescript
// Use IP-Adapter or consistent character embedding
const generateConsistentAvatar = async (prompt: string, seed: number) => {
  const result = await aiOrchestrator.generateImage(prompt, {
    provider: 'pixai',
    // Use seed + embedding for consistency
    seed: seed,
    negativePrompt: 'inconsistent features, different face, mutated',
    aspectRatio: '1:1',
  });
  
  // Remove background
  const cleanImage = await BackgroundRemoverService.removeBackground(result.imageUrl);
  
  return cleanImage;
};
```

#### 2.2 Clothing Generation Pipeline
```typescript
const generateClothingItem = async ({
  type,        // 'shirt', 'pants', 'dress', etc.
  style,       // 'cyberpunk', 'fantasy', 'casual'
  avatarBase,  // Reference avatar for style matching
  color,       // Desired color
}: ClothingParams) => {
  
  // Prompt engineering for clothing
  const prompt = `
    ${type} clothing item, ${style} style, ${color} color,
    isolated on transparent background,
    front view, flat lay photography,
    high detail fabric texture,
    matching art style: ${avatarBase.artStyle}
  `;
  
  const generated = await aiOrchestrator.generateImage(prompt, {
    provider: 'pixai',
    aspectRatio: '1:1',
  });
  
  // Auto-trim and process
  const processed = await processClothingImage(generated.imageUrl);
  
  // Generate dimension map (for fitting)
  const dimensionMap = await generateDimensionMap(processed);
  
  return {
    imageUrl: processed,
    dimensionMap,
    type,
    anchorPoints: calculateAnchorPoints(dimensionMap),
  };
};
```

### Phase 3: Dimension Mapping & Fitting (Week 5-6)
The critical "clothes that fit perfectly" system.

#### 3.1 Anchor Point System
```typescript
interface BodyAnchorPoints {
  neck: { x: number; y: number };
  shoulders: { left: Point; right: Point };
  chest: { x: number; y: number };
  waist: { x: number; y: number };
  hips: { x: number; y: number };
  wrists: { left: Point; right: Point };
  ankles: { left: Point; right: Point };
}

interface ClothingAnchorPoints {
  neckOpening?: Point;
  shoulderSeams?: { left: Point; right: Point };
  waistband?: Point;
  hem?: Point;
}
```

#### 3.2 Auto-Fit Algorithm
```typescript
const fitClothingToAvatar = (
  clothing: ClothingItem,
  avatar: AvatarBase
): TransformedClothing => {
  
  // Calculate scale factors
  const shoulderScale = distance(avatar.shoulders) / distance(clothing.shoulderSeams);
  const heightScale = avatar.height / clothing.height;
  
  // Transform clothing
  const transform = {
    scale: { x: shoulderScale, y: heightScale },
    translate: {
      x: avatar.neck.x - clothing.neckOpening.x * shoulderScale,
      y: avatar.neck.y - clothing.neckOpening.y * heightScale,
    },
    rotation: 0, // Calculate if needed for pose
  };
  
  // Apply to canvas layer
  return applyTransform(clothing, transform);
};
```

### Phase 4: Animation System (Week 7-8)

#### 4.1 Idle Animation (Subtle)
Use **AnimateDiff** or simple WebGL shaders:
```typescript
const addIdleAnimation = async (staticAvatar: ComposedAvatar) => {
  // Option 1: AnimateDiff (AI animation)
  const animated = await aiOrchestrator.generateAnimation(staticAvatar.imageUrl, {
    type: 'idle',
    duration: 3, // seconds
    loop: true,
  });
  
  // Option 2: WebGL vertex shader (breathing effect)
  const webglAnimated = applyBreathingEffect(staticAvatar);
  
  return animated;
};
```

#### 4.2 Emote Animations
```typescript
const EMOTES = {
  wave: { prompt: 'character waving hand', duration: 2 },
  dance: { prompt: 'character dancing', duration: 4 },
  celebrate: { prompt: 'character celebrating', duration: 2 },
};
```

### Technology Stack

```
Frontend:
├── React + TypeScript
├── Fabric.js or Konva.js (Canvas manipulation)
├── PixiJS (Optional: WebGL rendering)
└── Framer Motion (UI animations)

AI Pipeline:
├── PixAI (Primary generation - unlimited)
├── Vertex AI (Backup)
├── AnimateDiff (Animation)
└── BackgroundRemoverService (existing)

Backend:
├── Firebase Storage (Asset storage)
├── Firestore (Metadata, anchor points)
└── Firebase Functions (Processing)

Export Formats:
├── PNG (Static avatar)
├── GIF/WebM (Animated)
├── VRM (3D - optional)
└── Spine JSON (2D animation data)
```

### Implementation Checklist

- [ ] **Week 1**: Set up canvas compositor, layer system
- [ ] **Week 2**: Integrate Multiavatar/Avataaars as base
- [ ] **Week 3**: Connect PixAI for base avatar generation
- [ ] **Week 4**: Build clothing generation pipeline
- [ ] **Week 5**: Implement anchor point detection
- [ ] **Week 6**: Build auto-fit algorithm
- [ ] **Week 7**: Add animation system
- [ ] **Week 8**: Export formats, optimization

### Key Technical Decisions

1. **2D vs 3D**: Start with 2D (faster, cheaper, easier AI gen), add 3D export later
2. **Real-time vs Pre-rendered**: Pre-render for quality, cache aggressively
3. **Client vs Server processing**: Heavy AI on server, compositing on client
4. **Animation approach**: AnimateDiff for quality, WebGL shaders for real-time

### Budget Estimate

| Component | Time | Cost |
|-----------|------|------|
| MVP (Phases 1-2) | 4 weeks | $0 (using existing PixAI) |
| Full System | 8 weeks | $0 (unlimited generation) |
| VRM Export | +2 weeks | $0 |

**Total: 2 months to full AI avatar studio**

### Next Immediate Action

Start with **Week 1 tasks**:
1. Create `AvatarStudio` component structure
2. Set up canvas with layer system
3. Integrate Multiavatar as placeholder base
4. Connect PixAI generation

Ready to start building this?
