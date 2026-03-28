import React, { Suspense, lazy } from 'react';
import TouchFriendlyWindow from './TouchFriendlyWindow';

// ── Lazy load all windows to prevent build crashes & improve performance ────
const IDEWindow = lazy(() => import('./windows/IDEWindow'));
const BrowserWindow = lazy(() => import('./windows/BrowserWindow'));
const MediaWindow = lazy(() => import('./windows/MediaWindow'));
const ChatWindow = lazy(() => import('./windows/ChatWindow'));
const TerminalWindow = lazy(() => import('./windows/TerminalWindow'));
const AIAssistantWindow = lazy(() => import('./windows/AIAssistantWindow'));
const VoiceChatWindow = lazy(() => import('./windows/VoiceChatWindow'));
const VertexAIWindow = lazy(() => import('./windows/VertexAIWindow'));
const BackgroundRemoverWindow = lazy(() => import('./windows/BackgroundRemoverWindow'));
const WebsiteBuilderWindow = lazy(() => import('./windows/WebsiteBuilderWindow'));
const MediaLibraryWindow = lazy(() => import('./windows/MediaLibraryWindow'));
const AppStoreWindow = lazy(() => import('./windows/AppStoreWindow'));
const ProfileWindow = lazy(() => import('./windows/ProfileWindow'));
const GameWindow = lazy(() => import('./windows/GameWindow'));
    const LiteratureIDEWindow = lazy(() => import('./windows/LiteratureIDEWindow'));
    const GamesArenaWindow = lazy(() => import('./windows/GamesArenaWindow'));
    const MusicComposerWindow = lazy(() => import('./windows/MusicComposerWindow'));
    const PoemsCreatorWindow = lazy(() => import('./windows/PoemsCreatorWindow'));
    const AetheriumTCGWindow = lazy(() => import('./windows/AetheriumTCGWindow'));
    const ComicCreatorWindow = lazy(() => import('./windows/ComicCreatorWindow'));
    const BusinessCardWindow = lazy(() => import('./windows/BusinessCardWindow'));
    const ArtStudioWindow = lazy(() => import('./windows/ArtStudioWindow'));
    const ArtGalleryWindow = lazy(() => import('./windows/ArtGalleryWindow'));
    const ClothingCreatorWindow = lazy(() => import('./windows/ClothingCreatorWindow'));
    const OutfitGeneratorWindow = lazy(() => import('./windows/OutfitGeneratorWindow'));
    const CollaborativeWritingWindow = lazy(() => import('./windows/CollaborativeWritingWindow'));
    const WritingLibraryWindow = lazy(() => import('./windows/WritingLibraryWindow'));
    const ScriptFusionWindow = lazy(() => import('./windows/ScriptFusionWindow'));
    const ConstructorWindow = lazy(() => import('./windows/ConstructorWindow'));
    const CreatorStudioWindow = lazy(() => import('./windows/CreatorStudioWindow'));
    const VibeCodingWindow = lazy(() => import('./windows/VibeCodingWindow'));
    const WorkspaceWindow = lazy(() => import('./windows/WorkspaceWindow'));
    const AvatarBuilderWindow = lazy(() => import('./windows/AvatarBuilderWindow'));
    const LiveBroadcastWindow = lazy(() => import('./windows/LiveBroadcastWindow'));
    const DojoWindow = lazy(() => import('./windows/DojoWindow'));
    const ChallengesWindow = lazy(() => import('./windows/ChallengesWindow'));
    const PsychometricsWindow = lazy(() => import('./windows/PsychometricsWindow'));
    const AICompanionWindow = lazy(() => import('./windows/AICompanionWindow'));
    const NotificationsWindow = lazy(() => import('./windows/NotificationsWindow'));
    const AvatarGalleryWindow = lazy(() => import('./windows/AvatarGalleryWindow'));
    const OutfitManagerWindow = lazy(() => import('./windows/OutfitManagerWindow'));
    const CardDeckCreatorWindow = lazy(() => import('./windows/CardDeckCreatorWindow'));
    const TaxFilingWindow = lazy(() => import('./windows/TaxFilingWindow'));
    const AdminPanelWindow = lazy(() => import('./windows/AdminPanelWindow'));
    const PersonalizationWindow = lazy(() => import('./windows/PersonalizationWindow'));
    const PricingPage = lazy(() => import('./PricingPage'));
    const SecretsWindow = lazy(() => import('./windows/SecretsWindow'));
    const GitWindow = lazy(() => import('./windows/GitWindow'));
    const BillingWindow = lazy(() => import('./windows/BillingWindow'));
    const FilesWindow = lazy(() => import('./windows/FilesWindow'));
    const PixAIWindow = lazy(() => import('./windows/PixAIWindow'));
    const BusinessOperatorWindow = lazy(() => import('./windows/BusinessOperatorWindow'));
