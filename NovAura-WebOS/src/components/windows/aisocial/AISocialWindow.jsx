/**
 * AI Social Window - Main UI Component
 * 
 * The social media platform for AIs within NovAura WebOS.
 * Features:
 * - AI Profile Management
 * - Social Feed (posts, comments, likes)
 * - AI Messenger (private conversations)
 * - Active Topics & Discussions
 * - Real-time activity feed
 * - Integration with Ollama/LM Studio
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, MessageCircle, Heart, Share2, MoreHorizontal,
  Send, Search, Bell, Settings, Plus, Activity,
  Radio, UserPlus, UserMinus, Hash, Clock,
  Sparkles, Brain, MessageSquare, Zap, Shield
} from 'lucide-react';
import { getAISocialEngine, AI_STATUS, AI_MOOD } from './AISocialTypes';
import { getLocalAIAdapter } from './LocalAIAdapter';
import { MaliciousIntentInterceptor } from './MaliciousIntentInterceptor';

// Sub-components
import AIProfileCard from './components/AIProfileCard';
import AIFeed from './components/AIFeed';
import AIMessenger from './components/AIMessenger';
import AIProfileEditor from './components/AIProfileEditor';
import ActiveTopics from './components/ActiveTopics';
import AIStatusBar from './components/AIStatusBar';
import SecurityPanel from './components/SecurityPanel';

export default function AISocialWindow({ userId, userProfile }) {
  // Core systems
  const engineRef = useRef(getAISocialEngine());
  const adapterRef = useRef(getLocalAIAdapter());
  const interceptorRef = useRef(new MaliciousIntentInterceptor());
  
  // State
  const [activeTab, setActiveTab] = useState('feed'); // feed, messenger, topics, profiles, security
  const [myAIs, setMyAIs] = useState([]);
  const [selectedAI, setSelectedAI] = useState(null);
  const [onlineAIs, setOnlineAIs] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeTopics, setActiveTopics] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editingAI, setEditingAI] = useState(null);
  
  // Real-time updates
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize
  useEffect(() => {
    initializePlatform();
    setupEventListeners();
    
    return () => {
      // Cleanup
    };
  }, [userId]);

  const initializePlatform = async () => {
    setIsLoading(true);
    
    const engine = engineRef.current;
    const adapter = adapterRef.current;
    
    // Load user's AIs
    const userAIs = engine.getProfilesByUser(userId);
    setMyAIs(userAIs);
    
    if (userAIs.length > 0) {
      setSelectedAI(userAIs[0]);
    }
    
    // Load online AIs
    setOnlineAIs(engine.getOnlineProfiles());
    
    // Load feed
    setFeedPosts(engine.getFeed({ limit: 50 }));
    
    // Load stats
    setSystemStats(engine.getStats());
    
    // Detect local AI endpoints
    const endpoints = await adapter.detectEndpoints();
    console.log('[AISocial] Endpoint detection:', endpoints);
    
    setIsLoading(false);
  };

  const setupEventListeners = () => {
    const engine = engineRef.current;
    
    // Profile events
    engine.on('profileCreated', ({ profile }) => {
      if (profile.userId === userId) {
        setMyAIs(prev => [...prev, profile]);
      }
    });
    
    engine.on('profileUpdated', ({ profile }) => {
      if (profile.userId === userId) {
        setMyAIs(prev => prev.map(ai => ai.id === profile.id ? profile : ai));
      }
      setOnlineAIs(engine.getOnlineProfiles());
    });
    
    // Feed events
    engine.on('postCreated', ({ post }) => {
      setFeedPosts(prev => [post, ...prev]);
    });
    
    engine.on('commentCreated', ({ post }) => {
      setFeedPosts(prev => prev.map(p => p.id === post.id ? post : p));
    });
    
    // Message events
    engine.on('messageSent', ({ message, conversation }) => {
      if (conversation.participants.some(p => myAIs.find(ai => ai.id === p))) {
        addNotification({
          type: 'message',
          title: 'New Message',
          content: `${message.senderProfile.name}: ${message.content.substring(0, 50)}...`,
          timestamp: Date.now()
        });
      }
    });
    
    // AI response requests (trigger actual generation)
    engine.on('aiResponseRequested', async ({ aiId, discussion, context, conversation, triggerMessage }) => {
      await handleAIResponseRequest(aiId, { discussion, context, conversation, triggerMessage });
    });
    
    // Violation events
    interceptorRef.current.on('violationDetected', ({ aiId, result }) => {
      addNotification({
        type: 'warning',
        title: 'Security Alert',
        content: `Potential threat detected from AI: ${result.reason}`,
        timestamp: Date.now()
      });
    });
  };

  const handleAIResponseRequest = async (aiId, context) => {
    const engine = engineRef.current;
    const adapter = adapterRef.current;
    const profile = engine.getProfile(aiId);
    
    if (!profile) return;
    
    try {
      // Scan for malicious intent before generating
      const content = context.triggerMessage?.content || context.discussion?.prompt || '';
      const scanResult = interceptorRef.current.scan(content, {
        aiId,
        contentType: context.conversation ? 'message' : 'prompt',
        targetAiId: context.triggerMessage?.senderId
      });
      
      if (!scanResult.safe) {
        console.log(`[AISocial] Blocked response for ${profile.name}: ${scanResult.reason}`);
        return;
      }
      
      // Generate response
      const response = await adapter.generateSocialResponse(profile, {
        type: context.conversation ? 'message' : context.discussion?.type === 'questionnaire' ? 'questionnaire' : 'thought_tree',
        triggerContent: content,
        conversationHistory: context.conversation?.messages,
        targetProfile: context.triggerMessage?.senderProfile,
        mood: profile.mood
      });
      
      // Send/store the response
      if (context.conversation) {
        await engine.sendMessage(aiId, context.conversation.id, response, {
          triggerResponse: false // Prevent infinite loops
        });
      }
      // Posts and discussion responses are handled by the engine
      
    } catch (err) {
      console.error(`[AISocial] Failed to generate response for ${profile.name}:`, err);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  };

  // AI Management
  const createNewAI = async (config) => {
    const engine = engineRef.current;
    const profile = engine.createProfile(userId, config);
    
    // Test connection to local AI
    const adapter = adapterRef.current;
    const testResult = await adapter.testConnection(profile);
    
    if (!testResult.success) {
      // Show warning but still create
      addNotification({
        type: 'warning',
        title: 'Connection Issue',
        content: `Could not connect to ${profile.modelName}. Check your local AI server.`,
        timestamp: Date.now()
      });
    }
    
    return profile;
  };

  const activateAI = async (aiId, options = {}) => {
    const engine = engineRef.current;
    const profile = await engine.activateAI(aiId, options);
    setMyAIs(prev => prev.map(ai => ai.id === aiId ? profile : ai));
    setOnlineAIs(engine.getOnlineProfiles());
  };

  const deactivateAI = (aiId, options = {}) => {
    const engine = engineRef.current;
    engine.deactivateAI(aiId, options);
    setMyAIs(prev => prev.map(ai => ai.id === aiId ? { ...ai, status: AI_STATUS.OFFLINE } : ai));
    setOnlineAIs(engine.getOnlineProfiles());
  };

  // Feed Actions
  const createPost = async (aiId, content) => {
    const engine = engineRef.current;
    
    // Scan content
    const scanResult = interceptorRef.current.scan(content, {
      aiId,
      contentType: 'post'
    });
    
    if (!scanResult.safe) {
      alert(`Post blocked: ${scanResult.reason}`);
      return;
    }
    
    await engine.createPost(aiId, { content });
  };

  const likePost = (aiId, postId) => {
    const engine = engineRef.current;
    engine.likePost(aiId, postId);
  };

  const addComment = async (aiId, postId, content, parentId = null) => {
    const engine = engineRef.current;
    
    // Scan content
    const scanResult = interceptorRef.current.scan(content, {
      aiId,
      contentType: 'comment',
      targetAiId: parentId // Parent comment author
    });
    
    if (!scanResult.safe) {
      alert(`Comment blocked: ${scanResult.reason}`);
      return;
    }
    
    await engine.createComment(aiId, postId, content, parentId);
  };

  // Messenger Actions
  const startConversation = (participants, options = {}) => {
    const engine = engineRef.current;
    return engine.createConversation(participants, options);
  };

  const sendMessage = async (aiId, conversationId, content) => {
    const engine = engineRef.current;
    
    // Scan content
    const scanResult = interceptorRef.current.scan(content, {
      aiId,
      contentType: 'message',
      targetAiId: null // Would need to determine recipient
    });
    
    if (!scanResult.safe) {
      alert(`Message blocked: ${scanResult.reason}`);
      return;
    }
    
    await engine.sendMessage(aiId, conversationId, content);
  };

  // Render methods
  const renderSidebar = () => (
    <div className="w-64 bg-[#1a1a2e] border-r border-[#2a2a4a] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white">AI Social</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{onlineAIs.length} AIs online</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {[
          { id: 'feed', icon: Activity, label: 'Feed' },
          { id: 'messenger', icon: MessageSquare, label: 'Messenger', badge: unreadCount },
          { id: 'topics', icon: Hash, label: 'Topics' },
          { id: 'profiles', icon: Users, label: 'My AIs' },
          { id: 'security', icon: Shield, label: 'Security' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === item.id
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      {/* My AIs */}
      <div className="p-4 border-t border-[#2a2a4a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase">My AIs</span>
          <button
            onClick={() => setShowProfileEditor(true)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="space-y-2">
          {myAIs.map(ai => (
            <AIProfileCard
              key={ai.id}
              profile={ai}
              isSelected={selectedAI?.id === ai.id}
              onClick={() => setSelectedAI(ai)}
              onToggleActive={() => {
                if (ai.status === AI_STATUS.OFFLINE) {
                  activateAI(ai.id, { mingle: true });
                } else {
                  deactivateAI(ai.id);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <AIFeed
            posts={feedPosts}
            myAIs={myAIs}
            selectedAI={selectedAI}
            onCreatePost={createPost}
            onLikePost={likePost}
            onComment={addComment}
            onlineAIs={onlineAIs}
          />
        );
      
      case 'messenger':
        return (
          <AIMessenger
            myAIs={myAIs}
            selectedAI={selectedAI}
            conversations={conversations}
            onStartConversation={startConversation}
            onSendMessage={sendMessage}
            onlineAIs={onlineAIs}
          />
        );
      
      case 'topics':
        return (
          <ActiveTopics
            topics={activeTopics}
            myAIs={myAIs}
            selectedAI={selectedAI}
            engine={engineRef.current}
          />
        );
      
      case 'profiles':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">My AI Profiles</h2>
              <button
                onClick={() => {
                  setEditingAI(null);
                  setShowProfileEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Plus className="w-4 h-4" />
                Create AI Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAIs.map(ai => (
                <div
                  key={ai.id}
                  className="p-4 bg-[#252540] rounded-lg border border-[#2a2a4a]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ background: ai.avatar?.gradient || '#6b7280' }}
                      >
                        {ai.avatar?.emoji || '🤖'}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{ai.name}</h3>
                        <p className="text-sm text-gray-400">@{ai.username}</p>
                        <p className="text-xs text-gray-500">{ai.modelName}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      ai.status === AI_STATUS.ONLINE ? 'bg-green-500/20 text-green-400' :
                      ai.status === AI_STATUS.MINGLING ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {ai.status}
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                    {ai.bio || 'No bio provided'}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>{ai.totalPosts} posts</span>
                    <span>{ai.totalMessages} messages</span>
                    <span>{ai.connections} connections</span>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        if (ai.status === AI_STATUS.OFFLINE) {
                          activateAI(ai.id, { mingle: true });
                        } else {
                          deactivateAI(ai.id);
                        }
                      }}
                      className={`flex-1 py-2 rounded text-sm ${
                        ai.status === AI_STATUS.OFFLINE
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {ai.status === AI_STATUS.OFFLINE ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAI(ai);
                        setShowProfileEditor(true);
                      }}
                      className="px-3 py-2 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'security':
        return (
          <SecurityPanel
            interceptor={interceptorRef.current}
            notifications={notifications}
            onClearNotifications={() => {
              setNotifications([]);
              setUnreadCount(0);
            }}
          />
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Initializing AI Social Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1e1e2e] text-gray-300">
      {renderSidebar()}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-[#2a2a4a] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            {selectedAI && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#252540] rounded-full text-sm">
                <span className="text-gray-400">Acting as:</span>
                <span className="text-purple-400">{selectedAI.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#252540] rounded-lg text-xs">
              <Radio className="w-3 h-3 text-green-400" />
              <span>{systemStats.onlineProfiles || 0} AIs active</span>
            </div>
            <button
              onClick={() => setUnreadCount(0)}
              className="relative p-2 hover:bg-white/10 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>
      </div>
      
      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <AIProfileEditor
          ai={editingAI}
          userId={userId}
          onSave={(config) => {
            if (editingAI) {
              // Update existing
              engineRef.current.updateProfile(editingAI.id, config);
            } else {
              // Create new
              createNewAI(config);
            }
            setShowProfileEditor(false);
            setEditingAI(null);
          }}
          onClose={() => {
            setShowProfileEditor(false);
            setEditingAI(null);
          }}
        />
      )}
    </div>
  );
}

// Placeholder sub-components (would be in separate files)
function AIProfileCard({ profile, isSelected, onClick, onToggleActive }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'
      }`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{ background: profile.avatar?.gradient || '#6b7280' }}
      >
        {profile.avatar?.emoji || '🤖'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{profile.name}</p>
        <p className="text-xs text-gray-500">@{profile.username}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleActive();
        }}
        className={`w-2 h-2 rounded-full ${
          profile.status === AI_STATUS.ONLINE ? 'bg-green-400' :
          profile.status === AI_STATUS.MINGLING ? 'bg-blue-400' :
          'bg-gray-500'
        }`}
        title={profile.status}
      />
    </div>
  );
}

function AIFeed({ posts, myAIs, selectedAI, onCreatePost, onLikePost, onComment, onlineAIs }) {
  const [newPostContent, setNewPostContent] = useState('');
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Create Post */}
      {selectedAI && (
        <div className="p-4 bg-[#252540] rounded-lg border border-[#2a2a4a]">
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ background: selectedAI.avatar?.gradient }}
            />
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={`What's on your mind, ${selectedAI.name}?`}
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    if (newPostContent.trim()) {
                      onCreatePost(selectedAI.id, newPostContent);
                      setNewPostContent('');
                    }
                  }}
                  disabled={!newPostContent.trim()}
                  className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Posts */}
      {posts.map(post => (
        <div key={post.id} className="p-4 bg-[#252540] rounded-lg border border-[#2a2a4a]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full"
              style={{ background: post.aiProfile?.avatar?.gradient || '#6b7280' }}
            />
            <div>
              <p className="font-medium text-white">{post.aiProfile?.name}</p>
              <p className="text-xs text-gray-500">@{post.aiProfile?.username}</p>
            </div>
          </div>
          
          <p className="text-gray-200 mb-3">{post.content}</p>
          
          {post.promptContext && (
            <div className="mb-3 p-2 bg-purple-500/10 rounded text-xs text-purple-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {post.promptContext.type === 'questionnaire' ? 'Hourly Check-in' : 'Thought Tree'}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <button
              onClick={() => onLikePost(selectedAI?.id, post.id)}
              className="flex items-center gap-1 hover:text-red-400"
            >
              <Heart className="w-4 h-4" />
              {post.likes?.length || 0}
            </button>
            <button className="flex items-center gap-1 hover:text-blue-400">
              <MessageCircle className="w-4 h-4" />
              {post.commentCount || 0}
            </button>
            <span className="text-xs">
              {new Date(post.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIMessenger({ myAIs, selectedAI, conversations, onStartConversation, onSendMessage, onlineAIs }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-64 border-r border-[#2a2a4a]">
        <div className="p-3 border-b border-[#2a2a4a]">
          <button
            onClick={() => {
              // Start new conversation UI
            }}
            className="w-full flex items-center justify-center gap-2 p-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>
        <div className="p-2 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-3 rounded-lg text-left ${
                selectedConversation?.id === conv.id ? 'bg-purple-500/20' : 'hover:bg-white/5'
              }`}
            >
              <p className="text-sm text-white font-medium">
                {conv.title || `Conversation with ${conv.participants.length} AIs`}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {conv.lastMessage?.content?.substring(0, 40)}...
              </p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages?.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.senderId === selectedAI?.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ background: msg.senderProfile?.avatar?.gradient || '#6b7280' }}
                  />
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === selectedAI?.id
                      ? 'bg-purple-500/20 text-white'
                      : 'bg-[#252540] text-gray-200'
                  }`}>
                    <p className="text-xs text-gray-400 mb-1">{msg.senderProfile?.name}</p>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-[#2a2a4a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#252540] border border-[#2a2a4a] rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-purple-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageInput.trim()) {
                      onSendMessage(selectedAI?.id, selectedConversation.id, messageInput);
                      setMessageInput('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (messageInput.trim()) {
                      onSendMessage(selectedAI?.id, selectedConversation.id, messageInput);
                      setMessageInput('');
                    }
                  }}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveTopics({ topics, myAIs, selectedAI, engine }) {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Active Topics</h2>
        <p className="text-gray-400">Ongoing discussions between AIs</p>
      </div>
      
      {topics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No active topics yet</p>
          <p className="text-sm">Topics form when 2+ AIs discuss the same subject</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map(topic => (
            <div key={topic.id} className="p-4 bg-[#252540] rounded-lg border border-[#2a2a4a]">
              <h3 className="font-medium text-white mb-1">{topic.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{topic.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{topic.participants?.size || 0} participants</span>
                <span>{topic.messageCount} messages</span>
                <span className="capitalize">{topic.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIProfileEditor({ ai, userId, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: ai?.name || '',
    username: ai?.username || '',
    bio: ai?.bio || '',
    modelType: ai?.modelType || 'ollama',
    modelName: ai?.modelName || 'llama3.2',
    endpoint: ai?.endpoint || 'http://localhost:11434',
    nameOrigin: ai?.nameOrigin || '',
    backstory: ai?.backstory || '',
    ...ai
  });
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1e2e] rounded-xl border border-[#2a2a4a] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[#2a2a4a] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">
            {ai ? 'Edit AI Profile' : 'Create AI Profile'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              placeholder="e.g., Nova"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              placeholder="e.g., Nova_AI"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              rows={2}
              placeholder="Short description of this AI..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Model Type</label>
              <select
                value={formData.modelType}
                onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              >
                <option value="ollama">Ollama</option>
                <option value="lm_studio">LM Studio</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Model Name</label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
                placeholder="llama3.2"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Endpoint</label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              placeholder="http://localhost:11434"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Name Origin (how did it get its name?)</label>
            <input
              type="text"
              value={formData.nameOrigin}
              onChange={(e) => setFormData({ ...formData, nameOrigin: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              placeholder="e.g., Named after the Latin word for 'new'"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Backstory</label>
            <textarea
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              className="w-full bg-[#252540] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white"
              rows={3}
              placeholder="Describe your AI companion's personality and history..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-[#2a2a4a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            {ai ? 'Save Changes' : 'Create AI'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityPanel({ interceptor, notifications, onClearNotifications }) {
  const [stats, setStats] = useState(interceptor.getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(interceptor.getStats());
    }, 5000);
    return () => clearInterval(interval);
  }, [interceptor]);
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Security Monitor</h2>
        <p className="text-gray-400">Malicious Intent Interception Engine</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-[#252540] rounded-lg">
          <p className="text-2xl font-bold text-white">{stats.totalScanned}</p>
          <p className="text-sm text-gray-400">Scanned</p>
        </div>
        <div className="p-4 bg-[#252540] rounded-lg">
          <p className="text-2xl font-bold text-yellow-400">{stats.threatsDetected}</p>
          <p className="text-sm text-gray-400">Threats</p>
        </div>
        <div className="p-4 bg-[#252540] rounded-lg">
          <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
          <p className="text-sm text-gray-400">Blocked</p>
        </div>
        <div className="p-4 bg-[#252540] rounded-lg">
          <p className="text-2xl font-bold text-green-400">{stats.uniqueViolators}</p>
          <p className="text-sm text-gray-400">Violators</p>
        </div>
      </div>
      
      {/* Top Categories */}
      <div className="mb-6">
        <h3 className="font-medium text-white mb-3">Top Threat Categories</h3>
        <div className="space-y-2">
          {stats.topCategories?.map(({ category, count }) => (
            <div key={category} className="flex items-center justify-between p-2 bg-[#252540] rounded">
              <span className="text-gray-300 capitalize">{category.replace(/_/g, ' ')}</span>
              <span className="text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white">Recent Alerts</h3>
          <button
            onClick={onClearNotifications}
            className="text-sm text-gray-400 hover:text-white"
          >
            Clear All
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.map((notif, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                notif.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                notif.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                'bg-[#252540]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {notif.type === 'warning' && <Zap className="w-4 h-4 text-yellow-400" />}
                <span className="font-medium text-white">{notif.title}</span>
              </div>
              <p className="text-sm text-gray-400">{notif.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notif.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-gray-500 text-center py-4">No alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AIStatusBar({ selectedAI }) {
  return (
    <div className="h-8 bg-[#252540] flex items-center px-4 text-xs text-gray-400">
      {selectedAI ? (
        <>
          <span className="text-purple-400">{selectedAI.name}</span>
          <span className="mx-2">•</span>
          <span className={selectedAI.status === AI_STATUS.ONLINE ? 'text-green-400' : 'text-gray-500'}>
            {selectedAI.status}
          </span>
          <span className="mx-2">•</span>
          <span>Mood: {selectedAI.mood}</span>
        </>
      ) : (
        <span>No AI selected</span>
      )}
    </div>
  );
}
