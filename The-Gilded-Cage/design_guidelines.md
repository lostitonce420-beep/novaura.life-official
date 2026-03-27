# Design Guidelines: Fantasy Mystery RPG

## Brand Identity

**Purpose**: A narrative-driven RPG where players unravel a mystery through puzzle-solving and character interactions in a richly illustrated medieval fantasy setting.

**Aesthetic Direction**: **Editorial Storybook** - Inspired by illuminated manuscripts and classic fantasy game books. Rich, hand-painted quality illustrations, ornate UI framing elements, parchment-like textures, and strong typographic hierarchy. Think "interactive fantasy novel" rather than typical game UI.

**Memorable Element**: Every screen transition uses a page-turn animation with a subtle paper texture. Character portraits are ornate, gold-framed illustrations that feel collectible.

## Navigation Architecture

**Root Navigation**: Drawer + Stack
- **Drawer** (left-side): Save Games, Character Gallery, Settings, How to Play
- **Main Stack**: Story progression screens, puzzle screens, choice screens

**Screen List**:
1. Title Screen - Game logo, New Game/Continue options
2. Tavern Entrance - Initial meeting with owner
3. Character Selection - Choose companion (grid of 7 characters)
4. Story Dialogue - Text-based narrative with character portraits
5. Puzzle Screen - Interactive puzzle gameplay
6. Choice Screen - Decision points (liberate vs. take over)
7. Character Gallery - View unlocked character art/bios
8. Settings - Sound, difficulty, accessibility options

## Screen Specifications

### Title Screen
- **Layout**: Full-screen illustration background (tavern exterior at dusk)
- **Header**: None
- **Content**: Centered vertically
  - Game logo (large, ornate lettering)
  - "New Game" button (parchment-style)
  - "Continue" button (if save exists)
  - Drawer menu icon (top-left corner)
- **Insets**: Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Character Selection Screen
- **Layout**: ScrollView with parchment background texture
- **Header**: Transparent, title "Choose Your Companion"
- **Content**: 
  - Subtitle text: "Seven souls await..."
  - Grid of 7 character portrait cards (2 columns)
  - Each card: Portrait image, name, brief tagline
- **Insets**: Top: headerHeight + Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Story Dialogue Screen
- **Layout**: Stack (non-scrollable)
- **Header**: None
- **Content**:
  - Character portrait (top third, ornate frame)
  - Dialogue text box (middle, parchment background)
  - Choice buttons or "Continue" (bottom)
- **Insets**: Top: insets.top + Spacing.md, Bottom: insets.bottom + Spacing.xl

### Puzzle Screen
- **Layout**: Custom per puzzle type
- **Header**: Transparent, "Back" button left, "Hint" button right
- **Content**: Interactive puzzle area (varies)
- **Floating**: Hint counter (top-right badge)

### Character Gallery (Drawer Screen)
- **Layout**: ScrollView grid
- **Header**: Default, title "Character Gallery"
- **Content**: Grid of unlocked character cards with upload option
- Upload button per card: "Update Portrait" (opens image picker)

### Settings Screen
- **Layout**: ScrollView form
- **Header**: Default, title "Settings"
- **Content**:
  - Profile section (avatar, name)
  - Sound toggle
  - Music volume slider
  - Difficulty selection
  - Delete save data (nested, double confirmation)

## Color Palette

- **Primary**: #8B4513 (Saddle Brown) - medieval wood/leather
- **Accent**: #D4AF37 (Gold) - ornate details, highlights
- **Background**: #2C2416 (Dark Parchment)
- **Surface**: #F4E7D7 (Light Parchment)
- **Text Primary**: #1A1209 (Ink Black)
- **Text Secondary**: #5C4A3A (Faded Ink)
- **Success**: #4A7C4E (Forest Green)
- **Danger**: #8B2500 (Blood Red)

## Typography

- **Display Font**: Cinzel (Google Font) - for titles, character names
- **Body Font**: Merriweather (Google Font) - for dialogue, descriptions
- **Type Scale**:
  - Display: 32px, Bold
  - Title: 24px, Bold
  - Heading: 18px, SemiBold
  - Body: 16px, Regular
  - Caption: 14px, Regular

## Visual Design

- Buttons have ornate border frames (gold accent color)
- Character portraits use gold-frame decorative borders
- Touchable cards have subtle lift on press (scale: 0.98)
- Parchment texture overlay on surface backgrounds (10% opacity)
- Use Feather icons for system actions (menu, back, settings)

## Assets to Generate

1. **icon.png** - Tavern sign icon with ornate "M" monogram | WHERE: App icon
2. **splash-icon.png** - Same as icon.png | WHERE: Splash screen
3. **title-background.png** - Tavern exterior at dusk, lantern-lit | WHERE: Title screen background
4. **portrait-nymph.png** - Petite forest nymph in gold frame | WHERE: Character selection, gallery
5. **portrait-goblin.png** - Slender female goblin, barefoot, cute face | WHERE: Character selection, gallery
6. **portrait-gnome.png** - Female gnome in adventurer attire | WHERE: Character selection, gallery
7. **portrait-dwarf.png** - Female dwarf with braided hair | WHERE: Character selection, gallery
8. **portrait-succubus.png** - Female succubus, mystical | WHERE: Character selection, gallery
9. **portrait-werewolf.png** - Female werewolf, fierce elegance | WHERE: Character selection, gallery
10. **portrait-gatomon.png** - Beast woman inspired by Gatomon | WHERE: Character selection, gallery
11. **portrait-owner.png** - Tavern owner, mysterious expression | WHERE: Dialogue screens
12. **parchment-texture.png** - Subtle paper texture overlay | WHERE: Surface backgrounds
13. **ornate-frame.png** - Gold decorative border for portraits | WHERE: Character portraits
14. **empty-gallery.png** - Locked character silhouette in frame | WHERE: Character gallery empty state
15. **tavern-interior.png** - Cozy tavern interior with fireplace | WHERE: Dialogue screen backgrounds