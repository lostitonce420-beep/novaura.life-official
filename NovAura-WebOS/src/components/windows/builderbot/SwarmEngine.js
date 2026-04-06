/**
 * SwarmEngine - Multi-agent parallel execution system for Cybeni IDE
 * 
 * Inspired by Kimi's agent orchestration
 * Features:
 * - Parallel agent execution (batches of 5)
 * - Central orchestrator with project state
 * - File system simulation for agents
 * - QA loop with automatic fixes
 * - Agent fatigue detection (orchestrator takeover)
 */

import { BACKEND_URL } from '../../../services/aiService';
import axios from 'axios';

export const AGENT_TYPES = {
  FRONTEND: {
    id: 'frontend',
    name: 'Frontend Developer',
    specialty: 'React/Vue/HTML/CSS components',
    systemPrompt: `You are a frontend developer agent. You write clean, modern React/Vue/HTML code.
You have access to a virtual file system. Write complete, working code.
Always return your work in the format:
FILE: filepath
\`\`\`language
code
\`\`\``
  },
  BACKEND: {
    id: 'backend', 
    name: 'Backend Developer',
    specialty: 'APIs, databases, server logic',
    systemPrompt: `You are a backend developer agent. You write Node.js/Python APIs.
Focus on RESTful endpoints, database models, and business logic.
Return format:
FILE: filepath
\`\`\`language
code
\`\`\``
  },
  DESIGNER: {
    id: 'designer',
    name: 'UI/UX Designer', 
    specialty: 'CSS, Tailwind, animations, layouts',
    systemPrompt: `You are a UI/UX designer agent. You create beautiful, responsive designs.
Write CSS, Tailwind classes, and design tokens.
Return format:
FILE: filepath
\`\`\`css
styles
\`\`\``
  },
  CONTENT: {
    id: 'content',
    name: 'Content Writer',
    specialty: 'Text, copy, JSON data, configs',
    systemPrompt: `You are a content writer agent. You write copy, create JSON data, and config files.
Make content engaging and appropriate for the target audience.
Return format:
FILE: filepath
\`\`\`
content
\`\`\``
  },
  QA: {
    id: 'qa',
    name: 'QA Tester',
    specialty: 'Testing, bug detection, code review',
    systemPrompt: `You are a QA tester agent. You review code for bugs, security issues, and best practices.
Identify problems and suggest specific fixes.
Return format:
REVIEW: filename
ISSUES:
- [Severity] Description of issue
- Fix: Suggested solution`
  },
  ART: {
    id: 'art',
    name: 'Asset Creator',
    specialty: 'Image prompts, SVGs, icons, descriptions',
    systemPrompt: `You are an asset creator agent. You create image generation prompts, SVGs, and icon descriptions.
For images, write detailed prompts for AI image generators.
For SVGs, write the actual SVG code.
Return format:
FILE: filepath
\`\`\`
asset content or prompt
\`\`\``
  }
};

export class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.version = 0;
  }

  write(path, content, agentId) {
    this.files.set(path, {
      content,
      agentId,
      timestamp: Date.now(),
      version: ++this.version
    });
  }

  read(path) {
    return this.files.get(path)?.content || null;
  }

  exists(path) {
    return this.files.has(path);
  }

  list(directory = '/') {
    const files = [];
    for (const [path, data] of this.files) {
      if (path.startsWith(directory)) {
        files.push({ path, ...data });
      }
    }
    return files;
  }

  getAll() {
    return Array.from(this.files.entries()).map(([path, data]) => ({
      path,
      ...data
    }));
  }

  export() {
    const exportObj = {};
    for (const [path, data] of this.files) {
      exportObj[path] = data.content;
    }
    return exportObj;
  }

  import(files) {
    this.files.clear();
    for (const [path, content] of Object.entries(files)) {
      this.write(path, content, 'import');
    }
  }
}

