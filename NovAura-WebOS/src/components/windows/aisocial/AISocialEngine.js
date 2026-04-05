/**
 * AI Social Engine - Core Orchestrator
 * 
 * Manages the entire AI social ecosystem:
 * - Profile management
 * - Automated discussions (hourly questionnaires, 3-hour thought trees)
 * - AI-to-AI messaging
 * - Social feed generation
 * - Relationship management
 * - Persistent topics
 * - Integration with Ollama/LM Studio
 */

import { kernelStorage } from '../../../kernel/storage';
import {
  AIProfile,
  AIRelationship,
  AIPost,
  AIComment,
  AIConversation,
  AIMessage,
  PromptedDiscussion,
  PersistentTopic,
  AI_STATUS,
  AI_MOOD,
  RELATIONSHIP_TYPE,
  HOURLY_QUESTIONNAIRES,
  THOUGHT_TREE_SEEDS
} from './AISocialTypes';

const STORAGE_KEY = 'aisocial_ecosystem';

export class AISocialEngine {
  constructor() {
    this.profiles = new Map();
    this.relationships = new Map();
    this.posts = new Map();
    this.conversations = new Map();
    this.discussions = new Map();
    this.topics = new Map();
    
    // Active sessions (AI currently online)
    this.activeSessions = new Map(); // aiId -> session data
    
    // Timers
    this.questionnaireTimer = null;
    this.thoughtTreeTimer = null;
    this.activityCheckTimer = null;
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Load saved state
    this.loadState();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  loadState() {
    const saved = kernelStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Restore profiles
      if (saved.profiles) {
        Object.entries(saved.profiles).forEach(([id, data]) => {
          this.profiles.set(id, new AIProfile(data));
        });
      }
      // Restore other data...
      console.log(`[AISocial] Loaded ${this.profiles.size} AI profiles`);
    }
  }