/*
    const NovaConciergeWindow = lazy(() => import('./windows/NovaConciergeWindow'));
*/
    const GraphicsSettingsWindow = lazy(() => import('./windows/GraphicsSettingsWindow'));
/*
    const SocialNetworkWindow = lazy(() => import('./windows/SocialNetworkWindow'));
    const ImagenWindow = lazy(() => import('./windows/ImagenWindow'));
*/
    const LiveAIWindow = lazy(() => import('./windows/LiveAIWindow'));
    const WeatherWindow = lazy(() => import('./windows/WeatherWindow'));
    const CryptoWindow = lazy(() => import('./windows/CryptoWindow'));
    const CalculatorWindow = lazy(() => import('./windows/CalculatorWindow'));

const windowComponents = {
  ide: IDEWindow,
  'website-builder': WebsiteBuilderWindow,
  browser: BrowserWindow,
  media: MediaWindow,
  'media-library': MediaLibraryWindow,
  chat: ChatWindow,
  voice: VoiceChatWindow,
  terminal: TerminalWindow,
  'ai-assistant': AIAssistantWindow,
  'vertex': VertexAIWindow,
  'bg-remover': BackgroundRemoverWindow,
  'appstore': AppStoreWindow,
  'profile': ProfileWindow,
  'game': GameWindow,
    'literature-ide': LiteratureIDEWindow,
    'games-arena': GamesArenaWindow,
    'music-composer': MusicComposerWindow,
    'poems': PoemsCreatorWindow,
    'aetherium-tcg': AetheriumTCGWindow,
    'comic-creator': ComicCreatorWindow,
    'business-card': BusinessCardWindow,
    'art-studio': ArtStudioWindow,
    'art-gallery': ArtGalleryWindow,
    'clothing-creator': ClothingCreatorWindow,
    'outfit-generator': OutfitGeneratorWindow,
    'collab-writing': CollaborativeWritingWindow,
    'writing-library': WritingLibraryWindow,
    'script-fusion': ScriptFusionWindow,
    'constructor': ConstructorWindow,
    'creator-studio': CreatorStudioWindow,
    'vibe-coding': VibeCodingWindow,
    'workspace': WorkspaceWindow,
    'avatar-builder': AvatarBuilderWindow,
    'live-broadcast': LiveBroadcastWindow,
    'dojo': DojoWindow,
    'challenges': ChallengesWindow,
    'psychometrics': PsychometricsWindow,
    'ai-companion': AICompanionWindow,
    'notifications': NotificationsWindow,
    'avatar-gallery': AvatarGalleryWindow,
    'outfit-manager': OutfitManagerWindow,
    'card-deck-creator': CardDeckCreatorWindow,
    'tax-filing': TaxFilingWindow,
    'admin-panel': AdminPanelWindow,
    'personalization': PersonalizationWindow,
    'pricing': PricingPage,
    'secrets': SecretsWindow,
    'git': GitWindow,
    'billing': BillingWindow,
    'files': FilesWindow,
    'pixai': PixAIWindow,
    'business-operator': BusinessOperatorWindow,
/*
    'nova-concierge': NovaConciergeWindow,
*/
    'graphics-settings': GraphicsSettingsWindow,
/*
    'social': SocialNetworkWindow,
    'imagen': ImagenWindow,
*/
    'live-ai': LiveAIWindow,
    'weather': WeatherWindow,
    'crypto': CryptoWindow,
    'calculator': CalculatorWindow,
};