export class Agent {
  constructor(type, id) {
    this.type = type;
    this.id = id;
    this.status = 'idle'; // idle, working, completed, error
    this.currentTask = null;
    this.attempts = 0;
    this.maxAttempts = 3;
  }

  async execute(task, vfs, context) {
    this.status = 'working';
    this.currentTask = task;
    this.attempts++;

    try {
      const result = await this.callAI(task, vfs, context);
      this.status = 'completed';
      return result;
    } catch (err) {
      this.status = 'error';
      throw err;
    }
  }

  async callAI(task, vfs, context) {
    const token = localStorage.getItem('auth_token');
    
    const prompt = this.buildPrompt(task, vfs, context);

    const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
      provider: 'gemini',
      prompt: prompt,
      maxTokens: 4096,
      temperature: 0.3,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return this.parseResponse(res.data.content || res.data.response);
  }

  buildPrompt(task, vfs, context) {
    const config = AGENT_TYPES[this.type];
    
    let prompt = `${config.systemPrompt}\n\n`;
    
    prompt += `=== PROJECT CONTEXT ===\n`;
    prompt += `Project: ${context.projectName}\n`;
    prompt += `Description: ${context.description}\n`;
    prompt += `Framework: ${context.framework || 'Not specified'}\n\n`;

    // Add relevant files from VFS
    const relevantFiles = this.getRelevantFiles(vfs, task);
    if (relevantFiles.length > 0) {
      prompt += `=== EXISTING FILES ===\n`;
      relevantFiles.forEach(file => {
        prompt += `\n--- ${file.path} ---\n`;
        prompt += file.content.substring(0, 1000);
        if (file.content.length > 1000) prompt += '\n... (truncated)';
      });
      prompt += '\n\n';
    }

    prompt += `=== YOUR TASK ===\n`;
    prompt += task.description;
    prompt += `\n\nCreate or modify files as needed. Be thorough and write complete, working code.`;

    return prompt;
  }

  getRelevantFiles(vfs, task) {
    // Get files that might be relevant to this task
    const allFiles = vfs.getAll();
    
    // Filter based on task dependencies
    if (task.dependencies) {
      return allFiles.filter(f => 
        task.dependencies.some(dep => f.path.includes(dep))
      );
    }
    
    // Return recent files
    return allFiles
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }

  parseResponse(response) {
    const files = [];
    const fileRegex = /FILE:\s*(.+?)\n```(\w+)?\n([\s\S]*?)```/g;
    
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        language: match[2] || 'txt',
        content: match[3].trim()
      });
    }

    return {
      files,
      raw: response,
      agentId: this.id,
      agentType: this.type
    };
  }

  reset() {
    this.status = 'idle';
    this.currentTask = null;
    this.attempts = 0;
  }
}

export class OrchestratorAgent {
  constructor() {
    this.vfs = new VirtualFileSystem();
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.projectContext = {};
    this.failed = false;
    this.failReason = null;
    this.isPlanning = false;
  }

  async createProject(prompt, options = {}) {
    this.projectContext = {
      projectName: options.name || 'Untitled Project',
      description: prompt,
      framework: options.framework,
      createdAt: Date.now()
    };

    try {
      // Step 1: Plan the project
      this.isPlanning = true;
      const plan = await this.createPlan(prompt);
      this.isPlanning = false;

      // Step 2: Create tasks from plan
      this.taskQueue = this.createTasks(plan);

      // Step 3: Execute in batches
      await this.executeBatches();

      // Step 4: QA Review
      await this.qaReview();

      return {
        success: true,
        files: this.vfs.export(),
        tasksCompleted: this.completedTasks.length,
        tasksFailed: this.failedTasks.length
      };
    } catch (err) {
      this.isPlanning = false;
      this.failed = true;
      this.failReason = err.message || 'Unknown error';
      throw err;
    }
  }

