import React, { useState } from 'react';
import { BrainCircuit, ChevronRight, RotateCcw, Trophy, BarChart3, Lightbulb, MessageCircle, Puzzle, Palette } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const ASSESSMENTS = [
  {
    id: 'creativity',
    title: 'Creativity Index',
    icon: Palette,
    color: 'from-pink-500 to-purple-500',
    desc: 'Measures divergent thinking, originality, and creative problem-solving',
    questions: [
      { q: 'When faced with a problem, you typically:', options: ['Follow proven solutions', 'Combine existing approaches', 'Invent something entirely new', 'Explore many ideas before choosing'], scores: [1, 2, 4, 3] },
      { q: 'How do you feel about ambiguity?', options: ['Uncomfortable — I prefer clarity', 'I tolerate it when needed', 'I actively seek it — that\'s where ideas live', 'It depends on the context'], scores: [1, 2, 4, 3] },
      { q: 'Your ideal creative environment is:', options: ['Quiet and organized', 'Collaborative and energetic', 'Chaotic and stimulating', 'Changing constantly'], scores: [2, 3, 4, 3] },
      { q: 'How many uses can you think of for a brick?', options: ['2-3 obvious ones', '4-6 including some creative ones', '7-10 spanning different categories', '10+ including absurd ones'], scores: [1, 2, 3, 4] },
      { q: 'When you daydream, you mostly:', options: ['Replay past events', 'Plan future tasks', 'Imagine impossible scenarios', 'Create stories or worlds'], scores: [1, 2, 3, 4] },
      { q: 'You see connections between unrelated things:', options: ['Rarely', 'Sometimes', 'Often', 'Constantly — everything is connected'], scores: [1, 2, 3, 4] },
      { q: 'How do you handle creative blocks?', options: ['Push through with discipline', 'Take a break and return', 'Switch to a completely different domain', 'Use random stimuli or constraints'], scores: [2, 2, 3, 4] },
      { q: 'Your relationship with rules is:', options: ['I follow them carefully', 'I understand them, then adapt', 'Rules are suggestions', 'I create my own frameworks'], scores: [1, 2, 3, 4] },
    ],
  },
  {
    id: 'reasoning',
    title: 'Abstract Reasoning',
    icon: Puzzle,
    color: 'from-blue-500 to-cyan-500',
    desc: 'Evaluates pattern recognition, logical thinking, and abstract problem-solving',
    questions: [
      { q: 'If A > B and B > C, what can you say about A and C?', options: ['A = C', 'A > C', 'Can\'t determine', 'A < C'], scores: [0, 4, 0, 0] },
      { q: 'What comes next: 2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '44'], scores: [0, 0, 4, 0] },
      { q: 'A clock shows 3:15. What is the angle between the hands?', options: ['0°', '7.5°', '90°', '82.5°'], scores: [0, 4, 0, 0] },
      { q: 'If all Bloops are Razzies, and all Razzies are Lazzies, then:', options: ['All Lazzies are Bloops', 'All Bloops are Lazzies', 'Some Lazzies are Bloops', 'Both B and C'], scores: [0, 3, 0, 4] },
      { q: 'Complete: 1, 1, 2, 3, 5, 8, 13, ?', options: ['18', '20', '21', '26'], scores: [0, 0, 4, 0] },
      { q: 'A bat and ball cost $1.10 total. The bat costs $1 more than the ball. What does the ball cost?', options: ['$0.10', '$0.05', '$0.15', '$0.01'], scores: [0, 4, 0, 0] },
      { q: 'How many squares are on a standard chessboard? (not just the 64 small ones)', options: ['64', '204', '91', '100'], scores: [1, 4, 0, 0] },
      { q: 'If you fold a piece of paper in half 42 times, how thick would it be?', options: ['About a book', 'About a building', 'About a mountain', 'Past the moon'], scores: [0, 0, 0, 4] },
    ],
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    desc: 'Assesses analytical thinking, debugging instincts, and systematic approaches',
    questions: [
      { q: 'When debugging code, you first:', options: ['Read the error message carefully', 'Add console.log everywhere', 'Rubber duck explain the problem', 'Binary search: comment out half the code'], scores: [3, 1, 3, 4] },
      { q: 'A feature takes 3x longer than estimated. You:', options: ['Work overtime to hit the deadline', 'Communicate early and adjust scope', 'Rewrite with a simpler approach', 'Ship what\'s done and iterate'], scores: [1, 4, 3, 3] },
      { q: 'Your approach to learning a new language/framework:', options: ['Read the docs cover to cover', 'Build a small project immediately', 'Study the source code', 'Find the best tutorial and follow along'], scores: [2, 4, 3, 2] },
      { q: 'Two team members disagree on architecture. You:', options: ['Go with the senior person\'s opinion', 'Prototype both and compare', 'Research industry best practices', 'Find a hybrid that satisfies both'], scores: [1, 4, 3, 3] },
      { q: 'A system is slow. Your first step:', options: ['Rewrite in a faster language', 'Profile to find the bottleneck', 'Add caching everywhere', 'Scale horizontally'], scores: [0, 4, 2, 2] },
      { q: 'How do you handle tasks you\'ve never done before?', options: ['Research extensively before starting', 'Jump in and figure it out', 'Find someone who\'s done it', 'Break it into smaller known problems'], scores: [2, 2, 2, 4] },
      { q: 'When reviewing someone\'s code, you focus on:', options: ['Style and formatting', 'Logic correctness', 'Edge cases and error handling', 'Architecture and maintainability'], scores: [1, 3, 3, 4] },
      { q: 'Your approach to technical debt:', options: ['Fix it when it breaks', 'Dedicate regular time to cleanup', 'Prevent it with strict standards', 'Refactor while working on related features'], scores: [1, 3, 2, 4] },
    ],
  },
  {
    id: 'communication',
    title: 'Communication Style',
    icon: MessageCircle,
    color: 'from-green-500 to-teal-500',
    desc: 'Identifies your natural communication patterns and collaboration strengths',
    questions: [
      { q: 'In meetings, you tend to:', options: ['Listen and synthesize at the end', 'Ask probing questions', 'Share ideas enthusiastically', 'Keep notes and action items'], scores: [3, 4, 2, 3] },
      { q: 'When explaining a complex concept:', options: ['Use precise technical terminology', 'Draw diagrams and visuals', 'Use analogies and stories', 'Start simple and add layers'], scores: [2, 3, 3, 4] },
      { q: 'Your writing style is:', options: ['Concise and direct', 'Detailed and thorough', 'Casual and conversational', 'Structured with clear sections'], scores: [3, 3, 2, 4] },
      { q: 'When you disagree with someone:', options: ['State your position directly', 'Ask questions to understand their view', 'Find common ground first', 'Present data to support your case'], scores: [2, 4, 3, 3] },
      { q: 'Receiving feedback, you:', options: ['Want specifics and examples', 'Need time to process privately', 'Prefer direct, honest critique', 'Like collaborative discussion'], scores: [3, 2, 3, 4] },
      { q: 'Your preferred communication channel:', options: ['Face-to-face / video call', 'Written (Slack, email)', 'Quick voice messages', 'Async docs with comments'], scores: [3, 3, 2, 4] },
      { q: 'When onboarding someone new:', options: ['Give them docs and let them explore', 'Pair with them for a week', 'Record walkthrough videos', 'Create a structured checklist'], scores: [2, 4, 3, 3] },
      { q: 'In conflict resolution, your strength is:', options: ['Staying calm under pressure', 'Seeing all perspectives', 'Finding win-win solutions', 'Moving past it and focusing forward'], scores: [3, 4, 4, 2] },
    ],
  },
];

const ARCHETYPES = {
  creativity: [
    { min: 0, max: 12, name: 'The Craftsman', desc: 'Methodical and precise. You excel at perfecting established approaches.' },
    { min: 13, max: 20, name: 'The Explorer', desc: 'Curious and adaptive. You blend proven methods with new ideas.' },
    { min: 21, max: 28, name: 'The Innovator', desc: 'Highly original thinker. You naturally see possibilities others miss.' },
    { min: 29, max: 32, name: 'The Visionary', desc: 'Boundlessly creative. Your mind operates in uncharted territory.' },
  ],
  reasoning: [
    { min: 0, max: 10, name: 'Intuitive', desc: 'You trust gut feelings and learn through experience.' },
    { min: 11, max: 18, name: 'Analytical', desc: 'Strong logical foundation with room for pattern mastery.' },
    { min: 19, max: 26, name: 'Systematic', desc: 'Excellent pattern recognition and logical deduction skills.' },
    { min: 27, max: 32, name: 'Architect', desc: 'Exceptional abstract reasoning. Complex patterns are your playground.' },
  ],
  'problem-solving': [
    { min: 0, max: 12, name: 'The Learner', desc: 'Building problem-solving instincts through practice and study.' },
    { min: 13, max: 20, name: 'The Tactician', desc: 'Solid practical problem-solver who gets things done.' },
    { min: 21, max: 28, name: 'The Strategist', desc: 'Thinks several steps ahead with strong debugging instincts.' },
    { min: 29, max: 32, name: 'The Architect', desc: 'Master problem-solver who sees systems, not just symptoms.' },
  ],
  communication: [
    { min: 0, max: 12, name: 'The Thinker', desc: 'Prefers internal processing. Most effective in written form.' },
    { min: 13, max: 20, name: 'The Contributor', desc: 'Solid communicator who adds value in collaborative settings.' },
    { min: 21, max: 28, name: 'The Connector', desc: 'Natural communicator who bridges gaps between people and ideas.' },
    { min: 29, max: 32, name: 'The Catalyst', desc: 'Exceptional communicator who elevates entire teams.' },
  ],
};

export default function PsychometricsWindow() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('psyche_history') || '[]'); } catch { return []; }
  });
  const [activeTest, setActiveTest] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const saveHistory = (updated) => { setHistory(updated); kernelStorage.setItem('psyche_history', JSON.stringify(updated)); };

  const startTest = (test) => {
    setActiveTest(test);
    setCurrentQ(0);
    setAnswers([]);
    setResult(null);
  };

  const answer = (scoreIndex) => {
    const q = activeTest.questions[currentQ];
    const newAnswers = [...answers, q.scores[scoreIndex]];
    setAnswers(newAnswers);

    if (currentQ + 1 >= activeTest.questions.length) {
      // Calculate result
      const total = newAnswers.reduce((a, b) => a + b, 0);
      const max = activeTest.questions.length * 4;
      const pct = Math.round((total / max) * 100);
      const archetype = ARCHETYPES[activeTest.id]?.find(a => total >= a.min && total <= a.max) || ARCHETYPES[activeTest.id]?.slice(-1)[0];
      const res = { testId: activeTest.id, title: activeTest.title, score: total, max, pct, archetype, takenAt: new Date().toISOString() };
      setResult(res);

      const updated = [...history.filter(h => h.testId !== activeTest.id), res];
      saveHistory(updated);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  // Result view
  if (result) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => { setActiveTest(null); setResult(null); }} className="text-[10px] text-slate-400 hover:text-white">← Back</button>
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Results — {result.title}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Score display */}
          <div className="text-center py-4">
            <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-purple-600/30 mb-3">
              <div className="text-3xl font-bold text-purple-300">{result.pct}%</div>
            </div>
            <div className="text-xs text-slate-400">{result.score} / {result.max} points</div>
          </div>

          {/* Score bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all" style={{ width: `${result.pct}%` }} />
          </div>

          {/* Archetype */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-800/30">
            <div className="text-lg font-bold text-purple-300 mb-1">{result.archetype?.name}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{result.archetype?.desc}</p>
          </div>

          {/* Scale breakdown */}
          <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800">
            <div className="text-[10px] text-slate-500 mb-2">SCORE BREAKDOWN</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {['Low', 'Moderate', 'High', 'Exceptional'].map((label, i) => (
                <div key={label} className={`py-1.5 rounded text-[9px] ${
                  result.pct <= 37 && i === 0 ? 'bg-slate-700 text-white' :
                  result.pct <= 62 && i === 1 ? 'bg-amber-900/40 text-amber-300' :
                  result.pct <= 87 && i === 2 ? 'bg-blue-900/40 text-blue-300' :
                  result.pct > 87 && i === 3 ? 'bg-purple-900/40 text-purple-300' :
                  'bg-slate-800/30 text-slate-600'
                }`}>{label}</div>
              ))}
            </div>
          </div>

          <button onClick={() => { setActiveTest(null); setResult(null); }}
            className="w-full py-2 bg-purple-600/30 hover:bg-purple-500/30 border border-purple-700 rounded-lg text-xs text-purple-200">
            Take Another Assessment
          </button>
        </div>
      </div>
    );
  }

  // Question view
  if (activeTest) {
    const q = activeTest.questions[currentQ];
    const progress = ((currentQ) / activeTest.questions.length) * 100;
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setActiveTest(null)} className="text-[10px] text-slate-400 hover:text-white">← Quit</button>
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">{activeTest.title}</span>
          <span className="ml-auto text-[10px] text-slate-500">{currentQ + 1}/{activeTest.questions.length}</span>
        </div>

        {/* Progress */}
        <div className="w-full h-1 bg-slate-800 shrink-0">
          <div className="h-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-sm text-white/90 text-center mb-6 max-w-sm leading-relaxed">{q.q}</p>
          <div className="w-full max-w-sm space-y-2">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(i)}
                className="w-full text-left px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-purple-700/50 hover:bg-purple-900/10 transition-all text-xs text-slate-300 hover:text-white">
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Psychometrics</span>
        </div>
        {history.length > 0 && <span className="text-[10px] text-slate-500">{history.length} completed</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-slate-500 text-center mb-2">Discover your cognitive strengths</p>

        {ASSESSMENTS.map(test => {
          const Icon = test.icon;
          const past = history.find(h => h.testId === test.id);
          return (
            <button key={test.id} onClick={() => startTest(test)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-600 transition-all group text-left">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${test.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white/80">{test.title}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">{test.desc}</p>
                {past && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${past.pct}%` }} />
                    </div>
                    <span className="text-[9px] text-purple-400">{past.pct}% — {past.archetype?.name}</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 shrink-0" />
            </button>
          );
        })}

        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 mb-2">YOUR PROFILE</div>
            <div className="grid grid-cols-2 gap-2">
              {history.map(h => (
                <div key={h.testId} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-[9px] text-slate-500">{h.title}</div>
                  <div className="text-xs font-bold text-purple-300">{h.archetype?.name}</div>
                  <div className="text-[9px] text-slate-600">{h.pct}% · {new Date(h.takenAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
