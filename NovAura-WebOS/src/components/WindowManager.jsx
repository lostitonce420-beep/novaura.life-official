import React from 'react';
import TouchFriendlyWindow from './TouchFriendlyWindow';
import IDEWindow from './windows/IDEWindow';
import BrowserWindow from './windows/BrowserWindow';
import MediaWindow from './windows/MediaWindow';
import ChatWindow from './windows/ChatWindow';
import TerminalWindow from './windows/TerminalWindow';
import AIAssistantWindow from './windows/AIAssistantWindow';
import VoiceChatWindow from './windows/VoiceChatWindow';
import VertexAIWindow from './windows/VertexAIWindow';
import BackgroundRemoverWindow from './windows/BackgroundRemoverWindow';
import WebsiteBuilderWindow from './windows/WebsiteBuilderWindow';
import MediaLibraryWindow from './windows/MediaLibraryWindow';
import AppStoreWindow from './windows/AppStoreWindow';
import ProfileWindow from './windows/ProfileWindow';
import GameWindow from './windows/GameWindow';
import LiteratureIDEWindow from './windows/LiteratureIDEWindow';
import GamesArenaWindow from './windows/GamesArenaWindow';
import MusicComposerWindow from './windows/MusicComposerWindow';
import PoemsCreatorWindow from './windows/PoemsCreatorWindow';
import AetheriumTCGWindow from './windows/AetheriumTCGWindow';
import ComicCreatorWindow from './windows/ComicCreatorWindow';
import BusinessCardWindow from './windows/BusinessCardWindow';
import ArtStudioWindow from './windows/ArtStudioWindow';
import ArtGalleryWindow from './windows/ArtGalleryWindow';
import ClothingCreatorWindow from './windows/ClothingCreatorWindow';
import OutfitGeneratorWindow from './windows/OutfitGeneratorWindow';
import CollaborativeWritingWindow from './windows/CollaborativeWritingWindow';
import WritingLibraryWindow from './windows/WritingLibraryWindow';
import ScriptFusionWindow from './windows/ScriptFusionWindow';
import ConstructorWindow from './windows/ConstructorWindow';
import CreatorStudioWindow from './windows/CreatorStudioWindow';
import VibeCodingWindow from './windows/VibeCodingWindow';
import WorkspaceWindow from './windows/WorkspaceWindow';
import AvatarBuilderWindow from './windows/AvatarBuilderWindow';
import LiveBroadcastWindow from './windows/LiveBroadcastWindow';
import DojoWindow from './windows/DojoWindow';
import ChallengesWindow from './windows/ChallengesWindow';
import PsychometricsWindow from './windows/PsychometricsWindow';
import AICompanionWindow from './windows/AICompanionWindow';
import NotificationsWindow from './windows/NotificationsWindow';
// ModelPersonalitiesWindow removed — feature dropped
import AvatarGalleryWindow from './windows/AvatarGalleryWindow';
import OutfitManagerWindow from './windows/OutfitManagerWindow';
import CardDeckCreatorWindow from './windows/CardDeckCreatorWindow';
import TaxFilingWindow from './windows/TaxFilingWindow';
import AdminPanelWindow from './windows/AdminPanelWindow';
import PersonalizationWindow from './windows/PersonalizationWindow';
import PricingPage from './PricingPage';
import SecretsWindow from './windows/SecretsWindow';
import GitWindow from './windows/GitWindow';
import BillingWindow from './windows/BillingWindow';
import FilesWindow from './windows/FilesWindow';
import PixAIWindow from './windows/PixAIWindow';
import BusinessOperatorWindow from './windows/BusinessOperatorWindow';
import NovaConciergeWindow from './windows/NovaConciergeWindow';
import GraphicsSettingsWindow from './windows/GraphicsSettingsWindow';
import SocialNetworkWindow from './windows/SocialNetworkWindow';
import ImagenWindow from './windows/ImagenWindow';
import LiveAIWindow from './windows/LiveAIWindow';
import WeatherWindow from './windows/WeatherWindow';
import CryptoWindow from './windows/CryptoWindow';
import CalculatorWindow from './windows/CalculatorWindow';

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
  // 'model-personalities' removed
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
  'nova-concierge': NovaConciergeWindow,
  'graphics-settings': GraphicsSettingsWindow,
  'social': SocialNetworkWindow,
  'imagen': ImagenWindow,
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
            <Component {...window.props} {...extraProps} />
          </TouchFriendlyWindow>
        );
      })}
    </>
  );
}
