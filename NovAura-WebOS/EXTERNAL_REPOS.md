# External Repository Integration Guide

Instead of building everything from scratch, we integrate battle-tested open source projects into NovAura.

## Quick Integration

### 1. Git Submodules (Recommended for Active Projects)

```bash
# Add a repo as a submodule
cd NovAura-WebOS
git submodule add https://github.com/user/awesome-avatar-lib.git src/external/avatar-lib

# Update all submodules
git submodule update --init --recursive
```

### 2. NPM Packages (For Published Libraries)

```bash
npm install dicebear @dicebear/collection
npm install live2d-widget
npm install @pixi/react  # For 2D animations
npm install three @react-three/fiber  # For 3D
```

### 3. CDN Integration (For Quick Testing)

```javascript
// Add to index.html or lazy load
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/library@version/dist/lib.min.js';
document.head.appendChild(script);
```

## Recommended Repositories

### Avatar/Creation
| Repo | Purpose | Integration |
|------|---------|-------------|
| [dicebear](https://github.com/dicebear/dicebear) | SVG avatar generation | ✅ Already using API |
| [avataaars](https://github.com/fangpenlin/avataaars) | Cartoon avatars | npm install avataaars |
| [live2d-widget](https://github.com/stevenjoezhang/live2d-widget) | Animated 2D characters | npm install live2d-widget |
| [PixiJS](https://github.com/pixijs/pixijs) | 2D animations | npm install pixi.js |
| [Three.js](https://github.com/mrdoob/three.js) | 3D avatars | npm install three |

### Code/Development
| Repo | Purpose | Integration |
|------|---------|-------------|
| [Monaco Editor](https://github.com/microsoft/monaco-editor) | VS Code editor | npm install @monaco-editor/react |
| [React Flow](https://github.com/xyflow/xyflow) | Node graphs | ✅ Already installed |
| [Xterm.js](https://github.com/xtermjs/xterm.js) | Terminal emulator | npm install xterm |

### Game Dev
| Repo | Purpose | Integration |
|------|---------|-------------|
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 3D game engine | npm install @babylonjs/core |
| [Phaser](https://github.com/photonstorm/phaser) | 2D game framework | npm install phaser |
| [PlayCanvas](https://github.com/playcanvas/engine) | Web-first game engine | npm install playcanvas |

### Animation/Desktop Pets
| Repo | Purpose | Integration |
|------|---------|-------------|
| [Live2D Cubism](https://github.com/Live2D/CubismWebSamples) | 2D VTuber style | Git submodule |
| [waifu-tips](https://github.com/forthespada/waifu-tips) | Floating anime characters | Fork & modify |
| [Electron-Pet](https://github.com/alelievr/electron-pet) | Desktop pet framework | Reference architecture |

## Integration Example: Live2D Avatar

```bash
# Step 1: Add as submodule
git submodule add https://github.com/Live2D/CubismWebSamples.git src/external/live2d

# Step 2: Create wrapper component
cat > src/components/external/Live2DAvatar.jsx << 'EOF'
import { useEffect, useRef } from 'react';

export default function Live2DAvatar({ modelUrl }) {
  const canvasRef = useRef();
  
  useEffect(() => {
    // Initialize Live2D from submodule
    const { CubismCore } = window;
    // ... initialization code
  }, [modelUrl]);
  
  return <canvas ref={canvasRef} className="live2d-canvas" />;
}
EOF

# Step 3: Update vite.config.js to include submodule
export default defineConfig({
  optimizeDeps: {
    include: ['src/external/live2d/Core/live2dcubismcore.js']
  }
});
```

## Automation Script

```bash
#!/bin/bash
# scripts/add-external-repo.sh

REPO_URL=$1
TARGET_DIR=$2

echo "Adding $REPO_URL to $TARGET_DIR..."

# Add as submodule
git submodule add "$REPO_URL" "src/external/$TARGET_DIR"

# Create integration file
cat > "src/external/${TARGET_DIR}.integration.js" << EOF
// Auto-generated integration for $TARGET_DIR
// Original: $REPO_URL

export { default } from './$TARGET_DIR/dist/index.js';
export * from './$TARGET_DIR/dist/index.js';
EOF

echo "✅ Added $TARGET_DIR"
echo "📝 Update WindowManager.jsx to use the new component"
```

## Current External Dependencies

Already integrated:
- ✅ DiceBear API (avatar generation)
- ✅ React Flow (node graphs)
- ✅ Monaco Editor (via IDEWindow)
- ✅ JSZip (file compression)

Ready to add:
- 🔄 Live2D (animated 2D avatars)
- 🔄 Three.js (3D avatars)
- 🔄 PixiJS (2D animations)
- 🔄 Phaser (game engine)

## License Compliance

Always check licenses:
- **MIT** - ✅ Use freely
- **Apache 2.0** - ✅ Use freely, include NOTICE
- **GPL** - ⚠️ Must open source your code
- **Commercial** - 💰 Need license

Add to `src/external/LICENSES.md`:
```markdown
## External Dependencies

- dicebear: CC0 1.0 Universal
- react-flow: MIT
- monaco-editor: MIT
```
