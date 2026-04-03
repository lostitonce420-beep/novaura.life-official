import React, { useState, useEffect } from 'react';
import { Dumbbell, Star, Flame, Trophy, Check, ChevronRight, RotateCcw, Copy, Zap } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const CATEGORIES = ['All', 'Algorithms', 'Data Structures', 'Web Dev', 'Game Dev', 'Creative'];

const CHALLENGES = [
  // Algorithms
  { id: 'fizzbuzz', title: 'FizzBuzz', cat: 'Algorithms', diff: 'easy', xp: 10,
    desc: 'Print numbers 1–100. For multiples of 3 print "Fizz", multiples of 5 print "Buzz", both print "FizzBuzz".',
    starter: '// Write your FizzBuzz solution\nfunction fizzBuzz() {\n  \n}', hint: 'Use the modulo operator (%).',
    check: ['fizz', 'buzz', 'for', '%'] },
  { id: 'palindrome', title: 'Palindrome Check', cat: 'Algorithms', diff: 'easy', xp: 10,
    desc: 'Write a function that returns true if a string is a palindrome (reads the same forwards and backwards).',
    starter: 'function isPalindrome(str) {\n  \n}', hint: 'Try reversing the string and comparing.',
    check: ['reverse', 'return'] },
  { id: 'fibonacci', title: 'Fibonacci Sequence', cat: 'Algorithms', diff: 'medium', xp: 25,
    desc: 'Generate the first N numbers of the Fibonacci sequence. Each number is the sum of the two before it.',
    starter: 'function fibonacci(n) {\n  \n}', hint: 'Start with [0, 1] and build up.',
    check: ['return', 'function'] },
  { id: 'binary-search', title: 'Binary Search', cat: 'Algorithms', diff: 'medium', xp: 25,
    desc: 'Implement binary search on a sorted array. Return the index of the target or -1 if not found.',
    starter: 'function binarySearch(arr, target) {\n  \n}', hint: 'Use two pointers: low and high. Check the middle each time.',
    check: ['mid', 'return', 'while'] },
  { id: 'merge-sort', title: 'Merge Sort', cat: 'Algorithms', diff: 'hard', xp: 50,
    desc: 'Implement the merge sort algorithm. Divide the array in half, sort each half, then merge them.',
    starter: 'function mergeSort(arr) {\n  \n}\n\nfunction merge(left, right) {\n  \n}', hint: 'Recursion! Base case: array of length ≤ 1.',
    check: ['merge', 'return', 'length'] },

  // Data Structures
  { id: 'stack', title: 'Stack Implementation', cat: 'Data Structures', diff: 'easy', xp: 10,
    desc: 'Build a Stack class with push(), pop(), peek(), and isEmpty() methods.',
    starter: 'class Stack {\n  constructor() {\n    \n  }\n  push(item) { }\n  pop() { }\n  peek() { }\n  isEmpty() { }\n}', hint: 'Use an array internally.',
    check: ['push', 'pop', 'class'] },
  { id: 'linked-list', title: 'Linked List', cat: 'Data Structures', diff: 'medium', xp: 25,
    desc: 'Create a singly linked list with append(), prepend(), delete(), and find() methods.',
    starter: 'class Node {\n  constructor(value) {\n    this.value = value;\n    this.next = null;\n  }\n}\n\nclass LinkedList {\n  constructor() {\n    this.head = null;\n  }\n  append(value) { }\n  find(value) { }\n}',
    hint: 'Traverse with a while loop: current = current.next', check: ['next', 'head', 'class'] },
  { id: 'hash-map', title: 'Hash Map', cat: 'Data Structures', diff: 'hard', xp: 50,
    desc: 'Build a HashMap with set(), get(), delete(), and has() methods. Handle collisions with chaining.',
    starter: 'class HashMap {\n  constructor(size = 53) {\n    this.map = new Array(size);\n  }\n  _hash(key) { }\n  set(key, value) { }\n  get(key) { }\n}',
    hint: 'Hash function: sum char codes, mod by array size. Store [key, value] pairs in buckets.', check: ['hash', 'set', 'get'] },

  // Web Dev
  { id: 'todo-app', title: 'Todo List Component', cat: 'Web Dev', diff: 'easy', xp: 10,
    desc: 'Build a React todo list with add, toggle complete, and delete functionality.',
    starter: 'function TodoApp() {\n  const [todos, setTodos] = React.useState([]);\n  const [input, setInput] = React.useState("");\n\n  return (\n    <div>\n      {/* Your JSX here */}\n    </div>\n  );\n}',
    hint: 'Map over todos to render them. Each needs an id, text, and completed flag.', check: ['useState', 'map', 'onClick'] },
  { id: 'fetch-api', title: 'API Data Fetcher', cat: 'Web Dev', diff: 'medium', xp: 25,
    desc: 'Create a component that fetches data from an API, shows loading state, handles errors, and displays results.',
    starter: 'function DataFetcher({ url }) {\n  const [data, setData] = React.useState(null);\n  const [loading, setLoading] = React.useState(true);\n  const [error, setError] = React.useState(null);\n\n  return <div>{/* Render states */}</div>;\n}',
    hint: 'Use useEffect with async/await. Wrap fetch in try/catch.', check: ['useEffect', 'fetch', 'async'] },
  { id: 'form-validation', title: 'Form Validator', cat: 'Web Dev', diff: 'medium', xp: 25,
    desc: 'Build a registration form with real-time validation: email format, password strength (8+ chars, uppercase, number), matching passwords.',
    starter: 'function RegistrationForm() {\n  // Email, password, confirm password\n  // Show validation errors in real-time\n  return <form>{/* ... */}</form>;\n}',
    hint: 'Use regex for email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/. Check password on every keystroke.', check: ['onChange', 'regex', 'password'] },

  // Game Dev
  { id: 'game-loop', title: 'Game Loop', cat: 'Game Dev', diff: 'easy', xp: 10,
    desc: 'Implement a basic game loop using requestAnimationFrame with deltaTime calculation for frame-independent movement.',
    starter: 'class GameLoop {\n  constructor(updateFn, renderFn) {\n    this.update = updateFn;\n    this.render = renderFn;\n    this.lastTime = 0;\n    this.running = false;\n  }\n  start() { }\n  stop() { }\n  loop(timestamp) { }\n}',
    hint: 'deltaTime = (timestamp - lastTime) / 1000 for seconds.', check: ['requestAnimationFrame', 'deltaTime'] },
  { id: 'collision', title: 'AABB Collision', cat: 'Game Dev', diff: 'medium', xp: 25,
    desc: 'Implement Axis-Aligned Bounding Box collision detection between two rectangles. Return true if overlapping.',
    starter: '// rect = { x, y, width, height }\nfunction checkCollision(rectA, rectB) {\n  \n}',
    hint: 'Two rectangles DON\'T overlap if one is fully left/right/above/below the other.', check: ['return', 'width', 'height'] },
  { id: 'pathfinding', title: 'A* Pathfinding', cat: 'Game Dev', diff: 'hard', xp: 50,
    desc: 'Implement A* pathfinding on a 2D grid. Find the shortest path from start to goal avoiding obstacles.',
    starter: '// grid: 2D array (0 = walkable, 1 = wall)\n// Returns array of [row, col] positions\nfunction aStar(grid, start, goal) {\n  \n}',
    hint: 'f(n) = g(n) + h(n). Use Manhattan distance for heuristic. Priority queue for open set.', check: ['heuristic', 'neighbor', 'path'] },

  // Creative
  { id: 'particle-system', title: 'Particle System', cat: 'Creative', diff: 'medium', xp: 25,
    desc: 'Create a canvas-based particle system. Particles spawn, move with velocity, fade out, and respawn.',
    starter: 'class Particle {\n  constructor(x, y) {\n    // position, velocity, life, color\n  }\n  update(dt) { }\n  draw(ctx) { }\n}\n\nclass ParticleSystem {\n  constructor(canvas) { }\n  emit(x, y, count) { }\n  update() { }\n  render() { }\n}',
    hint: 'Give each particle a lifetime. Reduce alpha as life decreases.', check: ['particle', 'velocity', 'draw'] },
  { id: 'procedural-terrain', title: 'Procedural Terrain', cat: 'Creative', diff: 'hard', xp: 50,
    desc: 'Generate 2D terrain using Perlin/simplex noise. Render as a side-view landscape with layers (sky, ground, underground).',
    starter: '// Simple noise function\nfunction noise(x) {\n  // Implement or use a noise library\n}\n\nfunction generateTerrain(width, height) {\n  const terrain = [];\n  // Generate height map using noise\n  return terrain;\n}\n\nfunction renderTerrain(ctx, terrain) {\n  // Draw the landscape\n}',
    hint: 'Layer multiple octaves of noise with decreasing amplitude for natural terrain.', check: ['noise', 'terrain', 'draw'] },
];

