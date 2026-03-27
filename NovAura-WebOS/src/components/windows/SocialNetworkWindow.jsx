import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Heart, Share2, MoreHorizontal, Send,
  Search, UserPlus, Users, Bell, Image as ImageIcon,
  Smile, Paperclip, Phone, Video, X, Check, CheckCheck,
  Circle, Menu, ArrowLeft, Settings, Bookmark, Flag,
  Home, Compass, Hash, AtSign, Loader2, BellRing, Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import * as SocialAPI from '../../services/socialService';
import {
  requestNotificationPermission, onPushMessage, showLocalNotification,
  getNotificationHistory,
} from '../../services/messagingService';

// ── Components ───────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md', showStatus = false }) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl'
  };
  
  const statusColors = {
    online: 'bg-green-400',
    away: 'bg-yellow-400',
    offline: 'bg-gray-500'
  };
  
  const displayName = user?.displayName || user?.name || 'User';
  const avatar = user?.avatar || user?.photoURL || displayName.charAt(0).toUpperCase();
  const status = user?.status || 'offline';
  
  return (
    <div className="relative">
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-gray-200`}>
        {avatar}
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-[#0a0a0f]`} />
      )}
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onBookmark, onShare }) {
  const isLiked = post.likes?.includes(currentUserId);
  const isBookmarked = post.bookmarks?.includes?.(currentUserId);
  const timeAgo = formatTime(post.createdAt);
  
  return (
    <div className="p-4 border-b border-white/10 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        <Avatar user={{ name: post.authorName, avatar: post.authorAvatar }} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-200">{post.authorName}</span>
            <span className="text-gray-600 text-sm">·</span>
            <span className="text-gray-600 text-sm">{timeAgo}</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            {post.text}
          </p>
          
          {post.imageUrl && (
            <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
              <img src={post.imageUrl} alt="Post" className="w-full max-h-80 object-cover" />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likeCount || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount || 0}</span>
            </button>
            <button 
              onClick={() => onShare(post)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{post.shares || 0}</span>
            </button>
            <button 
              onClick={() => onBookmark(post.id)}
              className={`ml-auto transition-colors ${isBookmarked ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, isMe }) {
  const time = formatTime(message.createdAt);
  
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
        isMe 
          ? 'bg-primary text-white rounded-br-md' 
          : 'bg-white/10 text-gray-200 rounded-bl-md'
      }`}>
        <p>{message.text}</p>
        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
          <span>{time}</span>
          {isMe && (
            message.read 
              ? <CheckCheck className="w-3 h-3" />
              : <Check className="w-3 h-3" />
          )}
        </div>
      </div>
    </div>
  );
}

function UserListItem({ user, onClick, selected, unread = 0 }) {
  return (
    <button
      onClick={() => onClick(user)}
      className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${selected ? 'bg-white/10 border-l-2 border-primary' : ''}`}
    >
      <Avatar user={user} size="md" showStatus />
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-200 text-sm truncate">{user.displayName || user.name}</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded-full">{unread}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{user.lastMessage || user.bio || ''}</p>
      </div>
    </button>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const now = Date.now();
  const time = typeof timestamp === 'object' && timestamp.toMillis 
    ? timestamp.toMillis() 
    : timestamp;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString();
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function SocialNetworkWindow() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedChat, setSelectedChat] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dmThreads, setDmThreads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  
  // Initialize
  useEffect(() => {
    loadCurrentUser();
    loadFeed();
    setupRealtimeListeners();
    setupPushNotifications();
  }, []);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);
  
  const loadCurrentUser = async () => {
    const profile = await SocialAPI.getProfile();
    setCurrentUser(profile);
  };
  
  const loadFeed = async () => {
    setLoading(true);
    try {
      const feed = await SocialAPI.getFeed(50);
      setPosts(feed);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const setupRealtimeListeners = () => {
    // Listen for feed updates
    const unsubscribeFeed = SocialAPI.onFeedUpdate((updatedPosts) => {
      setPosts(updatedPosts);
    });
    
    return () => {
      unsubscribeFeed();
    };
  };
  
  const setupPushNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setNotificationsEnabled(true);
      
      // Listen for foreground messages
      onPushMessage((notification) => {
        showLocalNotification(notification.title, notification.body);
      });
    }
  };
  
  const handleLike = async (postId) => {
    try {
      await SocialAPI.likePost(postId);
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const isLiked = p.likes?.includes(currentUser?.id);
          return {
            ...p,
            likes: isLiked 
              ? p.likes.filter(id => id !== currentUser?.id)
              : [...(p.likes || []), currentUser?.id],
            likeCount: isLiked ? (p.likeCount || 0) - 1 : (p.likeCount || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to like post', variant: 'destructive' });
    }
  };
  
  const handleBookmark = (postId) => {
    toast({ title: 'Bookmarked', description: 'Post saved to your bookmarks' });
  };
  
  const handleShare = (post) => {
    navigator.clipboard.writeText(`${post.text} - via Nova Social`);
    toast({ title: 'Shared', description: 'Post copied to clipboard' });
  };
  
  const handleSendPost = async () => {
    if (!newPost.trim()) return;
    
    try {
      await SocialAPI.createPost({ text: newPost });
      setNewPost('');
      toast({ title: 'Posted!', description: 'Your post has been shared' });
      loadFeed();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      await SocialAPI.sendDirectMessage(selectedChat.id, newMessage);
      setNewMessage('');
      // Reload messages
      const msgs = await SocialAPI.getDMMessages(selectedChat.id);
      setMessages(msgs);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };
  
  const handleSelectChat = async (user) => {
    setSelectedChat(user);
    setShowMobileChat(true);
    
    try {
      const msgs = await SocialAPI.getDMMessages(user.id);
      setMessages(msgs);
      
      // Set up real-time listener for this conversation
      const unsubscribe = SocialAPI.onDMMessages(user.id, (updatedMsgs) => {
        setMessages(updatedMsgs);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };
  
  const loadDMThreads = async () => {
    try {
      const threads = await SocialAPI.getDMThreads();
      setDmThreads(threads);
    } catch (err) {
      console.error('Failed to load DM threads:', err);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'messages') {
      loadDMThreads();
    }
  }, [activeTab]);
  
  // ── Feed View ─────────────────────────────────────────────────────────────
  const FeedView = () => (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Create Post */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-3">
          <Avatar user={currentUser} size="md" />
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening?"
              className="w-full bg-transparent border-none outline-none text-gray-200 placeholder-gray-600 resize-none min-h-[60px]"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full text-primary">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full text-primary">
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              <Button 
                onClick={handleSendPost}
                disabled={!newPost.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts Feed */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUser?.id}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))
        )}
      </div>
    </div>
  );
  
  // ── Messages View ──────────────────────────────────────────────────────────
  const MessagesView = () => (
    <div className="flex-1 flex min-w-0">
      {/* Chat List */}
      <div className={`w-72 border-r border-white/10 flex flex-col ${showMobileChat ? 'hidden' : 'flex'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {dmThreads.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet
            </div>
          ) : (
            dmThreads.map(thread => {
              const otherParticipant = thread.participants?.find?.(p => p !== currentUser?.id) || thread.participants?.[0];
              return (
                <UserListItem
                  key={thread.id}
                  user={{ 
                    id: otherParticipant, 
                    name: thread.participantNames?.[otherParticipant] || otherParticipant,
                    displayName: thread.participantNames?.[otherParticipant] || otherParticipant,
                    lastMessage: thread.lastMessage 
                  }}
                  selected={selectedChat?.id === otherParticipant}
                  unread={thread.unread || 0}
                  onClick={(u) => handleSelectChat(u)}
                />
              );
            })
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      {selectedChat ? (
        <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden' : 'flex'}`}>
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            {showMobileChat && (
              <button 
                onClick={() => setShowMobileChat(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <Avatar user={selectedChat} size="sm" showStatus />
            <div className="flex-1">
              <h3 className="font-medium text-gray-200">{selectedChat.displayName || selectedChat.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{selectedChat.status || 'offline'}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Start a conversation</p>
              </div>
            ) : (
              messages.map(msg => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  isMe={msg.senderId === currentUser?.id || msg.sender === 'me'} 
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full text-gray-400">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary/30"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-full text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">Your Messages</h3>
          <p className="text-sm text-gray-500">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
  
  // ── Friends View ───────────────────────────────────────────────────────────
  const FriendsView = () => {
    const [friends, setFriends] = useState([]);
    
    useEffect(() => {
      loadFriends();
    }, []);
    
    const loadFriends = async () => {
      try {
        const friendIds = await SocialAPI.getFriends();
        // Load profiles for each friend
        const friendProfiles = await Promise.all(
          friendIds.map(id => SocialAPI.getProfile(id))
        );
        setFriends(friendProfiles.filter(Boolean));
      } catch (err) {
        console.error('Failed to load friends:', err);
      }
    };
    
    return (
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-200">Friends</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add Friend
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No friends yet. Start connecting!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Avatar user={user} size="md" showStatus />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-200">{user.displayName || user.name}</h3>
                    <p className="text-sm text-gray-500">{user.bio || 'No bio'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSelectChat(user)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // ── Channels View (Live Group Chat) ────────────────────────────────────────
  const ChannelsView = () => {
    const rooms = SocialAPI.getChatRooms();
    const [activeRoom, setActiveRoom] = useState(rooms[0]?.id || 'general');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatScrollRef = useRef(null);

    useEffect(() => {
      const unsub = SocialAPI.onChatMessages(activeRoom, (msgs) => {
        setChatMessages(msgs);
      });
      return unsub;
    }, [activeRoom]);

    useEffect(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendChat = async () => {
      if (!chatInput.trim()) return;
      await SocialAPI.sendChatMessage(activeRoom, chatInput.trim());
      setChatInput('');
    };

    const currentRoom = rooms.find(r => r.id === activeRoom);

    return (
      <div className="flex-1 flex min-w-0">
        {/* Room list */}
        <div className="w-56 border-r border-white/10 flex flex-col">
          <div className="px-3 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-gray-300">Channels</h3>
            <p className="text-[10px] text-gray-600">Live community chat</p>
          </div>
          <div className="flex-1 overflow-auto">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                  activeRoom === room.id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{room.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${activeRoom === room.id ? 'text-primary' : 'text-gray-300'}`}>{room.name}</p>
                  <p className="text-[10px] text-gray-600 truncate">{room.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <Hash className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-200">{currentRoom?.name || activeRoom}</span>
            <span className="text-xs text-gray-600">— {currentRoom?.desc}</span>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-auto px-4 py-3 space-y-1">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Hash className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No messages yet. Say something!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => {
              const showAuthor = i === 0 || chatMessages[i - 1]?.authorId !== msg.authorId;
              return (
                <div key={msg.id || i} className={showAuthor ? 'mt-3' : ''}>
                  {showAuthor && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <Avatar user={{ name: msg.authorName, avatar: msg.authorAvatar }} size="sm" showStatus />
                      <span className="text-sm font-semibold text-gray-200">{msg.authorName}</span>
                      <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
                    </div>
                  )}
                  <p className={`text-sm text-gray-400 ${showAuthor ? 'ml-11' : 'ml-11'}`}>{msg.text}</p>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <Plus className="w-4 h-4 text-gray-500" />
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder={`Message #${currentRoom?.name || activeRoom}`}
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
              />
              <button onClick={handleSendChat} disabled={!chatInput.trim()} className="text-primary disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Notifications View ──────────────────────────────────────────────────────
  const NotificationsView = () => {
    const [notifications, setNotifications] = useState([]);
    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
      setNotifications(getNotificationHistory());
      setPushEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');
    }, []);

    const enablePush = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        setPushEnabled(true);
        showLocalNotification('NovAura', 'Push notifications enabled!');
      }
    };

    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-primary/60" />
              <div>
                <p className="text-sm font-medium text-gray-200">Push Notifications</p>
                <p className="text-xs text-gray-500">{pushEnabled ? 'Enabled — you\'ll get alerts' : 'Enable to receive real-time alerts'}</p>
              </div>
            </div>
            {!pushEnabled ? (
              <Button onClick={enablePush} size="sm" variant="outline">Enable</Button>
            ) : (
              <span className="text-xs text-green-400 font-medium">Active</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id || i} className={`flex gap-3 px-4 py-3 border-b border-white/[0.05] ${n.read ? 'opacity-50' : ''} hover:bg-white/[0.02]`}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-primary/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.body}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{formatTime(n.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Left Sidebar */}
      <div className="w-16 md:w-64 border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="font-semibold text-gray-200 hidden md:block">Nova Social</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'feed', icon: Home, label: 'Feed' },
            { id: 'channels', icon: Hash, label: 'Channels' },
            { id: 'messages', icon: MessageSquare, label: 'Messages' },
            { id: 'friends', icon: Users, label: 'Friends' },
            { id: 'notifications', icon: Bell, label: 'Alerts' },
            { id: 'explore', icon: Compass, label: 'Explore' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Avatar user={currentUser} size="sm" showStatus />
            <div className="hidden md:block flex-1 min-w-0">
              <p className="font-medium text-gray-200 text-sm truncate">
                {currentUser?.displayName || 'You'}
              </p>
              <p className="text-xs text-gray-500">
                {notificationsEnabled ? '🔔 On' : '🔔 Off'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'feed' && <FeedView />}
      {activeTab === 'channels' && <ChannelsView />}
      {activeTab === 'messages' && <MessagesView />}
      {activeTab === 'friends' && <FriendsView />}
      {activeTab === 'notifications' && <NotificationsView />}
      {activeTab === 'explore' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Compass className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">Explore</h3>
            <p className="text-sm text-gray-500">Discover new connections</p>
          </div>
        </div>
      )}
    </div>
  );
}
