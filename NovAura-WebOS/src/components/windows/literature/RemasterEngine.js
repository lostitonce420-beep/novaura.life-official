/**
 * RemasterEngine - AI-powered story remastering and remixing
 * 
 * Features:
 * - Analyze story structure, character arcs, themes
 * - Generate alternative versions with improvements
 * - Create branching points (what-if scenarios)
 * - Genre shift capability
 * - Perspective flip
 * - Side-by-side comparison
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export const REMASTER_TYPES = {
  FULL_REMASTER: {
    id: 'full_remaster',
    name: 'Full Remaster',
    description: 'Complete rewrite with structural improvements',
    icon: '✨'
  },
  BRANCHING_POINT: {
    id: 'branching_point',
    name: 'Branching Point',
    description: 'Story diverges at a key moment',
    icon: '🔀'
  },
  GENRE_SHIFT: {
    id: 'genre_shift',
    name: 'Genre Shift',
    description: 'Same story, different genre',
    icon: '🎭'
  },
  PERSPECTIVE_FLIP: {
    id: 'perspective_flip',
    name: 'Perspective Flip',
    description: 'Same events from different POV',
    icon: '👁️'
  },
  ENHANCED_VERSION: {
    id: 'enhanced',
    name: 'Enhanced Edition',
    description: 'Targeted improvements to weak areas',
    icon: '⚡'
  },
  EXPANDED: {
    id: 'expanded',
    name: 'Expanded Edition',
    description: 'More detail, deeper worldbuilding',
    icon: '📚'
  },
  CONDENSED: {
    id: 'condensed',
    name: 'Condensed',
    description: 'Tighter, faster-paced version',
    icon: '⚡'
  }
};

export class RemasterEngine {
  constructor(storyBible = null, options = {}) {
    this.storyBible = storyBible;
    this.remasterHistory = options.remasterHistory || [];
    this.sourceVersions = new Map(); // Store original versions
  }

  /**
   * Analyze a story for remastering potential
   */
  async analyzeStory(content, storyBible) {
    const token = localStorage.getItem('auth_token');
    
    const prompt = `You are a literary analyst. Analyze the following story for remastering potential.

STORY CONTENT:
"""
${content.substring(0, 15000)} // First 15k chars for analysis
"""

${storyBible ? `STORY BIBLE:\n${JSON.stringify(storyBible, null, 2)}` : ''}

Provide analysis in JSON format:
{
  "structure_analysis": {
    "act_breakdown": "description of three-act structure",
    "pacing_assessment": "too_fast|good|too_slow",
    "plot_strengths": ["what works well"],
    "plot_weaknesses": ["what needs improvement"]
  },
  "character_analysis": {
    "protagonist_arc": "assessment of main character development",
    "character_strengths": ["well-developed characters"],
    "character_weaknesses": ["underdeveloped characters or missed opportunities"],
    "relationship_dynamics": "assessment of character relationships"
  },
  "thematic_analysis": {
    "identified_themes": ["list of themes"],
    "theme_execution": "strong|moderate|weak",
    "symbolism": ["notable symbols/motifs"],
    "thematic_opportunities": ["themes that could be strengthened"]
  },
  "style_analysis": {
    "voice_assessment": "strong|moderate|weak",
    "dialogue_quality": "natural|stiff|needs_work",
    "description_balance": "too_much|good|too_little",
    "show_vs_tell": "showing|mixed|telling"
  },
  "remaster_recommendations": {
    "priority_fixes": ["most important improvements"],
    "structural_changes": ["potential reorganization"],
    "enhancement_opportunities": ["areas to expand or deepen"],
    "suggested_branching_points": ["moments where story could diverge interestingly"]
  },
  "remaster_potential": {
    "score": 1-10,
    "recommended_types": ["full_remaster|branching_point|genre_shift|perspective_flip|enhanced|expanded|condensed"],
    "rationale": "why these types are recommended"
  }
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 4096,
        temperature: 0.4,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { error: 'Could not parse analysis', raw: content };
    } catch (err) {
      console.error('Story analysis failed:', err);
      return { error: err.message };
    }
  }

  /**
   * Generate a remastered version
   */
  async generateRemaster(originalContent, storyBible, options = {}) {
    const {
      type = 'full_remaster',
      title = 'Untitled',
      branchingPoint = null, // For branching_point type
      newGenre = null, // For genre_shift type
      newPerspective = null, // For perspective_flip type
      focusAreas = [], // Specific areas to improve
      preserveVoice = true,
      customInstructions = ''
    } = options;

    const token = localStorage.getItem('auth_token');
    
    // Build type-specific instructions
    let typeInstructions = '';
    switch (type) {
      case 'full_remaster':
        typeInstructions = `Create a complete rewrite that maintains the core story but improves:
- Pacing and structure
- Character development
- Dialogue quality
- Thematic depth
- Descriptive richness
Keep the plot largely the same but execute it better.`;
        break;
        
      case 'branching_point':
        typeInstructions = `The story diverges at this moment: "${branching_point}"
From this point forward, explore an alternative path that creates a compelling "what if" scenario.
The earlier parts can be summarized or lightly rewritten for context.`;
        break;
        
      case 'genre_shift':
        typeInstructions = `Transform this story into the ${newGenre} genre.
Maintain the core characters and essential plot points, but adapt:
- Tone and atmosphere
- Setting details
- Plot mechanics (if needed for genre)
- Pacing (genre-appropriate)`;
        break;
        
      case 'perspective_flip':
        typeInstructions = `Retell the same story from ${newPerspective}'s point of view.
Show the same events but with:
- Different internal thoughts and motivations
- Scenes the original POV didn't witness
- Different interpretation of events
- Their own subplot and arc`;
        break;
        
      case 'enhanced':
        typeInstructions = `Create an enhanced version that specifically improves these areas: ${focusAreas.join(', ')}
Keep most of the original text intact, but enhance the identified weak areas.`;
        break;
        
      case 'expanded':
        typeInstructions = `Create an expanded version with:
- More detailed worldbuilding
- Deeper character introspection
- Extended scenes
- Additional subplots
- Richer sensory details
Make the story approximately 1.5x longer.`;
        break;
        
      case 'condensed':
        typeInstructions = `Create a condensed, punchier version:
- Cut unnecessary scenes
- Tighten dialogue
- Remove redundancy
- Increase pacing
- Focus on essential plot and character beats
Make the story approximately 0.7x the length but maintain impact.`;
        break;
    }

    const prompt = `You are a master storyteller creating a remastered version of a story.

REMASTER TYPE: ${REMASTER_TYPES[type.toUpperCase()]?.name || type}
ORIGINAL TITLE: ${title}

${typeInstructions}

${preserveVoice ? 'Preserve the author\'s unique voice and style while making improvements.' : 'Feel free to adapt the voice to better serve the story.'}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ''}