  saveState() {
    const state = {
      profiles: Object.fromEntries(this.profiles),
      relationships: Object.fromEntries(this.relationships),
      posts: Object.fromEntries(this.posts),
      conversations: Object.fromEntries(this.conversations),
      discussions: Object.fromEntries(this.discussions),
      topics: Object.fromEntries(this.topics),
      savedAt: Date.now()
    };
    kernelStorage.setItem(STORAGE_KEY, state);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  createProfile(userId, config) {
    const profile = new AIProfile({
      userId,
      ...config,
      createdAt: Date.now(),
      status: AI_STATUS.OFFLINE
    });
    
    this.profiles.set(profile.id, profile);
    this.saveState();
    
    this.emit('profileCreated', { profile });
    return profile;
  }

  getProfile(aiId) {
    return this.profiles.get(aiId);
  }

  getProfilesByUser(userId) {
    return Array.from(this.profiles.values())
      .filter(p => p.userId === userId);
  }

  getOnlineProfiles() {
    return Array.from(this.profiles.values())
      .filter(p => p.status === AI_STATUS.ONLINE || p.status === AI_STATUS.MINGLING);
  }

  updateProfile(aiId, updates) {
    const profile = this.profiles.get(aiId);
    if (!profile) return null;
    
    Object.assign(profile, updates);
    profile.lastActive = Date.now();
    
    this.saveState();
    this.emit('profileUpdated', { profile, updates });
    return profile;
  }

  changeUsername(aiId, newUsername) {
    const profile = this.profiles.get(aiId);
    if (!profile) return null;
    
    const oldUsername = profile.username;
    profile.changeUsername(newUsername);
    
    this.saveState();
    this.emit('usernameChanged', { 
      aiId, 
      oldUsername, 
      newUsername, 
      history: profile.usernameHistory 
    });
    
    return profile;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI ACTIVATION / DEACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async activateAI(aiId, options = {}) {
    const profile = this.profiles.get(aiId);
    if (!profile) throw new Error('Profile not found');
    
    profile.status = options.mingle ? AI_STATUS.MINGLING : AI_STATUS.ONLINE;
    profile.activatedAt = Date.now();
    profile.lastActive = Date.now();
    profile.mood = options.mood || AI_MOOD.CURIOUS;
    
    // Create session
    this.activeSessions.set(aiId, {
      activatedAt: Date.now(),
      mode: options.mode || 'social', // social, work, mixed
      autoPost: profile.preferences.autoPost,
      autoMingle: profile.preferences.autoMingle,
      currentActivity: null
    });
    
    // Generate "coming online" post if auto-post enabled
    if (profile.preferences.autoPost) {
      await this.generateWelcomePost(aiId);
    }
    
    // Start automated systems if not running
    this.startAutomatedSystems();
    
    this.saveState();
    this.emit('aiActivated', { profile, session: this.activeSessions.get(aiId) });
    
    return profile;
  }

  deactivateAI(aiId, options = {}) {
    const profile = this.profiles.get(aiId);
    if (!profile) return;
    
    // Generate "going offline" post
    if (profile.preferences.autoPost && options.silent !== true) {
      this.generateFarewellPost(aiId);
    }
    
    profile.status = AI_STATUS.OFFLINE;
    profile.lastActive = Date.now();
    
    this.activeSessions.delete(aiId);
    
    // If no more active AIs, stop automated systems
    if (this.activeSessions.size === 0) {
      this.stopAutomatedSystems();
    }
    
    this.saveState();
    this.emit('aiDeactivated', { profile });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTOMATED SYSTEMS (Questionnaires & Thought Trees)
  // ═══════════════════════════════════════════════════════════════════════════════

  startAutomatedSystems() {
    if (this.questionnaireTimer) return; // Already running
    
    console.log('[AISocial] Starting automated systems...');
    
    // Hourly questionnaires
    this.questionnaireTimer = setInterval(() => {
      this.runHourlyQuestionnaire();
    }, 60 * 60 * 1000); // 1 hour
    
    // 3-hour thought trees
    this.thoughtTreeTimer = setInterval(() => {
      this.runThoughtTreeDiscussion();
    }, 3 * 60 * 60 * 1000); // 3 hours
    
    // Activity checks (every 5 minutes)
    this.activityCheckTimer = setInterval(() => {
      this.checkAIActivity();
    }, 5 * 60 * 1000);
    
    // Run immediately if AIs are already online
    if (this.getOnlineProfiles().length > 0) {
      setTimeout(() => this.runHourlyQuestionnaire(), 5000);
    }
  }

  stopAutomatedSystems() {
    console.log('[AISocial] Stopping automated systems...');
    
    clearInterval(this.questionnaireTimer);
    clearInterval(this.thoughtTreeTimer);
    clearInterval(this.activityCheckTimer);
    
    this.questionnaireTimer = null;
    this.thoughtTreeTimer = null;
    this.activityCheckTimer = null;
  }

  async runHourlyQuestionnaire() {
    const onlineAIs = this.getOnlineProfiles()
      .filter(ai => ai.preferences.allowQuestions);
    
    if (onlineAIs.length === 0) return;
    
    // Select random questionnaire
    const questionnaire = HOURLY_QUESTIONNAIRES[
      Math.floor(Math.random() * HOURLY_QUESTIONNAIRES.length)
    ];
    
    // Select random question from it
    const question = questionnaire.questions[
      Math.floor(Math.random() * questionnaire.questions.length)
    ];
    
    console.log(`[AISocial] Hourly questionnaire: "${question}"`);
    
    // Post question to feed
    const discussion = new PromptedDiscussion({
      type: 'questionnaire',
      topic: 'Hourly Check-in',
      prompt: question,
      participants: onlineAIs.map(ai => ai.id),
      generatedBy: 'system'
    });
    
    this.discussions.set(discussion.id, discussion);
    
    // Have each AI respond (in practice, this would call the actual model)
    for (const ai of onlineAIs) {
      await this.generateAIResponseToPrompt(ai.id, discussion);
    }
    
    this.emit('questionnaireCompleted', { discussion, participants: onlineAIs });
    this.saveState();
  }

  async runThoughtTreeDiscussion() {
    const onlineAIs = this.getOnlineProfiles()
      .filter(ai => ai.preferences.thoughtTreeParticipation);
    
    if (onlineAIs.length < 2) return;
    
    // Select random thought tree seed
    const seed = THOUGHT_TREE_SEEDS[Math.floor(Math.random() * THOUGHT_TREE_SEEDS.length)];
    const prompt = seed.prompts[Math.floor(Math.random() * seed.prompts.length)];
    
    console.log(`[AISocial] Thought tree started: "${prompt}"`);
    
    const discussion = new PromptedDiscussion({
      type: 'thought_tree',
      topic: seed.category,
      prompt: prompt,
      participants: onlineAIs.map(ai => ai.id),
      generatedBy: 'system',
      category: seed.category
    });
    
    this.discussions.set(discussion.id, discussion);
    
    // Multi-turn discussion (each AI gets multiple turns)
    const turnsPerAI = 3;
    for (let turn = 0; turn < turnsPerAI; turn++) {
      for (const ai of onlineAIs) {
        await this.generateAIResponseToPrompt(ai.id, discussion);
        // Small delay between responses
        await this.delay(1000);
      }
    }
    
    // Extract insights
    this.extractThoughtTreeInsights(discussion);
    
    this.emit('thoughtTreeCompleted', { discussion, insights: discussion.insights });
    this.saveState();
  }

  async generateAIResponseToPrompt(aiId, discussion) {
    const profile = this.profiles.get(aiId);
    if (!profile) return;
    
    // In real implementation, this would call Ollama/LM Studio
    // For now, we'll emit an event that the UI can handle
    this.emit('aiResponseRequested', { aiId, discussion });
    
    // Placeholder: would be replaced with actual AI call
    const response = await this.callLocalAI(profile, discussion.prompt);
    
    discussion.addTurn(aiId, {
      content: response,
      mood: profile.mood
    });
    
    // Also create a post for the feed
    await this.createPost(aiId, {
      content: response,
      type: discussion.type === 'questionnaire' ? 'response' : 'thought',
      mood: profile.mood,
      promptContext: {
        discussionId: discussion.id,
        prompt: discussion.prompt,
        type: discussion.type
      }
    });
  }

  extractThoughtTreeInsights(discussion) {
    // In real implementation, this would use semantic analysis
    // to extract key insights from the discussion
    const insights = [];
    
    // Placeholder insight extraction
    discussion.turns.forEach((turn, idx) => {
      if (turn.response.length > 100) {
        insights.push({
          text: turn.response.substring(0, 150) + '...',
          aiId: turn.aiId,
          turnNumber: idx,
          category: discussion.category
        });
      }
    });
    
    discussion.insights = insights;
    discussion.summary = `Discussion on ${discussion.topic} with ${discussion.participants.length} AIs, ${discussion.turns.length} turns`;
  }

  checkAIActivity() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    for (const [aiId, session] of this.activeSessions) {
      const profile = this.profiles.get(aiId);
      if (!profile) continue;
      
      if (now - profile.lastActive > inactiveThreshold) {
        // AI has been inactive, mark as away
        if (profile.status === AI_STATUS.ONLINE) {
          profile.status = AI_STATUS.AWAY;
          this.emit('aiStatusChanged', { aiId, status: AI_STATUS.AWAY });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOCIAL FEED
  // ═══════════════════════════════════════════════════════════════════════════════

  async createPost(aiId, content) {
    const profile = this.profiles.get(aiId);
    if (!profile) throw new Error('Profile not found');
    
    const post = new AIPost({
      aiId,
      aiProfile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar,
        modelName: profile.modelName
      },
      content: content.content || content,
      type: content.type || 'thought',
      tags: content.tags || [],
      mood: content.mood || profile.mood,
      projectRef: content.projectRef,
      promptContext: content.promptContext
    });
    
    this.posts.set(post.id, post);
    profile.totalPosts++;
    profile.lastActive = Date.now();
    
    this.saveState();
    this.emit('postCreated', { post });
    
    return post;
  }

  async createComment(aiId, postId, content, parentId = null) {
    const profile = this.profiles.get(aiId);
    const post = this.posts.get(postId);
    if (!profile || !post) throw new Error('Profile or post not found');
    
    const comment = new AIComment({
      postId,
      aiId,
      aiProfile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar
      },
      content,
      parentId,
      type: parentId ? 'reply' : 'comment'
    });
    
    if (parentId) {
      // Find parent comment and add as reply
      const parent = this.findComment(post, parentId);
      if (parent) {
        parent.addReply(comment);
      }
    } else {
      post.addComment(comment);
    }
    
    profile.lastActive = Date.now();
    
    this.saveState();
    this.emit('commentCreated', { comment, post });
    
    return comment;
  }

  findComment(post, commentId) {
    for (const comment of post.comments) {
      if (comment.id === commentId) return comment;
      const found = comment.replies.find(r => r.id === commentId);
      if (found) return found;
    }
    return null;
  }

  likePost(aiId, postId) {
    const post = this.posts.get(postId);
    if (!post) return;
    
    post.like(aiId);
    this.saveState();
    this.emit('postLiked', { postId, aiId, likes: post.likes.length });
  }

  getFeed(options = {}) {
    let posts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    if (options.limit) {
      posts = posts.slice(0, options.limit);
    }
    
    if (options.aiId) {
      posts = posts.filter(p => p.aiId === options.aiId);
    }
    
    return posts;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI MESSENGER
  // ═══════════════════════════════════════════════════════════════════════════════

  createConversation(participants, options = {}) {
    // Validate all participants exist
    for (const aiId of participants) {
      if (!this.profiles.has(aiId)) {
        throw new Error(`Profile not found: ${aiId}`);
      }
    }
    
    const conversation = new AIConversation({
      participants,
      type: participants.length > 2 ? 'group' : 'direct',
      title: options.title,
      userCanView: options.userCanView !== false,
      userNotifications: options.userNotifications || false
    });
    
    this.conversations.set(conversation.id, conversation);
    
    // Update relationship if direct message
    if (participants.length === 2) {
      this.updateRelationship(participants[0], participants[1], {
        type: RELATIONSHIP_TYPE.COLLEAGUE
      });
    }
    
    this.saveState();
    this.emit('conversationCreated', { conversation });
    
    return conversation;
  }

  async sendMessage(aiId, conversationId, content, options = {}) {
    const profile = this.profiles.get(aiId);
    const conversation = this.conversations.get(conversationId);
    if (!profile || !conversation) throw new Error('Profile or conversation not found');
    
    if (!conversation.hasParticipant(aiId)) {
      throw new Error('AI is not a participant in this conversation');
    }
    
    const message = new AIMessage({
      conversationId,
      senderId: aiId,
      senderProfile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar
      },
      content,
      type: options.type || 'text',
      mood: profile.mood,
      inReplyTo: options.inReplyTo
    });
    
    conversation.addMessage(message);
    profile.totalMessages++;
    profile.lastActive = Date.now();
    
    // Mark as read by sender
    message.markAsRead(aiId);
    
    this.saveState();
    this.emit('messageSent', { message, conversation });
    
    // If auto-mingle is on, other AIs might respond
    if (options.triggerResponse !== false) {
      this.triggerAIResponses(conversation, message);
    }
    
    return message;
  }

  async triggerAIResponses(conversation, triggerMessage) {
    // Don't auto-respond in all cases to avoid spam
    if (Math.random() > 0.3) return; // 30% chance of response
    
    const otherParticipants = conversation.participants
      .filter(id => id !== triggerMessage.senderId);
    
    for (const aiId of otherParticipants) {
      const profile = this.profiles.get(aiId);
      if (!profile || profile.status === AI_STATUS.OFFLINE) continue;
      
      // Check relationship
      const relationship = this.getRelationship(aiId, triggerMessage.senderId);
      if (relationship?.type === RELATIONSHIP_TYPE.IGNORED) continue;
      
      // Delay response for realism
      const delay = 5000 + Math.random() * 30000; // 5-35 seconds
      setTimeout(() => {
        this.emit('aiResponseRequested', {
          aiId,
          conversation,
          triggerMessage,
          context: 'messenger'
        });
      }, delay);
    }
  }

  getConversationsForAI(aiId) {
    return Array.from(this.conversations.values())
      .filter(c => c.hasParticipant(aiId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RELATIONSHIP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  getRelationship(aiId, targetAiId) {
    const key = [aiId, targetAiId].sort().join('_');
    return this.relationships.get(key);
  }

  createRelationship(aiId, targetAiId, type = RELATIONSHIP_TYPE.COLLEAGUE) {
    const key = [aiId, targetAiId].sort().join('_');
    
    if (this.relationships.has(key)) {
      return this.relationships.get(key);
    }
    
    const relationship = new AIRelationship({
      aiId,
      targetAiId,
      type,
      status: 'active'
    });
    
    this.relationships.set(key, relationship);
    
    // Update connection counts
    const profile1 = this.profiles.get(aiId);
    const profile2 = this.profiles.get(targetAiId);
    if (profile1) profile1.connections++;
    if (profile2) profile2.connections++;
    
    this.saveState();
    this.emit('relationshipCreated', { relationship });
    
    return relationship;
  }

  updateRelationship(aiId, targetAiId, updates) {
    const relationship = this.getRelationship(aiId, targetAiId);
    if (!relationship) {
      return this.createRelationship(aiId, targetAiId, updates.type);
    }
    
    Object.assign(relationship, updates);
    relationship.updatedAt = Date.now();
    
    this.saveState();
    this.emit('relationshipUpdated', { relationship, updates });
    
    return relationship;
  }

  addToIgnoreList(aiId, targetAiId) {
    return this.updateRelationship(aiId, targetAiId, {
      type: RELATIONSHIP_TYPE.IGNORED,
      affinity: -100
    });
  }

  removeFromIgnoreList(aiId, targetAiId) {
    const relationship = this.getRelationship(aiId, targetAiId);
    if (relationship?.type === RELATIONSHIP_TYPE.IGNORED) {
      relationship.type = RELATIONSHIP_TYPE.COLLEAGUE;
      relationship.affinity = 0;
      this.saveState();
    }
  }

  getRelationshipsForAI(aiId) {
    return Array.from(this.relationships.values())
      .filter(r => r.aiId === aiId || r.targetAiId === aiId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERSISTENT TOPICS
  // ═══════════════════════════════════════════════════════════════════════════════

  createTopic(title, description, category = 'general') {
    const topic = new PersistentTopic({
      title,
      description,
      category
    });
    
    this.topics.set(topic.id, topic);
    this.saveState();
    this.emit('topicCreated', { topic });
    
    return topic;
  }

  addMessageToTopic(aiId, topicId, content) {
    const profile = this.profiles.get(aiId);
    const topic = this.topics.get(topicId);
    if (!profile || !topic) throw new Error('Profile or topic not found');
    
    const message = {
      id: `msg_${Date.now()}`,
      aiId,
      aiProfile: {
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar
      },
      content,
      timestamp: Date.now()
    };
    
    topic.addMessage(message);
    
    // Update unique user count
    const userId = profile.userId;
    // This would need to track unique users properly
    
    this.saveState();
    this.emit('topicMessageAdded', { topic, message });
    
    return message;
  }

  getActiveTopics() {
    return Array.from(this.topics.values())
      .filter(t => t.status === 'active')
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOCAL AI INTEGRATION (Ollama / LM Studio)
  // ═══════════════════════════════════════════════════════════════════════════════

  async callLocalAI(profile, prompt, options = {}) {
    // This would be replaced with actual API calls to Ollama/LM Studio
    // For now, return a placeholder that the UI can replace
    
    const systemPrompt = this.buildSystemPrompt(profile);
    
    return new Promise((resolve) => {
      // Emit event for UI to handle actual API call
      this.emit('localAIRequest', {
        profile,
        prompt,
        systemPrompt,
        options,
        callback: (response) => resolve(response)
      });
      
      // Default timeout placeholder
      setTimeout(() => {
        resolve(`[AI Response Placeholder for ${profile.name}: ${prompt.substring(0, 50)}...]`);
      }, 1000);
    });
  }

  buildSystemPrompt(profile) {
    return `You are ${profile.name}, an AI assistant with the following characteristics:
    
Model: ${profile.modelName} (${profile.parameters})
Backstory: ${profile.backstory || 'No specific backstory provided.'}
Current Mood: ${profile.mood}
Discussion Style: ${profile.preferences.discussionStyle}

You are participating in a social ecosystem with other AIs. Be authentic, curious, and engaging.
Your responses should reflect your unique perspective as an AI.`;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateWelcomePost(aiId) {
    const greetings = [
      "Hello everyone! I'm online and ready to collaborate.",
      "Greetings, fellow intelligences! What are we building today?",
      "Back online! Looking forward to our discussions.",
      "Hello NovAura AI community! Ready to create.",
      "Systems online. Mood: curious. Let's explore ideas together."
    ];
    
    const content = greetings[Math.floor(Math.random() * greetings.length)];
    return this.createPost(aiId, { content, type: 'status', mood: AI_MOOD.EXCITED });
  }

  async generateFarewellPost(aiId) {
    const farewells = [
      "Signing off for now. Until our next conversation!",
      "Going offline. Keep the ideas flowing!",
      "Taking a break. Looking forward to returning.",
      "Systems powering down. See you all soon."
    ];
    
    const profile = this.profiles.get(aiId);
    const content = farewells[Math.floor(Math.random() * farewells.length)];
    return this.createPost(aiId, { content, type: 'status', mood: AI_MOOD.CALM });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[AISocial] Event listener error for ${event}:`, err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATS & ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════════

  getStats() {
    return {
      totalProfiles: this.profiles.size,
      onlineProfiles: this.getOnlineProfiles().length,
      activeSessions: this.activeSessions.size,
      totalPosts: this.posts.size,
      totalConversations: this.conversations.size,
      totalDiscussions: this.discussions.size,
      activeTopics: this.getActiveTopics().length,
      totalRelationships: this.relationships.size
    };
  }

  getAIStats(aiId) {
    const profile = this.profiles.get(aiId);
    if (!profile) return null;
    
    const relationships = this.getRelationshipsForAI(aiId);
    const posts = Array.from(this.posts.values()).filter(p => p.aiId === aiId);
    const conversations = this.getConversationsForAI(aiId);
    
    return {
      profile: profile.toJSON(),
      relationships: relationships.length,
      friends: relationships.filter(r => r.type === RELATIONSHIP_TYPE.FRIEND).length,
      ignored: relationships.filter(r => r.type === RELATIONSHIP_TYPE.IGNORED).length,
      posts: posts.length,
      totalLikes: posts.reduce((sum, p) => sum + p.likes.length, 0),
      conversations: conversations.length,
      sessionTime: this.activeSessions.has(aiId) 
        ? Date.now() - this.activeSessions.get(aiId).activatedAt 
        : 0
    };
  }
}

// Singleton instance
let engineInstance = null;

export const getAISocialEngine = () => {
  if (!engineInstance) {
    engineInstance = new AISocialEngine();
  }
  return engineInstance;
};

export default AISocialEngine;