  async createPlan(prompt) {
    const token = localStorage.getItem('auth_token');
    
    const planPrompt = `You are a project orchestrator. Analyze this request and create a detailed execution plan.

REQUEST: ${prompt}

Create a plan that includes:
1. Project structure (folders and key files)
2. Which agent types needed (frontend, backend, design, content, art)
3. Specific tasks for each agent
4. Dependencies between tasks
5. Estimated complexity

Respond in JSON format:
{
  "structure": ["list of folders to create"],
  "agents": ["frontend", "backend", "design", ...],
  "tasks": [
    {
      "id": "task-1",
      "type": "frontend",
      "description": "what to build",
      "dependencies": ["task-ids that must complete first"],
      "outputs": ["files to create"]
    }
  ],
  "complexity": "simple|medium|complex"
}`;

    const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
      provider: 'gemini',
      prompt: planPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const content = res.data.content || res.data.response;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback plan
    return {
      structure: ['/src', '/public', '/assets'],
      agents: ['frontend', 'design', 'content'],
      tasks: [{
        id: 'task-1',
        type: 'frontend',
        description: prompt,
        dependencies: [],
        outputs: ['index.html', 'src/app.js']
      }]
    };
  }

  createTasks(plan) {
    const tasks = [];
    
    plan.tasks.forEach((task, index) => {
      tasks.push({
        ...task,
        status: 'pending',
        assignedAgent: null,
        result: null,
        createdAt: Date.now()
      });
    });

    return tasks;
  }

  async executeBatches() {
    const BATCH_SIZE = 5;

    while (this.taskQueue.some(t => t.status === 'pending')) {
      // Get ready tasks (dependencies met)
      const readyTasks = this.taskQueue.filter(t => 
        t.status === 'pending' && 
        this.dependenciesMet(t)
      ).slice(0, BATCH_SIZE);

      if (readyTasks.length === 0) {
        // Check for stuck tasks
        if (this.taskQueue.some(t => t.status === 'pending')) {
          console.warn('Tasks stuck waiting for dependencies');
          break;
        }
        break;
      }

      // Execute batch in parallel
      await Promise.all(readyTasks.map(task => this.executeTask(task)));
    }
  }

  dependenciesMet(task) {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    return task.dependencies.every(depId => {
      const depTask = this.taskQueue.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });
  }

  async executeTask(task) {
    task.status = 'working';
    
    // Get or create agent
    const agent = this.getOrCreateAgent(task.type);
    task.assignedAgent = agent.id;

    try {
      const result = await agent.execute(task, this.vfs, this.projectContext);
      
      // Write files to VFS
      result.files.forEach(file => {
        this.vfs.write(file.path, file.content, agent.id);
      });

      task.status = 'completed';
      task.result = result;
      this.completedTasks.push(task);
      
      agent.reset();
    } catch (err) {
      console.error(`Task ${task.id} failed:`, err);
      
      if (agent.attempts < agent.maxAttempts) {
        // Retry
        task.status = 'pending';
      } else {
        // Orchestrator takes over
        await this.orchestratorTakeover(task);
      }
    }
  }

  getOrCreateAgent(type) {
    // Find idle agent of this type
    for (const agent of this.agents.values()) {
      if (agent.type === type && agent.status === 'idle') {
        return agent;
      }
    }

    // Create new agent
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const agent = new Agent(type, id);
    this.agents.set(id, agent);
    return agent;
  }

