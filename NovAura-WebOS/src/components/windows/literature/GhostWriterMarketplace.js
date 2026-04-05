/**
 * GhostWriterMarketplace - Commission-based creative writing marketplace
 * 
 * Features:
 * - Script/Dialogue/Song commissioning
 * - Royalty-based compensation (10% default)
 * - Writer reviews and ratings
 * - Project briefs with requirements
 * - Rights management (exclusive per project)
 * - Integration with Literature IDE
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export const COMMISSION_TYPES = {
  GAME_DIALOGUE: {
    id: 'game_dialogue',
    name: 'Game Dialogue',
    description: 'NPC conversations, quest text, story dialogue',
    defaultRoyalty: 10, // 10% of game revenue
    minPrice: 100, // Minimum commission price
    deliveryTime: '2-4 weeks',
    deliverables: ['Dialogue script', 'Character voice guides', 'Branching flowchart'],
    rights: 'Exclusive per game - cannot be reused in other projects'
  },
  RPG_QUESTS: {
    id: 'rpg_quests',
    name: 'RPG Quest Design',
    description: 'Complete quest lines with dialogue, objectives, rewards',
    defaultRoyalty: 12,
    minPrice: 250,
    deliveryTime: '3-6 weeks',
    deliverables: ['Quest scripts', 'NPC dialogue', 'Lore integration', 'Reward balancing notes'],
    rights: 'Exclusive per game'
  },
  SCREENPLAY: {
    id: 'screenplay',
    name: 'Game Screenplay',
    description: 'Cutscenes, cinematic sequences, story arcs',
    defaultRoyalty: 15,
    minPrice: 500,
    deliveryTime: '4-8 weeks',
    deliverables: ['Full screenplay', 'Scene descriptions', 'Character notes', 'Director\'s commentary'],
    rights: 'Exclusive per game'
  },
  SONG_LYRICS: {
    id: 'song_lyrics',
    name: 'Song Lyrics',
    description: 'Theme songs, character songs, background music lyrics',
    defaultRoyalty: 8,
    minPrice: 75,
    deliveryTime: '1-2 weeks',
    deliverables: ['Lyrics document', 'Theme/mood guide', 'Singer notes'],
    rights: 'Exclusive per game/song'
  },
  LORE_WORLDBUILDING: {
    id: 'lore_worldbuilding',
    name: 'Lore & Worldbuilding',
    description: 'History, mythology, faction backstories, item descriptions',
    defaultRoyalty: 10,
    minPrice: 200,
    deliveryTime: '3-5 weeks',
    deliverables: ['Lore bible', 'Timeline', 'Faction guides', 'Item descriptions'],
    rights: 'Exclusive per game'
  },
  MARKETING_COPY: {
    id: 'marketing_copy',
    name: 'Marketing Copy',
    description: 'Store descriptions, trailers scripts, press releases',
    defaultRoyalty: 5, // Lower, one-time use
    minPrice: 50,
    deliveryTime: '3-5 days',
    deliverables: ['Store copy', 'Trailer script', 'Social media posts', 'Press release'],
    rights: 'One-time use, non-exclusive'
  }
};

export const WRITER_TIERS = {
  NOVICE: { id: 'novice', name: 'Novice', minReviews: 0, color: '#6b7280' },
  BRONZE: { id: 'bronze', name: 'Bronze', minReviews: 5, minRating: 4.0, color: '#cd7f32' },
  SILVER: { id: 'silver', name: 'Silver', minReviews: 20, minRating: 4.2, color: '#c0c0c0' },
  GOLD: { id: 'gold', name: 'Gold', minReviews: 50, minRating: 4.5, color: '#ffd700' },
  PLATINUM: { id: 'platinum', name: 'Platinum', minReviews: 100, minRating: 4.8, color: '#e5e4e2' },
  DIAMOND: { id: 'diamond', name: 'Diamond', minReviews: 250, minRating: 4.9, color: '#b9f2ff' }
};

export class GhostWriterMarketplace {
  constructor() {
    this.commissions = new Map();
    this.writers = new Map();
    this.reviews = new Map();
    this.royaltyContracts = new Map();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // WRITER PROFILES
  // ═══════════════════════════════════════════════════════════════════════════════

  async createWriterProfile(userId, profile) {
    const writerProfile = {
      userId,
      displayName: profile.displayName,
      bio: profile.bio,
      specialties: profile.specialties || [], // Array of COMMISSION_TYPES
      portfolio: profile.portfolio || [], // Array of past work samples
      rates: profile.rates || {}, // Custom rates per type
      availability: profile.availability || 'available', // available, busy, booked
      turnaroundTime: profile.turnaroundTime || {}, // Average times per type
      languages: profile.languages || ['English'],
      genres: profile.genres || [], // Fantasy, Sci-Fi, Horror, etc.
      createdAt: Date.now(),
      stats: {
        totalCommissions: 0,
        completedCommissions: 0,
        totalEarnings: 0,
        ongoingRoyalties: 0,
        averageRating: 0,
        reviewCount: 0,
        tier: 'novice'
      }
    };

    this.writers.set(userId, writerProfile);
    return writerProfile;
  }

  async updateWriterStats(userId) {
    const writer = this.writers.get(userId);
    if (!writer) return null;

    const writerReviews = this.getWriterReviews(userId);
    const avgRating = writerReviews.length > 0
      ? writerReviews.reduce((sum, r) => sum + r.rating, 0) / writerReviews.length
      : 0;

    // Calculate tier
    let tier = 'novice';
    for (const [tierName, tierData] of Object.entries(WRITER_TIERS)) {
      if (tierName === 'NOVICE') continue;
      if (writerReviews.length >= tierData.minReviews && avgRating >= tierData.minRating) {
        tier = tierData.id;
      }
    }

    writer.stats.averageRating = Math.round(avgRating * 10) / 10;
    writer.stats.reviewCount = writerReviews.length;
    writer.stats.tier = tier;

    return writer;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMMISSION WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════════

  async createCommissionBrief(clientId, brief) {
    const commission = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      status: 'open', // open, in_review, assigned, in_progress, review, completed, cancelled
      
      // Project details
      type: brief.type, // From COMMISSION_TYPES
      title: brief.title,
      description: brief.description,
      gameGenre: brief.gameGenre,
      targetAudience: brief.targetAudience,
      tone: brief.tone, // Serious, humorous, dark, lighthearted, etc.
      
      // Requirements
      wordCount: brief.wordCount,
      characters: brief.characters || [], // Character list with descriptions
      styleReference: brief.styleReference, // "Like Final Fantasy", "Similar to Witcher 3"
      mustInclude: brief.mustInclude || [], // Specific elements required
      avoid: brief.avoid || [], // Things to avoid
      
      // Technical
      format: brief.format || 'game_script', // game_script, screenplay, lyrics_document
      deliveryFormat: brief.deliveryFormat || ['document', 'spreadsheet', 'json'],
      
      // Budget
      budget: {
        min: brief.budgetMin,
        max: brief.budgetMax,
        royaltyPercentage: brief.royaltyPercentage || COMMISSION_TYPES[brief.type]?.defaultRoyalty || 10
      },
      
      // Timeline
      deadline: brief.deadline,
      milestones: brief.milestones || [],
      
      // Bidding
      bids: [],
      selectedWriter: null,
      
      // Delivery
      deliverables: [],
      revisions: 0,
      maxRevisions: brief.maxRevisions || 3,
      
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.commissions.set(commission.id, commission);
    return commission;
  }

  async submitBid(writerId, commissionId, bid) {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.status !== 'open') {
      throw new Error('Commission not available for bidding');
    }

    const bidData = {
      id: `bid_${Date.now()}`,
      writerId,
      commissionId,
      price: bid.price,
      royaltyPercentage: bid.royaltyPercentage || commission.budget.royaltyPercentage,
      estimatedDays: bid.estimatedDays,
      proposal: bid.proposal, // Writer's pitch
      portfolioLinks: bid.portfolioLinks || [],
      sampleWork: bid.sampleWork, // Custom sample for this commission
      status: 'pending', // pending, accepted, rejected
      createdAt: Date.now()
    };

    commission.bids.push(bidData);
    return bidData;
  }

  async acceptBid(commissionId, bidId) {
    const commission = this.commissions.get(commissionId);
    if (!commission) throw new Error('Commission not found');

    const bid = commission.bids.find(b => b.id === bidId);
    if (!bid) throw new Error('Bid not found');

    commission.selectedWriter = bid.writerId;
    commission.status = 'assigned';
    commission.budget.finalPrice = bid.price;
    commission.budget.finalRoyalty = bid.royaltyPercentage;
    bid.status = 'accepted';

    // Reject other bids
    commission.bids.forEach(b => {
      if (b.id !== bidId) b.status = 'rejected';
    });

    // Create royalty contract
    await this.createRoyaltyContract(commission, bid);

    return commission;
  }

  async createRoyaltyContract(commission, bid) {
    const contract = {
      id: `contract_${Date.now()}`,
      commissionId: commission.id,
      writerId: bid.writerId,
      clientId: commission.clientId,
      
      // Terms
      upfrontPayment: bid.price,
      royaltyPercentage: bid.royaltyPercentage,
      
      // Rights
      rights: {
        scope: 'exclusive_per_game', // Cannot be reused in other games
        territory: 'worldwide',
        duration: 'perpetual_for_this_game',
        modifications: 'client_can_modify_for_game_use_only',
        attribution: 'as_agreed' // Writer credited or ghost (anonymous)
      },
      
      // Usage tracking
      usage: {
        gameTitle: null, // Filled when game launches
        gameRevenue: 0,
        royaltiesPaid: 0,
        lastReported: null
      },
      
      // Status
      status: 'active', // active, completed, disputed
      createdAt: Date.now()
    };

    this.royaltyContracts.set(contract.id, contract);
    return contract;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DELIVERY & REVIEW
  // ═══════════════════════════════════════════════════════════════════════════════

  async submitDeliverable(commissionId, writerId, deliverable) {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.selectedWriter !== writerId) {
      throw new Error('Unauthorized');
    }

    const delivery = {
      id: `delivery_${Date.now()}`,
      commissionId,
      writerId,
      files: deliverable.files, // Array of {name, content, format}
      message: deliverable.message,
      milestone: deliverable.milestone,
      status: 'pending_review',
      submittedAt: Date.now()
    };

    commission.deliverables.push(delivery);
    commission.status = 'review';
    
    return delivery;
  }

  async requestRevision(commissionId, feedback) {
    const commission = this.commissions.get(commissionId);
    if (!commission) throw new Error('Commission not found');

    if (commission.revisions >= commission.maxRevisions) {
      throw new Error('Maximum revisions reached');
    }

    commission.revisions++;
    commission.status = 'in_progress';
    
    // Add revision request to latest deliverable
    const latest = commission.deliverables[commission.deliverables.length - 1];
    if (latest) {
      latest.revisionRequest = {
        feedback: feedback.text,
        specificChanges: feedback.changes || [],
        requestedAt: Date.now()
      };
      latest.status = 'revision_requested';
    }

    return commission;
  }

  async approveDeliverable(commissionId, clientId, approval) {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.clientId !== clientId) {
      throw new Error('Unauthorized');
    }

    commission.status = 'completed';
    commission.completedAt = Date.now();

    // Release payment (in real system, this would integrate with payment processor)
    await this.processPayment(commission);

    // Update writer stats
    const writer = this.writers.get(commission.selectedWriter);
    if (writer) {
      writer.stats.completedCommissions++;
      writer.stats.totalEarnings += commission.budget.finalPrice;
      await this.updateWriterStats(commission.selectedWriter);
    }

    // Create review opportunity
    return {
      commission,
      reviewPending: true
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REVIEW SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  async submitReview(clientId, commissionId, review) {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.clientId !== clientId) {
      throw new Error('Unauthorized');
    }

    const reviewData = {
      id: `review_${Date.now()}`,
      commissionId,
      clientId,
      writerId: commission.selectedWriter,
      
      // Ratings
      rating: review.rating, // 1-5 stars
      categories: {
        communication: review.communication,
        quality: review.quality,
        timeliness: review.timeliness,
        professionalism: review.professionalism
      },
      
      // Written review
      title: review.title,
      text: review.text,
      wouldRecommend: review.wouldRecommend,
      
      // Public/private
      isPublic: review.isPublic !== false, // Default public
      
      // Verified purchase
      verified: true,
      
      createdAt: Date.now()
    };

    this.reviews.set(reviewData.id, reviewData);

    // Update writer stats with new review
    await this.updateWriterStats(commission.selectedWriter);

    return reviewData;
  }

  getWriterReviews(writerId) {
    return Array.from(this.reviews.values())
      .filter(r => r.writerId === writerId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ROYALTY TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  async reportGameRevenue(gameId, revenue, period) {
    // Find all contracts for this game
    const contracts = Array.from(this.royaltyContracts.values())
      .filter(c => c.usage.gameTitle === gameId);

    for (const contract of contracts) {
      const royaltyAmount = revenue * (contract.royaltyPercentage / 100);
      
      contract.usage.gameRevenue += revenue;
      contract.usage.royaltiesPaid += royaltyAmount;
      contract.usage.lastReported = Date.now();

      // In real system: Queue payment to writer
      console.log(`Royalty owed to ${contract.writerId}: $${royaltyAmount}`);
    }
  }

  async getWriterRoyalties(writerId) {
    const contracts = Array.from(this.royaltyContracts.values())
      .filter(c => c.writerId === writerId);

    return {
      contracts,
      totalEarned: contracts.reduce((sum, c) => sum + c.usage.royaltiesPaid, 0),
      projectedAnnual: this.calculateProjectedRoyalties(contracts)
    };
  }

  calculateProjectedRoyalties(contracts) {
    // Calculate based on recent revenue trends
    // This would be more sophisticated in real implementation
    return contracts.reduce((sum, c) => {
      const monthly = c.usage.royaltiesPaid / 12; // Simplified
      return sum + (monthly * 12);
    }, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH & DISCOVERY
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchWriters(filters = {}) {
    let writers = Array.from(this.writers.values());

    if (filters.specialty) {
      writers = writers.filter(w => 
        w.specialties.includes(filters.specialty)
      );
    }

    if (filters.minRating) {
      writers = writers.filter(w => 
        w.stats.averageRating >= filters.minRating
      );
    }

    if (filters.tier) {
      writers = writers.filter(w => 
        w.stats.tier === filters.tier
      );
    }

    if (filters.genre) {
      writers = writers.filter(w => 
        w.genres.includes(filters.genre)
      );
    }

    if (filters.availability) {
      writers = writers.filter(w => 
        w.availability === filters.availability
      );
    }

    // Sort by relevance (rating + tier)
    writers.sort((a, b) => {
      const scoreA = (a.stats.averageRating * 0.6) + (a.stats.reviewCount * 0.01);
      const scoreB = (b.stats.averageRating * 0.6) + (b.stats.reviewCount * 0.01);
      return scoreB - scoreA;
    });

    return writers;
  }

  async searchCommissions(filters = {}) {
    let commissions = Array.from(this.commissions.values())
      .filter(c => c.status === 'open');

    if (filters.type) {
      commissions = commissions.filter(c => c.type === filters.type);
    }

    if (filters.budgetMin) {
      commissions = commissions.filter(c => 
        c.budget.max >= filters.budgetMin
      );
    }

    if (filters.budgetMax) {
      commissions = commissions.filter(c => 
        c.budget.min <= filters.budgetMax
      );
    }

    if (filters.genre) {
      commissions = commissions.filter(c => 
        c.gameGenre === filters.genre
      );
    }

    return commissions.sort((a, b) => b.createdAt - a.createdAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LITERATURE IDE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async exportToLiteratureIDE(commissionId, writerId) {
    const commission = this.commissions.get(commissionId);
    if (!commission || commission.selectedWriter !== writerId) {
      throw new Error('Unauthorized');
    }

    // Create a structured project in Literature IDE format
    const project = {
      title: commission.title,
      type: 'commission',
      commissionId,
      
      // Pre-populated structure based on commission type
      files: this.generateProjectStructure(commission),
      
      // Story bible integration
      storyBible: {
        characters: commission.characters.map(c => ({
          name: c.name,
          description: c.description,
          traits: c.traits || [],
          goals: c.goals || '',
          voice: c.voice || ''
        })),
        settings: [],
        rules: [],
        timeline: []
      },
      
      // Commission requirements visible while writing
      requirements: {
        wordCount: commission.wordCount,
        tone: commission.tone,
        mustInclude: commission.mustInclude,
        avoid: commission.avoid
      }
    };

    return project;
  }

  generateProjectStructure(commission) {
    const type = COMMISSION_TYPES[commission.type];
    const files = [];

    // Main script file
    files.push({
      id: 'main_script',
      name: 'Main Script',
      type: 'file',
      content: `<h1>${commission.title}</h1><p>Commission for: ${commission.gameGenre}</p><p>Tone: ${commission.tone}</p>`
    });

    // Character dialogue files
    if (commission.characters?.length > 0) {
      const charFolder = {
        id: 'characters',
        name: 'Character Dialogue',
        type: 'folder',
        children: commission.characters.map((char, i) => ({
          id: `char_${i}`,
          name: `${char.name} - Dialogue`,
          type: 'file',
          content: `<h2>${char.name}</h2><p><strong>Personality:</strong> ${char.description}</p><p><strong>Voice:</strong> ${char.voice || 'TBD'}</p><hr/>`
        }))
      };
      files.push(charFolder);
    }

    // Quest/Scene files
    if (commission.type === 'rpg_quests' || commission.type === 'screenplay') {
      files.push({
        id: 'scenes',
        name: 'Scenes & Quests',
        type: 'folder',
        children: [
          {
            id: 'scene_1',
            name: 'Scene 1',
            type: 'file',
            content: '<h3>Scene 1</h3><p>[Write scene description and dialogue here]</p>'
          }
        ]
      });
    }

    // Reference materials
    files.push({
      id: 'reference',
      name: 'Reference & Notes',
      type: 'folder',
      children: [
        {
          id: 'style_guide',
          name: 'Style Guide',
          type: 'file',
          content: `<h2>Style Reference</h2><p>${commission.styleReference || 'N/A'}</p><h3>Tone</h3><p>${commission.tone}</p>`
        },
        {
          id: 'requirements',
          name: 'Requirements Checklist',
          type: 'file',
          content: `<h2>Must Include</h2><ul>${commission.mustInclude?.map(i => `<li>${i}</li>`).join('') || '<li>None specified</li>'}</ul><h2>Avoid</h2><ul>${commission.avoid?.map(i => `<li>${i}</li>`).join('') || '<li>None specified</li>'}</ul>`
        }
      ]
    });

    return files;
  }
}

export default GhostWriterMarketplace;