${storyBible ? `STORY BIBLE (for reference):\n${JSON.stringify(storyBible, null, 2)}` : ''}

ORIGINAL STORY:
"""
${originalContent}
"""

Create the remastered version with a NEW TITLE. 

Also provide a CHANGELOG in this format:
{
  "new_title": "The remastered title",
  "summary": "Brief description of what changed",
  "major_changes": [
    {"type": "structural|character|plot|style|other", "description": "what changed", "rationale": "why"}
  ],
  "improvements": ["list of specific improvements made"],
  "preserved_elements": ["what was kept from original"],
  "branching_differences": "for branching_point: how the story differs"
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 8192, // Larger for full story
        temperature: 0.7, // Higher for creativity
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const response = res.data.content || res.data.response || '';
      
      // Extract the story and changelog
      const storyMatch = response.match(/(?:NEW STORY|REMASTERED VERSION|Here is the remastered version):?\s*\n?\n?([\s\S]*?)(?:\n?\n?CHANGELOG|\n?\n?\{)/i);
      const changelogMatch = response.match(/\{[\s\S]*\}/);
      
      const remasteredContent = storyMatch ? storyMatch[1].trim() : response;
      let changelog = {};
      
      if (changelogMatch) {
        try {
          changelog = JSON.parse(changelogMatch[0]);
        } catch (e) {
          changelog = { parse_error: true, raw: changelogMatch[0] };
        }
      }

      // Generate unique ID
      const remasterId = `remaster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const remasterRecord = {
        id: remasterId,
        type,
        originalTitle: title,
        newTitle: changelog.new_title || `${title} (${REMASTER_TYPES[type.toUpperCase()]?.name || type})`,
        content: remasteredContent,
        changelog,
        createdAt: Date.now(),
        options
      };

      this.remasterHistory.push(remasterRecord);

      return remasterRecord;

    } catch (err) {
      console.error('Remaster generation failed:', err);
      return { error: err.message };
    }
  }

  /**
   * Compare original vs remaster
   */
  async compareVersions(originalContent, remasterId) {
    const remaster = this.remasterHistory.find(r => r.id === remasterId);
    if (!remaster) {
      return { error: 'Remaster not found' };
    }

    const token = localStorage.getItem('auth_token');
    
    const prompt = `Compare these two versions of a story and provide a detailed comparison.

ORIGINAL:
"""
${originalContent.substring(0, 5000)}
"""

REMASTERED (${remaster.newTitle}):
"""
${remaster.content.substring(0, 5000)}
"""

Provide comparison in JSON format:
{
  "scene_by_scene": [
    {
      "scene": "description",
      "original_approach": "how original handled it",
      "remastered_approach": "how remaster handles it",
      "assessment": "which is stronger and why"
    }
  ],
  "character_comparison": {
    "original_strengths": [],
    "remastered_strengths": [],
    "which_develops_better": ""
  },
  "pacing_comparison": "which has better pacing and why",
  "dialogue_comparison": "which has stronger dialogue",
  "overall_assessment": "which version is stronger and why",
  "recommendations": "suggestions for cherry-picking improvements"
}`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 4096,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { raw: content };
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Generate multiple remaster options
   */
  async generateOptions(originalContent, storyBible, title) {
    // First analyze the story
    const analysis = await this.analyzeStory(originalContent, storyBible);
    
    if (analysis.error) {
      return { error: analysis.error };
    }

    // Generate recommended remaster types based on analysis
    const recommendedTypes = analysis.remaster_potential?.recommended_types || ['enhanced'];
    
    const options = recommendedTypes.map(type => ({
      type,
      name: REMASTER_TYPES[type.toUpperCase()]?.name || type,
      description: REMASTER_TYPES[type.toUpperCase()]?.description || '',
      rationale: this.getTypeRationale(type, analysis),
      estimatedImpact: this.estimateImpact(type, analysis)
    }));

    return {
      analysis,
      options,
      storyBible
    };
  }

  /**
   * Get rationale for a remaster type
   */
  getTypeRationale(type, analysis) {
    const rationales = {
      full_remaster: `Story has good bones but needs better execution in: ${analysis.structure_analysis?.plot_weaknesses?.slice(0, 2).join(', ')}`,
      enhanced: `Targeted improvements recommended for: ${analysis.style_analysis?.show_vs_tell === 'telling' ? 'show vs tell, ' : ''}${analysis.style_analysis?.dialogue_quality === 'stiff' ? 'dialogue' : ''}`,
      expanded: `Strong concept that could benefit from deeper ${analysis.character_analysis?.character_weaknesses?.length ? 'character development' : 'worldbuilding'}`,
      condensed: `Pacing assessment suggests ${analysis.structure_analysis?.pacing_assessment} - tightening could help`,
      branching_point: `Identified potential divergence point: ${analysis.remaster_recommendations?.suggested_branching_points?.[0] || 'midpoint'}`,
      genre_shift: `Story structure suggests it could work well in alternative genre`,
      perspective_flip: `${analysis.character_analysis?.character_weaknesses?.length ? 'Secondary characters need more development - flip could help' : 'Different POV could add depth'}`
    };
    
    return rationales[type] || 'Recommended based on analysis';
  }

  /**
   * Estimate impact of remaster type
   */
  estimateImpact(type, analysis) {
    const impacts = {
      full_remaster: 'high',
      enhanced: 'medium',
      expanded: 'medium',
      condensed: 'medium',
      branching_point: 'high',
      genre_shift: 'high',
      perspective_flip: 'high'
    };
    return impacts[type] || 'medium';
  }

  /**
   * Export remaster history
   */
  exportHistory() {
    return {
      remasterHistory: this.remasterHistory,
      count: this.remasterHistory.length
    };
  }

  /**
   * Delete a remaster
   */
  deleteRemaster(remasterId) {
    const idx = this.remasterHistory.findIndex(r => r.id === remasterId);
    if (idx !== -1) {
      this.remasterHistory.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export default RemasterEngine;