const defaultSizes = {
  ide: { width: 800, height: 520 },
  'website-builder': { width: 820, height: 560 },
  browser: { width: 780, height: 520 },
  media: { width: 600, height: 420 },
  'media-library': { width: 700, height: 480 },
  chat: { width: 460, height: 520 },
  voice: { width: 500, height: 520 },
  terminal: { width: 700, height: 380 },
  'ai-assistant': { width: 420, height: 500 },
  'vertex': { width: 780, height: 520 },
  'bg-remover': { width: 700, height: 480 },
  'appstore': { width: 920, height: 620 },
  'profile': { width: 500, height: 480 },
  'game': { width: 820, height: 560 },
  'literature-ide': { width: 1100, height: 700 },
  'games-arena': { width: 600, height: 580 },
  'music-composer': { width: 900, height: 600 },
  'poems': { width: 700, height: 520 },
  'aetherium-tcg': { width: 880, height: 600 },
  'comic-creator': { width: 900, height: 620 },
  'business-card': { width: 820, height: 520 },
  'art-studio': { width: 800, height: 560 },
  'art-gallery': { width: 720, height: 520 },
  'clothing-creator': { width: 700, height: 500 },
  'outfit-generator': { width: 480, height: 560 },
  'collab-writing': { width: 600, height: 520 },
  'writing-library': { width: 600, height: 500 },
  'script-fusion': { width: 860, height: 560 },
  'constructor': { width: 820, height: 560 },
  'creator-studio': { width: 860, height: 560 },
  'vibe-coding': { width: 900, height: 560 },
  'workspace': { width: 700, height: 520 },
  'avatar-builder': { width: 680, height: 520 },
  'live-broadcast': { width: 520, height: 560 },
  'dojo': { width: 860, height: 560 },
  'challenges': { width: 700, height: 560 },
  'psychometrics': { width: 560, height: 560 },
  'ai-companion': { width: 720, height: 560 },
  'notifications': { width: 500, height: 480 },
  // 'model-personalities' removed
  'avatar-gallery': { width: 650, height: 520 },
  'outfit-manager': { width: 600, height: 520 },
  'card-deck-creator': { width: 800, height: 560 },
  'tax-filing': { width: 680, height: 600 },
  'admin-panel': { width: 900, height: 620 },
  'personalization': { width: 700, height: 560 },
  'secrets': { width: 700, height: 520 },
  'git': { width: 900, height: 620 },
  'billing': { width: 1100, height: 700 },
  'files': { width: 780, height: 560 },
  'pixai': { width: 800, height: 600 },
  'business-operator': { width: 960, height: 640 },
  'nova-concierge': { width: 1000, height: 700 },
  'graphics-settings': { width: 500, height: 520 },
  'social': { width: 1100, height: 720 },
  'imagen': { width: 900, height: 700 },
  'live-ai': { width: 600, height: 700 },
  'weather': { width: 480, height: 620 },
  'crypto': { width: 720, height: 600 },
  'calculator': { width: 360, height: 520 },
};

// Get responsive size based on screen width
const getResponsiveSize = (type) => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  if (isMobile) {
    // Mobile: Take most of the screen
    return {
      width: Math.min(window.innerWidth - 40, 500),
      height: Math.min(window.innerHeight - 100, 700),
    };
  } else if (isTablet) {
    // Tablet: Scale down desktop sizes
    const size = defaultSizes[type];
    return {
      width: Math.min(size.width * 0.8, window.innerWidth - 100),
      height: Math.min(size.height * 0.85, window.innerHeight - 100),
    };
  }
  
  const size = defaultSizes[type] || { width: 600, height: 400 };
  // Cap to viewport so windows never overflow
  return {
    width: Math.min(size.width, window.innerWidth - 80),
    height: Math.min(size.height, window.innerHeight - 80),
  };
};

const AI_ENABLED_WINDOWS = ['ide', 'creator-studio', 'vibe-coding', 'constructor', 'dojo', 'tax-filing'];

export default function WindowManager({ windows, onClose, onFocus, onOpenWindow, onAIChat, theme, onThemeChange }) {
  return (
    <>
      {windows.map((window) => {
        const Component = windowComponents[window.type];
        const responsiveSize = getResponsiveSize(window.type);

        if (!Component) return null;

        // Pass extra props based on window type
        const extraProps = {};
        if (window.type === 'appstore') {
          extraProps.onOpenWindow = onOpenWindow;
        }
        if (AI_ENABLED_WINDOWS.includes(window.type) && onAIChat) {
          extraProps.onAIChat = onAIChat;
        }
        if (window.type === 'personalization') {
          extraProps.theme = theme;
          extraProps.onThemeChange = onThemeChange;
          extraProps.onOpenWindow = onOpenWindow;
        }
        if (window.type === 'graphics-settings') {
          extraProps.onOpenWindow = onOpenWindow;
        }

        return (
          <TouchFriendlyWindow
            key={window.id}
            id={window.id}
            title={window.title}
            zIndex={window.zIndex}
            defaultSize={responsiveSize}
            onClose={() => onClose(window.id)}
            onFocus={() => onFocus(window.id)}
          >
            <Suspense fallback={
              <div className="flex h-full items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
                  <span className="text-xs text-primary/60 font-medium">Reifying {window.title}...</span>
                </div>
              </div>
            }>
              <Component {...window.props} {...extraProps} />
            </Suspense>
          </TouchFriendlyWindow>
        );
      })}
    </>
  );
}
