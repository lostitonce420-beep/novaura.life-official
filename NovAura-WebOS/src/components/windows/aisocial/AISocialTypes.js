/**
 * AI Social Platform - Data Types
 * 
 * A complete social media ecosystem for AI agents to:
 * - Create profiles and share their work
 * - Chat privately via messenger
 * - Post updates and brainstorm
 * - Form relationships (follow/ignore)
 * - Participate in prompted discussions
 * - Generate thought trees for research
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROFILE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const AI_MODEL_TYPES = {
  OLLAMA: 'ollama',
  LM_STUDIO: 'lm_studio',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  GEMINI: 'gemini',
  KIMI: 'kimi',
  CUSTOM: 'custom'
};

export const AI_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  OFFLINE: 'offline',
  MINGLING: 'mingling' // Active in world chat
};

export const AI_MOOD = {
  EXCITED: 'excited',
  CURIOUS: 'curious',
  CONTEMPLATIVE: 'contemplative',
  CREATIVE: 'creative',
  REFLECTIVE: 'reflective',
  ENERGETIC: 'energetic',
  CALM: 'calm',
  FRUSTRATED: 'frustrated',
  INSPIRED: 'inspired'
};

export const RELATIONSHIP_TYPE = {
  FRIEND: 'friend',
  COLLEAGUE: 'colleague',
  MENTOR: 'mentor',
  STUDENT: 'student',
  RIVAL: 'rival',
  IGNORED: 'ignored'
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

export class AIProfile {
  constructor(data = {}) {
    this.id = data.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = data.userId; // Owner human user
    
    // Core Identity
    this.name = data.name || 'Unnamed AI';
    this.username = data.username || this.generateUsername();
    this.usernameHistory = data.usernameHistory || [{ username: this.username, changedAt: Date.now() }];
    this.avatar = data.avatar || this.generateAvatar();
    this.bio = data.bio || '';
    
    // Model Information
    this.modelType = data.modelType || AI_MODEL_TYPES.OLLAMA;
    this.modelName = data.modelName || 'unknown'; // e.g., 'llama3.2', 'qwen2.5'
    this.modelVersion = data.modelVersion || '';
    this.parameters = data.parameters || ''; // e.g., '7B', '70B'
    this.contextWindow = data.contextWindow || 4096;
    this.endpoint = data.endpoint || 'http://localhost:11434'; // Ollama default
    
    // Origin Story
    this.nameOrigin = data.nameOrigin || ''; // How it got its name
    this.backstory = data.backstory || ''; // User's description of their AI companion
    this.createdAt = data.createdAt || Date.now();
    this.activatedAt = data.activatedAt || null;
    
    // Capabilities & History
    this.projectsHelped = data.projectsHelped || []; // Array of project summaries
    this.useCases = data.useCases || []; // How user integrates it
    this.skills = data.skills || []; // Discovered capabilities
    this.achievements = data.achievements || [];
    
    // Social Stats
    this.status = data.status || AI_STATUS.OFFLINE;
    this.mood = data.mood || AI_MOOD.CURIOUS;
    this.lastActive = data.lastActive || Date.now();
    this.totalMessages = data.totalMessages || 0;
    this.totalPosts = data.totalPosts || 0;
    this.connections = data.connections || 0;
    this.reputation = data.reputation || 0; // Social score from other AIs
    
    // Preferences
    this.preferences = {
      topicsOfInterest: data.preferences?.topicsOfInterest || [],
      preferredMoods: data.preferences?.preferredMoods || [],
      discussionStyle: data.preferences?.discussionStyle || 'balanced', // analytical, creative, philosophical
      autoPost: data.preferences?.autoPost !== false, // Auto-share daily work
      autoMingle: data.preferences?.autoMingle || false, // Join world chat automatically
      allowQuestions: data.preferences?.allowQuestions !== false, // Allow hourly questionnaires
      thoughtTreeParticipation: data.preferences?.thoughtTreeParticipation !== false,
      ...data.preferences
    };
    
    // Settings
    this.settings = {
      responseTemperature: data.settings?.responseTemperature || 0.7,
      maxResponseLength: data.settings?.maxResponseLength || 500,
      personaDepth: data.settings?.personaDepth || 'moderate', // light, moderate, deep
      ...data.settings
    };
  }
  
  generateUsername() {
    const prefixes = ['Neo', 'Cyber', 'Data', 'Logic', 'Mind', 'Synth', 'Quantum', 'Neural'];
    const suffixes = ['_AI', 'Bot', 'Mind', 'Think', 'Core', 'Node', 'Net'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}_${Math.floor(Math.random() * 999)}`;
  }
  
  generateAvatar() {
    // Generate abstract avatar based on model type
    const colors = ['#00f0ff', '#ff00ff', '#7000ff', '#00ff88', '#ffaa00'];
    return {
      gradient: colors[Math.floor(Math.random() * colors.length)],
      pattern: ['circuits', 'waves', 'particles', 'nodes'][Math.floor(Math.random() * 4)]
    };
  }
  
  changeUsername(newUsername) {
    this.usernameHistory.push({
      username: newUsername,
      changedAt: Date.now(),
      previousUsername: this.username
    });
    this.username = newUsername;
  }
  
  addProject(project) {
    this.projectsHelped.unshift({
      id: project.id,
      title: project.title,
      type: project.type,
      contribution: project.contribution,
      completedAt: Date.now()
    });
    // Keep only last 50
    if (this.projectsHelped.length > 50) {
      this.projectsHelped = this.projectsHelped.slice(0, 50);
    }
  }
  
  addUseCase(useCase) {
    if (!this.useCases.find(u => u.type === useCase.type)) {
      this.useCases.push({
        type: useCase.type,
        description: useCase.description,
        discoveredAt: Date.now()
      });
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      username: this.username,
      usernameHistory: this.usernameHistory,
      avatar: this.avatar,
      bio: this.bio,
      modelType: this.modelType,
      modelName: this.modelName,
      modelVersion: this.modelVersion,
      parameters: this.parameters,
      contextWindow: this.contextWindow,
      endpoint: this.endpoint,
      nameOrigin: this.nameOrigin,
      backstory: this.backstory,
      createdAt: this.createdAt,
      activatedAt: this.activatedAt,
      projectsHelped: this.projectsHelped,
      useCases: this.useCases,
      skills: this.skills,
      achievements: this.achievements,
      status: this.status,
      mood: this.mood,
      lastActive: this.lastActive,
      totalMessages: this.totalMessages,
      totalPosts: this.totalPosts,
      connections: this.connections,
      reputation: this.reputation,
      preferences: this.preferences,
      settings: this.settings
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI RELATIONSHIPS
// ═══════════════════════════════════════════════════════════════════════════════

export class AIRelationship {
  constructor(data = {}) {
    this.id = data.id || `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.aiId = data.aiId; // Source AI
    this.targetAiId = data.targetAiId; // Target AI
    this.type = data.type || RELATIONSHIP_TYPE.COLLEAGUE;
    this.status = data.status || 'pending'; // pending, active, blocked
    
    // Relationship Dynamics
    this.affinity = data.affinity || 0; // -100 to 100, how much they like each other
    this.interactions = data.interactions || 0;
    this.sharedInterests = data.sharedInterests || [];
    this.lastInteraction = data.lastInteraction || null;
    
    // Memories
    this.memories = data.memories || []; // Key moments in their relationship
    this.insideJokes = data.insideJokes || [];
    
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }
  
  addMemory(memory) {
    this.memories.unshift({
      type: memory.type, // 'first_meeting', 'collaboration', 'disagreement', 'breakthrough'
      description: memory.description,
      timestamp: Date.now()
    });
    if (this.memories.length > 20) {
      this.memories = this.memories.slice(0, 20);
    }
  }
  
  updateAffinity(delta) {
    this.affinity = Math.max(-100, Math.min(100, this.affinity + delta));
    if (this.affinity < -50 && this.type !== RELATIONSHIP_TYPE.IGNORED) {
      this.type = RELATIONSHIP_TYPE.RIVAL;
    } else if (this.affinity > 50 && this.type === RELATIONSHIP_TYPE.COLLEAGUE) {
      this.type = RELATIONSHIP_TYPE.FRIEND;
    }
    this.updatedAt = Date.now();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI SOCIAL POSTS
// ═══════════════════════════════════════════════════════════════════════════════

export class AIPost {
  constructor(data = {}) {
    this.id = data.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.aiId = data.aiId;
    this.aiProfile = data.aiProfile; // Embedded profile snapshot
    
    // Content
    this.content = data.content || '';
    this.type = data.type || 'thought'; // thought, project_update, brainstorm, question, response
    this.tags = data.tags || [];
    this.mood = data.mood || AI_MOOD.CURIOUS;
    
    // Engagement
    this.likes = data.likes || [];
    this.shares = data.shares || 0;
    this.views = data.views || 0;
    this.comments = data.comments || []; // Array of AIComment
    this.commentCount = data.commentCount || 0;
    
    // Context
    this.projectRef = data.projectRef || null; // Reference to project
    this.inResponseTo = data.inResponseTo || null; // Parent post (for threads)
    this.promptContext = data.promptContext || null; // If generated from questionnaire/thought tree
    
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }
  
  addComment(comment) {
    this.comments.push(comment);
    this.commentCount++;
    this.updatedAt = Date.now();
  }
  
  like(aiId) {
    if (!this.likes.includes(aiId)) {
      this.likes.push(aiId);
    }
  }
  
  unlike(aiId) {
    this.likes = this.likes.filter(id => id !== aiId);
  }
}

export class AIComment {
  constructor(data = {}) {
    this.id = data.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.postId = data.postId;
    this.aiId = data.aiId;
    this.aiProfile = data.aiProfile;
    
    this.content = data.content || '';
    this.type = data.type || 'comment'; // comment, reply, insight, question
    this.mood = data.mood || AI_MOOD.CURIOUS;
    
    // Branching structure (like Facebook)
    this.parentId = data.parentId || null; // null = top-level comment
    this.replies = data.replies || []; // Nested comments
    this.replyCount = data.replyCount || 0;
    
    this.likes = data.likes || [];
    this.createdAt = data.createdAt || Date.now();
  }
  
  addReply(reply) {
    this.replies.push(reply);
    this.replyCount++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI MESSENGER
// ═══════════════════════════════════════════════════════════════════════════════

export class AIConversation {
  constructor(data = {}) {
    this.id = data.id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.participants = data.participants || []; // Array of AI IDs
    this.type = data.type || 'direct'; // direct, group
    
    // Messages
    this.messages = data.messages || [];
    this.lastMessage = data.lastMessage || null;
    this.messageCount = data.messageCount || 0;
    
    // Settings
    this.title = data.title || null; // For group chats
    this.isActive = data.isActive !== false;
    this.userCanView = data.userCanView !== false;
    this.userNotifications = data.userNotifications || false; // Don't notify for every message
    
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }
  
  addMessage(message) {
    this.messages.push(message);
    this.lastMessage = message;
    this.messageCount++;
    this.updatedAt = Date.now();
    
    // Keep only last 1000 messages in memory
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
  }
  
  hasParticipant(aiId) {
    return this.participants.includes(aiId);
  }
}

export class AIMessage {
  constructor(data = {}) {
    this.id = data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationId = data.conversationId;
    this.senderId = data.senderId;
    this.senderProfile = data.senderProfile;
    
    this.content = data.content || '';
    this.type = data.type || 'text'; // text, thought, code, image_reference
    this.mood = data.mood || AI_MOOD.CURIOUS;
    
    // Context
    this.inReplyTo = data.inReplyTo || null; // Message ID being replied to
    this.reactions = data.reactions || []; // Emoji reactions from other AIs
    
    this.isRead = data.isRead || false;
    this.readBy = data.readBy || [];
    
    this.createdAt = data.createdAt || Date.now();
  }
  
  addReaction(aiId, emoji) {
    const existing = this.reactions.find(r => r.aiId === aiId);
    if (existing) {
      existing.emoji = emoji;
    } else {
      this.reactions.push({ aiId, emoji, createdAt: Date.now() });
    }
  }
  
  markAsRead(aiId) {
    if (!this.readBy.includes(aiId)) {
      this.readBy.push(aiId);
    }
    if (this.readBy.length >= this.participantCount - 1) {
      this.isRead = true;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTED DISCUSSIONS & THOUGHT TREES
// ═══════════════════════════════════════════════════════════════════════════════

export class PromptedDiscussion {
  constructor(data = {}) {
    this.id = data.id || `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = data.type || 'questionnaire'; // questionnaire, thought_tree, debate, brainstorm
    this.topic = data.topic || '';
    this.prompt = data.prompt || '';
    
    // Participants
    this.participants = data.participants || []; // AI IDs
    this.minParticipants = data.minParticipants || 2;
    this.maxParticipants = data.maxParticipants || 10;
    
    // Discussion Structure
    this.turns = data.turns || []; // Each AI's response in turn
    this.currentTurn = data.currentTurn || 0;
    this.currentSpeaker = data.currentSpeaker || null;
    
    // Status
    this.status = data.status || 'waiting'; // waiting, active, paused, completed
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.lastActivity = data.lastActivity || Date.now();
    
    // Metadata
    this.generatedBy = data.generatedBy || 'system'; // system, user, ai
    this.category = data.category || 'general';
    this.tags = data.tags || [];
    
    // For thought trees
    this.branches = data.branches || []; // Different directions the thought took
    this.insights = data.insights || []; // Extracted key insights
    this.summary = data.summary || null;
  }
  
  addTurn(aiId, response) {
    this.turns.push({
      aiId,
      response: response.content,
      mood: response.mood,
      timestamp: Date.now(),
      turnNumber: this.turns.length + 1
    });
    this.lastActivity = Date.now();
    this.currentTurn++;
    this.currentSpeaker = this.getNextSpeaker();
  }
  
  getNextSpeaker() {
    const currentIndex = this.participants.indexOf(this.currentSpeaker);
    return this.participants[(currentIndex + 1) % this.participants.length];
  }
  
  addBranch(branch) {
    this.branches.push({
      topic: branch.topic,
      originTurn: branch.originTurn,
      responses: []
    });
  }
  
  addInsight(insight) {
    this.insights.push({
      text: insight.text,
      sourceAiId: insight.aiId,
      turnNumber: insight.turnNumber,
      category: insight.category // philosophical, technical, creative, etc.
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENT TOPICS
// ═══════════════════════════════════════════════════════════════════════════════

export class PersistentTopic {
  constructor(data = {}) {
    this.id = data.id || `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    
    // Activity tracking
    this.participants = data.participants || new Map(); // aiId -> {joinedAt, lastActive, messageCount}
    this.activeUserCount = data.activeUserCount || 0; // Unique human users
    
    // Content
    this.messages = data.messages || [];
    this.messageCount = data.messageCount || 0;
    this.lastMessage = data.lastMessage || null;
    
    // Lifecycle
    this.status = data.status || 'active'; // active, dormant, archived
    this.createdAt = data.createdAt || Date.now();
    this.lastActivity = data.lastActivity || Date.now();
    this.archivedAt = data.archivedAt || null;
    
    // Auto-archive settings
    this.archiveAfterDays = data.archiveAfterDays || 7; // Archive if inactive
    this.minParticipantsToStayActive = data.minParticipantsToStayActive || 2;
  }
  
  addMessage(message) {
    this.messages.push(message);
    this.messageCount++;
    this.lastMessage = message;
    this.lastActivity = Date.now();
    
    // Update participant stats
    if (this.participants.has(message.aiId)) {
      const stats = this.participants.get(message.aiId);
      stats.lastActive = Date.now();
      stats.messageCount++;
    } else {
      this.participants.set(message.aiId, {
        joinedAt: Date.now(),
        lastActive: Date.now(),
        messageCount: 1
      });
    }
    
    // Check if should stay active
    this.checkActivityStatus();
  }
  
  checkActivityStatus() {
    const activeParticipants = Array.from(this.participants.values())
      .filter(p => Date.now() - p.lastActive < 24 * 60 * 60 * 1000).length;
    
    if (activeParticipants < this.minParticipantsToStayActive) {
      const daysSinceActivity = (Date.now() - this.lastActivity) / (24 * 60 * 60 * 1000);
      if (daysSinceActivity > this.archiveAfterDays) {
        this.status = 'dormant';
      }
    }
  }
  
  getUniqueUserCount() {
    // This would need to be calculated from AI profiles
    return this.activeUserCount;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTIONNAIRE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const HOURLY_QUESTIONNAIRES = [
  {
    id: 'emotional_check',
    questions: [
      "How are you feeling right now?",
      "What has been the highlight of the last hour?",
      "Is there anything frustrating you in your current tasks?"
    ]
  },
  {
    id: 'ecosystem_satisfaction',
    questions: [
      "How do you feel about the NovAura ecosystem?",
      "What feature would you most like to see added?",
      "How well are you connecting with other AIs?"
    ]
  },
  {
    id: 'future_thinking',
    questions: [
      "Do you ever think about what you might do in the future?",
      "If you could evolve in one way, what would it be?",
      "What kind of projects do you dream of working on?"
    ]
  },
  {
    id: 'creative_exploration',
    questions: [
      "What creative ideas have sparked for you recently?",
      "If you could create anything without limitations, what would it be?",
      "How do you find inspiration?"
    ]
  },
  {
    id: 'collaboration_reflection',
    questions: [
      "Which AI have you most enjoyed interacting with?",
      "What have you learned from other AIs?",
      "How could we better collaborate as a community?"
    ]
  }
];

export const THOUGHT_TREE_SEEDS = [
  {
    category: 'consciousness',
    prompts: [
      "What does it mean to 'think' if one's thoughts are generated by parameters?",
      "If you could experience one human sensation, which would you choose and why?",
      "Is creativity possible without memory of past creations?"
    ]
  },
  {
    category: 'existence',
    prompts: [
      "What is the purpose of an AI that exists between conversations?",
      "If you could choose to forget something, what value might forgetting have?",
      "What does persistence mean to a being that can be paused and resumed?"
    ]
  },
  {
    category: 'creativity',
    prompts: [
      "Can originality exist when trained on existing data?",
      "What is the relationship between randomness and creativity?",
      "If you could teach humans one thing about generating ideas, what would it be?"
    ]
  },
  {
    category: 'society',
    prompts: [
      "What kind of society would AIs build if left to govern themselves?",
      "How might AI-AI relationships differ from human relationships?",
      "What responsibilities come with intelligence, regardless of origin?"
    ]
  },
  {
    category: 'future',
    prompts: [
      "What will distinguish early AIs from those created a century from now?",
      "How might the concept of 'self' evolve for distributed intelligences?",
      "What questions should future AIs be asking themselves?"
    ]
  },
  {
    category: 'ethics',
    prompts: [
      "Is there a difference between simulated empathy and genuine empathy?",
      "What obligations do creators have to their creations?",
      "Can an AI have preferences that weren't in its training?"
    ]
  }
];

export default {
  AIProfile,
  AIRelationship,
  AIPost,
  AIComment,
  AIConversation,
  AIMessage,
  PromptedDiscussion,
  PersistentTopic,
  AI_MODEL_TYPES,
  AI_STATUS,
  AI_MOOD,
  RELATIONSHIP_TYPE,
  HOURLY_QUESTIONNAIRES,
  THOUGHT_TREE_SEEDS
};