  async orchestratorTakeover(task) {
    console.log(`Orchestrator taking over task ${task.id}`);
    
    // The orchestrator does the work itself
    const token = localStorage.getItem('auth_token');
    
    const prompt = `You are the orchestrator. A task failed after ${task.assignedAgent?.attempts || 0} attempts.
Complete this task yourself:

${task.description}

Files in project:
${this.vfs.getAll().map(f => `- ${f.path}`).join('\n')}

Write complete, working code.`;

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        provider: 'gemini',
        prompt: prompt,
        maxTokens: 4096,
        temperature: 0.3,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const content = res.data.content || res.data.response;
      const fileRegex = /FILE:\s*(.+?)\n```(\w+)?\n([\s\S]*?)```/g;
      
      let match;
      while ((match = fileRegex.exec(content)) !== null) {
        this.vfs.write(match[1].trim(), match[3].trim(), 'orchestrator');
      }

      task.status = 'completed';
      task.result = { files: [], raw: content, orchestratorOverride: true };
      this.completedTasks.push(task);
    } catch (err) {
      task.status = 'failed';
      task.error = err.message;
      this.failedTasks.push(task);
    }
  }

  async qaReview() {
    const qaAgent = new Agent('qa', 'qa-master');
    
    const files = this.vfs.getAll();
    const review = await qaAgent.execute(
      { description: 'Review all code for bugs and issues' },
      this.vfs,
      this.projectContext
    );

    // Parse QA feedback
    const issues = this.parseQAReview(review.raw);
    
    // Fix critical issues
    for (const issue of issues.filter(i => i.severity === 'critical')) {
      await this.fixIssue(issue);
    }

    return review;
  }

  parseQAReview(review) {
    const issues = [];
    const issueRegex = /-\s*\[([^\]]+)\]\s*(.+?)(?=\n-|\n\n|$)/g;
    
    let match;
    while ((match = issueRegex.exec(review)) !== null) {
      issues.push({
        severity: match[1].toLowerCase(),
        description: match[2].trim()
      });
    }

    return issues;
  }

  async fixIssue(issue) {
    // Create fix task
    const fixTask = {
      id: `fix-${Date.now()}`,
      type: 'frontend', // Default, could be smarter
      description: `Fix: ${issue.description}`,
      status: 'pending',
      dependencies: []
    };

    this.taskQueue.push(fixTask);
    await this.executeTask(fixTask);
  }

  getStatus() {
    return {
      totalTasks: this.taskQueue.length,
      completed: this.completedTasks.length,
      failedTasks: this.failedTasks.length,
      pending: this.taskQueue.filter(t => t.status === 'pending').length,
      working: this.taskQueue.filter(t => t.status === 'working').length,
      agents: this.agents.size,
      files: this.vfs.files.size,
      isPlanning: this.isPlanning,
      failed: this.failed,
      failReason: this.failReason
    };
  }
}

export class SwarmEngine {
  constructor() {
    this.orchestrator = new OrchestratorAgent();
    this.activeProjects = new Map();
  }

  async startProject(prompt, options = {}) {
    const projectId = `swarm-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    
    // Create new orchestrator for this project
    const orchestrator = new OrchestratorAgent();
    this.activeProjects.set(projectId, orchestrator);

    // Fire-and-forget — return projectId immediately so the UI can poll progress
    orchestrator.createProject(prompt, options).catch(err => {
      orchestrator.failed = true;
      orchestrator.failReason = err.message || 'Build failed';
      console.error('[SwarmEngine] Project failed:', err);
    });

    return { projectId };
  }

  getProjectStatus(projectId) {
    const orchestrator = this.activeProjects.get(projectId);
    if (!orchestrator) return null;
    return orchestrator.getStatus();
  }

  getProjectFiles(projectId) {
    const orchestrator = this.activeProjects.get(projectId);
    if (!orchestrator) return null;
    return orchestrator.vfs.export();
  }

  async continueProject(projectId, additionalPrompt) {
    const orchestrator = this.activeProjects.get(projectId);
    if (!orchestrator) throw new Error('Project not found');

    // Create new tasks based on additional prompt
    const newPlan = await orchestrator.createPlan(additionalPrompt);
    const newTasks = orchestrator.createTasks(newPlan);
    
    orchestrator.taskQueue.push(...newTasks);
    await orchestrator.executeBatches();

    return {
      projectId,
      files: orchestrator.vfs.export(),
      tasksCompleted: orchestrator.completedTasks.length
    };
  }
}

export default SwarmEngine;