const DIFF_COLORS = { easy: 'text-green-400 bg-green-900/30', medium: 'text-amber-400 bg-amber-900/30', hard: 'text-red-400 bg-red-900/30' };
const DIFF_XP = { easy: 10, medium: 25, hard: 50 };

const XP_LEVELS = [0, 50, 120, 220, 350, 520, 750, 1050, 1450, 2000];

export default function ChallengesWindow() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('challenges_profile') || 'null') || { xp: 0, completed: [], streak: 0, lastDay: null }; }
    catch { return { xp: 0, completed: [], streak: 0, lastDay: null }; }
  });
  const [cat, setCat] = useState('All');
  const [active, setActive] = useState(null);
  const [code, setCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null); // 'pass' | 'fail' | null

  const save = (p) => { setProfile(p); kernelStorage.setItem('challenges_profile', JSON.stringify(p)); };

  const level = XP_LEVELS.findIndex(x => profile.xp < x);
  const currentLevel = level === -1 ? XP_LEVELS.length : level;
  const nextXp = XP_LEVELS[currentLevel] || profile.xp + 100;
  const prevXp = XP_LEVELS[currentLevel - 1] || 0;
  const xpProgress = ((profile.xp - prevXp) / (nextXp - prevXp)) * 100;

  const filtered = CHALLENGES.filter(c => cat === 'All' || c.cat === cat);

  const startChallenge = (ch) => {
    setActive(ch);
    setCode(ch.starter);
    setShowHint(false);
    setResult(null);
  };

  const submitSolution = () => {
    if (!active) return;
    const lower = code.toLowerCase();
    const passed = active.check.every(keyword => lower.includes(keyword.toLowerCase()));

    if (passed && !profile.completed.includes(active.id)) {
      const today = new Date().toDateString();
      const streak = profile.lastDay === new Date(Date.now() - 86400000).toDateString() ? profile.streak + 1 : (profile.lastDay === today ? profile.streak : 1);
      save({ ...profile, xp: profile.xp + active.xp, completed: [...profile.completed, active.id], streak, lastDay: today });
    }
    setResult(passed ? 'pass' : 'fail');
  };

  // Active challenge view
  if (active) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setActive(null)} className="text-[10px] text-slate-400 hover:text-white">← Back</button>
          <Dumbbell className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold truncate">{active.title}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${DIFF_COLORS[active.diff]}`}>{active.diff} · {active.xp} XP</span>
        </div>

        {/* Description */}
        <div className="px-4 py-2 border-b border-slate-800/50 shrink-0">
          <p className="text-xs text-slate-300 leading-relaxed">{active.desc}</p>
          {showHint ? (
            <p className="text-[10px] text-amber-400/80 mt-1">💡 {active.hint}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-[10px] text-slate-600 hover:text-amber-400 mt-1">Show hint</button>
          )}
        </div>

        {/* Code editor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <textarea
            value={code}
            onChange={e => { setCode(e.target.value); setResult(null); }}
            className="flex-1 p-3 bg-black/40 text-[11px] text-slate-200 font-mono resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Result + actions */}
        <div className="px-4 py-2 border-t border-slate-800 shrink-0 flex items-center gap-2">
          {result === 'pass' && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Passed! +{active.xp} XP</span>}
          {result === 'fail' && <span className="text-xs text-red-400">Not quite — check the requirements and try again.</span>}
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setCode(active.starter); setResult(null); }} className="px-3 py-1.5 bg-slate-800 rounded text-[10px] text-slate-400 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
            <button onClick={() => navigator.clipboard.writeText(code)} className="px-3 py-1.5 bg-slate-800 rounded text-[10px] text-slate-400 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
            <button onClick={submitSolution} className="px-4 py-1.5 bg-indigo-600/60 hover:bg-indigo-500/60 rounded text-[10px] text-indigo-200 font-medium">Submit</button>
          </div>
        </div>
      </div>
    );
  }

  // Challenge list
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold">Challenges</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-amber-400 flex items-center gap-1"><Flame className="w-3 h-3" />{profile.streak} day streak</span>
          <span className="text-green-400">{profile.completed.length}/{CHALLENGES.length} done</span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="px-4 py-2 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-indigo-300 font-medium flex items-center gap-1"><Zap className="w-3 h-3" />Level {currentLevel}</span>
          <span className="text-slate-500">{profile.xp} / {nextXp} XP</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(100, xpProgress)}%` }} />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-1.5 border-b border-slate-800/30 shrink-0 flex gap-1 overflow-x-auto">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap ${cat === c ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-500 hover:bg-slate-800'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filtered.map(ch => {
          const done = profile.completed.includes(ch.id);
          return (
            <button key={ch.id} onClick={() => startChallenge(ch)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group ${done ? 'bg-green-900/10 border border-green-900/20' : 'bg-slate-900/30 border border-slate-800 hover:border-slate-600'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-green-800/30' : 'bg-slate-800'}`}>
                {done ? <Check className="w-4 h-4 text-green-400" /> : <Code className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/80 truncate">{ch.title}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${DIFF_COLORS[ch.diff]}`}>{ch.diff}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{ch.desc}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] text-amber-600">{ch.xp}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Code(props) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
