import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Zap, Users, Bot, Sparkles, Crown, Brain, Gamepad2, ChevronLeft, Rocket, Sword } from 'lucide-react';
import GildedCageGame from '../games/GildedCageGame';

// ============================================================================
// GAMES ARENA — Chess, Checkers, Tic-Tac-Toe, Nova Strike, Gilded Cage
// ============================================================================

// ─── Iframe Game Wrapper (for HTML canvas games) ─────────────────────────────

function IframeGame({ src, onBack, title }) {
  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Arena
        </button>
        <span className="text-slate-500 text-sm ml-2">{title}</span>
      </div>
      <iframe
        src={src}
        className="flex-1 w-full border-0"
        title={title}
        allow="autoplay"
      />
    </div>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function GameSelector({ onSelect }) {
  const games = [
    { id: 'nova-strike', name: 'Nova Strike', icon: Rocket, color: 'cyan', desc: 'Galactica space shooter — 3 ships, talent tree, boss waves' },
    { id: 'gilded-cage', name: 'The Gilded Cage', icon: Sword, color: 'gold', desc: 'Steampunk RPG adventure — heist the Governor\'s tower' },
    { id: 'atomic-steamworld', name: 'Atomic Steamworld', icon: Sword, color: 'orange', desc: 'Run, survive and kill monsters' },
    { id: 'chess', name: 'Chess', icon: Crown, color: 'emerald', desc: 'Full chess with castling, en passant & promotion' },
    { id: 'checkers', name: 'Checkers', icon: Gamepad2, color: 'amber', desc: 'Classic checkers with forced jumps & kings' },
    { id: 'tictactoe', name: 'Tic Tac Toe', icon: Brain, color: 'purple', desc: 'Minimax AI with 4 difficulty levels' },
  ];
  const colorMap = {
    cyan: 'from-cyan-600 to-blue-600',
    gold: 'from-yellow-600 to-amber-700',
    orange: 'from-orange-600 to-red-700',
    emerald: 'from-emerald-600 to-teal-600',
    amber: 'from-amber-600 to-orange-600',
    purple: 'from-purple-600 to-pink-600',
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 gap-4 overflow-y-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2 mb-1">
          <Gamepad2 className="w-7 h-7 text-cyan-400" /> Games Arena
        </h1>
        <p className="text-slate-400 text-sm">Choose your game</p>
      </div>
      <div className="grid gap-3 w-full max-w-sm">
        {games.map(g => (
          <button key={g.id} onClick={() => onSelect(g.id)}
            className={`p-4 rounded-xl bg-gradient-to-r ${colorMap[g.color]} hover:brightness-110 transition-all flex items-center gap-4 text-left`}>
            <g.icon className="w-8 h-8 text-white/90 shrink-0" />
            <div>
              <div className="font-semibold text-white">{g.name}</div>
              <div className="text-xs text-white/70">{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TIC TAC TOE ────────────────────────────────────────────────────────────

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6],
];

function checkTTTWinner(board) {
  for (const [a,b,c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: [a,b,c] };
  }
  if (board.every(c => c !== null)) return { winner: 'draw', line: null };
  return { winner: null, line: null };
}

function minimax(board, depth, isMax, alpha, beta, ai, human) {
  const { winner } = checkTTTWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (winner === 'draw') return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) { board[i] = ai; best = Math.max(best, minimax(board, depth+1, false, alpha, beta, ai, human)); board[i] = null; alpha = Math.max(alpha, best); if (beta <= alpha) break; }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) { board[i] = human; best = Math.min(best, minimax(board, depth+1, true, alpha, beta, ai, human)); board[i] = null; beta = Math.min(beta, best); if (beta <= alpha) break; }
    }
    return best;
  }
}

function getTTTAIMove(board, diff, aiPlayer) {
  const empty = board.map((c,i) => c === null ? i : -1).filter(i => i !== -1);
  if (!empty.length) return -1;
  if (diff === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  if (diff === 'medium' && Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];
  const human = aiPlayer === 'X' ? 'O' : 'X';
  let bestMove = -1, bestScore = -Infinity;
  for (const i of empty) {
    const nb = [...board]; nb[i] = aiPlayer;
    const score = minimax(nb, 0, false, -Infinity, Infinity, aiPlayer, human) + (diff === 'hard' ? Math.random() * 0.5 - 0.25 : 0);
    if (score > bestScore) { bestScore = score; bestMove = i; }
  }
  return bestMove;
}

function TicTacToe({ onBack }) {
  const [mode, setMode] = useState('pvai');
  const [diff, setDiff] = useState('medium');
  const [sym, setSym] = useState('X');
  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState(null);
  const [over, setOver] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [thinking, setThinking] = useState(false);
  const [settings, setSettings] = useState(true);
  const ref = useRef(null);

  const aiSym = mode === 'pvai' ? (sym === 'X' ? 'O' : 'X') : null;

  useEffect(() => {
    if (over || thinking) return;
    const isAI = mode === 'aivai' || (mode === 'pvai' && current === aiSym);
    if (isAI) {
      setThinking(true);
      ref.current = setTimeout(() => {
        const mv = getTTTAIMove(board, diff, current);
        if (mv !== -1) doMove(mv);
        setThinking(false);
      }, mode === 'aivai' ? 500 : 300);
    }
    return () => clearTimeout(ref.current);
  }, [current, over, mode, aiSym, diff]);

  const doMove = useCallback((i) => {
    setBoard(prev => {
      if (prev[i] || over) return prev;
      const nb = [...prev]; nb[i] = current;
      const { winner: w, line } = checkTTTWinner(nb);
      if (w) {
        setWinner(w); setWinLine(line); setOver(true);
        setScores(s => ({ X: w === 'X' ? s.X+1 : s.X, O: w === 'O' ? s.O+1 : s.O, draws: w === 'draw' ? s.draws+1 : s.draws }));
      }
      setCurrent(c => c === 'X' ? 'O' : 'X');
      return nb;
    });
  }, [current, over]);

  const reset = () => { clearTimeout(ref.current); setThinking(false); setBoard(Array(9).fill(null)); setCurrent('X'); setWinner(null); setWinLine(null); setOver(false); };

  if (settings) return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6 overflow-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="text-center mb-6"><h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Brain className="w-7 h-7 text-purple-400" /> Tic Tac Toe</h1></div>
      <div className="max-w-md mx-auto w-full bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={mode==='pvai'} color="purple" onClick={() => setMode('pvai')}><Users className="w-4 h-4" /> vs AI</Btn>
          <Btn active={mode==='aivai'} color="purple" onClick={() => setMode('aivai')}><Bot className="w-4 h-4" /> AI vs AI</Btn>
        </div>
        {mode === 'pvai' && <><Label>Play as</Label><div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={sym==='X'} color="blue" onClick={() => setSym('X')}>X</Btn>
          <Btn active={sym==='O'} color="red" onClick={() => setSym('O')}>O</Btn>
        </div></>}
        <Label>Difficulty</Label>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {['easy','medium','hard','impossible'].map(d => <Btn key={d} active={diff===d} color="purple" onClick={() => setDiff(d)} className="text-xs capitalize">{d}</Btn>)}
        </div>
        <button onClick={() => { reset(); setSettings(false); }} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 rounded-lg font-semibold text-white flex items-center justify-center gap-2"><Zap className="w-5 h-5" /> Start</button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6 overflow-auto items-center">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="flex gap-8 mb-4">{['X','draws','O'].map(k => <div key={k} className="text-center"><div className={`text-2xl font-bold ${k==='X'?'text-blue-400':k==='O'?'text-red-400':'text-slate-400'}`}>{scores[k]}</div><div className="text-xs text-slate-400">{k==='draws'?'Draws':`${k} Wins`}</div></div>)}</div>
      <div className="text-center mb-3">{over ? <div className="flex items-center gap-2 text-lg font-bold">{winner==='draw'?<span className="text-slate-400">Draw!</span>:<><Trophy className="w-5 h-5 text-yellow-400" /><span className={winner==='X'?'text-blue-400':'text-red-400'}>{winner} Wins!</span></>}</div> : <div className="flex items-center gap-2">{thinking && <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />}<span className={current==='X'?'text-blue-400':'text-red-400'}>{thinking?'AI thinking...':mode==='pvai'&&current===sym?'Your turn':`${current}'s turn`}</span></div>}</div>
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-800/50 rounded-xl mb-4">
        {board.map((cell, i) => <button key={i} onClick={() => { if (mode==='aivai'||thinking||over||(mode==='pvai'&&current!==sym)) return; doMove(i); }}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg text-3xl font-bold flex items-center justify-center transition-all ${!cell&&!over&&!thinking?'bg-slate-700/50 hover:bg-slate-600/50 cursor-pointer':'bg-slate-700/30'} ${winLine?.includes(i)?'ring-2 ring-yellow-400 bg-yellow-400/20':''} ${cell==='X'?'text-blue-400':'text-red-400'}`}>{cell}</button>)}
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> New Game</button>
        <button onClick={() => { reset(); setScores({X:0,O:0,draws:0}); setSettings(true); }} className="px-5 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-sm">Settings</button>
      </div>
    </div>
  );
}

// ─── CHECKERS ───────────────────────────────────────────────────────────────

function createCheckersBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r+c)%2===1) b[r][c] = 'black';
  for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r+c)%2===1) b[r][c] = 'red';
  return b;
}

const cColor = p => !p ? null : p.startsWith('red') ? 'red' : 'black';
const cKing = p => p?.endsWith('-king') || false;

function getCheckerMoves(board, row, col) {
  const piece = board[row][col]; if (!piece) return [];
  const color = cColor(piece), king = cKing(piece), moves = [], jumps = [];
  const dirs = [];
  if (color === 'red' || king) dirs.push([-1,-1],[-1,1]);
  if (color === 'black' || king) dirs.push([1,-1],[1,1]);
  for (const [dr,dc] of dirs) {
    const nr = row+dr, nc = col+dc;
    if (nr>=0&&nr<8&&nc>=0&&nc<8) {
      if (!board[nr][nc]) moves.push({ from:{row,col}, to:{row:nr,col:nc}, captures:[], isJump:false });
      else if (cColor(board[nr][nc]) !== color) {
        const jr = nr+dr, jc = nc+dc;
        if (jr>=0&&jr<8&&jc>=0&&jc<8&&!board[jr][jc]) jumps.push({ from:{row,col}, to:{row:jr,col:jc}, captures:[{row:nr,col:nc}], isJump:true });
      }
    }
  }
  return jumps.length > 0 ? jumps : moves;
}

function allCheckerMoves(board, player) {
  const moves = [], jumps = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (cColor(board[r][c])===player) {
    for (const m of getCheckerMoves(board, r, c)) { if (m.isJump) jumps.push(m); else moves.push(m); }
  }
  return jumps.length > 0 ? jumps : moves;
}

function applyCheckerMove(board, move) {
  const nb = board.map(r => [...r]);
  let piece = nb[move.from.row][move.from.col];
  nb[move.from.row][move.from.col] = null;
  for (const cap of move.captures) nb[cap.row][cap.col] = null;
  if (piece === 'red' && move.to.row === 0) piece = 'red-king';
  if (piece === 'black' && move.to.row === 7) piece = 'black-king';
  nb[move.to.row][move.to.col] = piece;
  return nb;
}

function evalCheckers(board, forP) {
  let s = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = board[r][c], col = cColor(p);
    if (col === forP) { s += cKing(p)?3:1; s += (col==='red'?(7-r):r)*0.1; }
    else if (col) { s -= cKing(p)?3:1; s -= (col==='red'?(7-r):r)*0.1; }
  }
  return s;
}

function getCheckersAI(board, player, diff) {
  const moves = allCheckerMoves(board, player);
  if (!moves.length) return null;
  if (diff === 'easy') return moves[Math.floor(Math.random()*moves.length)];
  const evaled = moves.map(m => ({ move: m, score: evalCheckers(applyCheckerMove(board, m), player) }));
  evaled.sort((a,b) => b.score - a.score);
  if (diff === 'medium') { const top = evaled.slice(0, Math.min(3, evaled.length)); return top[Math.floor(Math.random()*top.length)].move; }
  return evaled[0].move;
}

function countCheckers(board) {
  let red=0, black=0;
  for (const row of board) for (const p of row) { if (p?.startsWith('red')) red++; if (p?.startsWith('black')) black++; }
  return { red, black };
}

function Checkers({ onBack }) {
  const [mode, setMode] = useState('pvai');
  const [diff, setDiff] = useState('medium');
  const [playerColor, setPlayerColor] = useState('red');
  const [board, setBoard] = useState(createCheckersBoard);
  const [current, setCurrent] = useState('black');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [mustJump, setMustJump] = useState(false);
  const [winner, setWinner] = useState(null);
  const [over, setOver] = useState(false);
  const [scores, setScores] = useState({ red:0, black:0 });
  const [thinking, setThinking] = useState(false);
  const [settings, setSettings] = useState(true);
  const ref = useRef(null);

  const aiColor = mode === 'pvai' ? (playerColor === 'red' ? 'black' : 'red') : null;
  const counts = countCheckers(board);

  useEffect(() => {
    if (over || thinking) return;
    const isAI = mode === 'aivai' || (mode === 'pvai' && current === aiColor);
    if (isAI) {
      setThinking(true);
      ref.current = setTimeout(() => {
        const mv = getCheckersAI(board, current, diff);
        if (mv) execCheckerMove(mv);
        setThinking(false);
      }, mode === 'aivai' ? 800 : 500);
    }
    return () => clearTimeout(ref.current);
  }, [current, over, mode, aiColor, diff, mustJump]);

  const execCheckerMove = useCallback((move) => {
    const nb = applyCheckerMove(board, move);
    const c = countCheckers(nb);
    let next = current === 'red' ? 'black' : 'red';
    let extraJumps = [];
    if (move.isJump) {
      extraJumps = getCheckerMoves(nb, move.to.row, move.to.col).filter(m => m.isJump);
      if (extraJumps.length) next = current;
    }
    let w = null, go = false;
    if (c.red === 0) { w = 'black'; go = true; }
    else if (c.black === 0) { w = 'red'; go = true; }
    else if (!allCheckerMoves(nb, next).length) { w = current; go = true; }

    setBoard(nb); setCurrent(next); setWinner(w); setOver(go);
    setMustJump(extraJumps.length > 0);
    setSelected(extraJumps.length > 0 ? move.to : null);
    setValidMoves(extraJumps);
    if (go) setScores(s => ({ red: w==='red'?s.red+1:s.red, black: w==='black'?s.black+1:s.black }));
  }, [board, current]);

  const handleClick = (r, c) => {
    if (mode==='aivai'||thinking||over) return;
    if (mode==='pvai'&&current!==playerColor) return;
    if (mustJump) { const jm = validMoves.find(m => m.to.row===r&&m.to.col===c); if (jm) execCheckerMove(jm); return; }
    if (cColor(board[r][c]) === current) {
      const pm = allCheckerMoves(board, current).filter(m => m.from.row===r&&m.from.col===c);
      if (pm.length) { setSelected({row:r,col:c}); setValidMoves(pm); }
      return;
    }
    if (selected) { const mv = validMoves.find(m => m.to.row===r&&m.to.col===c); if (mv) execCheckerMove(mv); }
  };

  const reset = () => { clearTimeout(ref.current); setThinking(false); setBoard(createCheckersBoard()); setCurrent('black'); setSelected(null); setValidMoves([]); setMustJump(false); setWinner(null); setOver(false); };

  if (settings) return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-amber-900/10 to-slate-900 p-6 overflow-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="text-center mb-6"><h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Crown className="w-7 h-7 text-amber-400" /> Checkers</h1></div>
      <div className="max-w-md mx-auto w-full bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={mode==='pvai'} color="amber" onClick={() => setMode('pvai')}><Users className="w-4 h-4" /> vs AI</Btn>
          <Btn active={mode==='aivai'} color="amber" onClick={() => setMode('aivai')}><Bot className="w-4 h-4" /> AI vs AI</Btn>
        </div>
        {mode==='pvai'&&<><Label>Play as</Label><div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={playerColor==='red'} color="red" onClick={() => setPlayerColor('red')}><div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-300" /> Red</Btn>
          <Btn active={playerColor==='black'} color="slate" onClick={() => setPlayerColor('black')}><div className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-500" /> Black</Btn>
        </div></>}
        <Label>Difficulty</Label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {['easy','medium','hard'].map(d => <Btn key={d} active={diff===d} color="amber" onClick={() => setDiff(d)} className="text-xs capitalize">{d}</Btn>)}
        </div>
        <button onClick={() => { reset(); setSettings(false); }} className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 rounded-lg font-semibold text-white flex items-center justify-center gap-2"><Zap className="w-5 h-5" /> Start</button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-amber-900/10 to-slate-900 p-4 overflow-auto items-center">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="flex justify-between items-center mb-3 w-full max-w-sm px-2">
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-300" /><span className="text-white font-bold">{counts.red}</span><span className="text-xs text-slate-400">({scores.red}W)</span></div>
        <div className="text-center">{over?<div className="flex items-center gap-2 font-bold"><Trophy className="w-5 h-5 text-yellow-400" /><span className={winner==='red'?'text-red-400':'text-slate-300'}>{winner} Wins!</span></div>:<div className="flex items-center gap-2 text-sm">{thinking&&<Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}<span className={current==='red'?'text-red-400':'text-slate-300'}>{thinking?'AI thinking...':`${current}'s turn`}</span></div>}</div>
        <div className="flex items-center gap-2"><span className="text-xs text-slate-400">({scores.black}W)</span><span className="text-white font-bold">{counts.black}</span><div className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-500" /></div>
      </div>
      <div className="p-1.5 bg-amber-900/40 rounded-lg shadow-2xl mb-3">
        <div className="grid grid-cols-8 gap-0">
          {board.map((row, ri) => row.map((cell, ci) => {
            const dark = (ri+ci)%2===1;
            const isSel = selected?.row===ri&&selected?.col===ci;
            const isTarget = validMoves.some(m => m.to.row===ri&&m.to.col===ci);
            return (
              <button key={`${ri}-${ci}`} onClick={() => handleClick(ri, ci)}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center transition-all relative ${dark?'bg-amber-800':'bg-amber-100'} ${isSel?'ring-2 ring-yellow-400':''} ${isTarget?'ring-2 ring-green-400':''}`}>
                {cell && <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center shadow-lg ${cell.startsWith('red')?'bg-gradient-to-br from-red-400 to-red-600 border-red-300':'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500'}`}>
                  {cKing(cell) && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                </div>}
                {isTarget && !cell && <div className="absolute w-3 h-3 rounded-full bg-green-400/50" />}
              </button>
            );
          }))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> New Game</button>
        <button onClick={() => { reset(); setScores({red:0,black:0}); setSettings(true); }} className="px-5 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-sm">Settings</button>
      </div>
    </div>
  );
}

// ─── CHESS ───────────────────────────────────────────────────────────────────

const PIECE_SYM = { king:{white:'♔',black:'♚'}, queen:{white:'♕',black:'♛'}, rook:{white:'♖',black:'♜'}, bishop:{white:'♗',black:'♝'}, knight:{white:'♘',black:'♞'}, pawn:{white:'♙',black:'♟'} };
const PIECE_VAL = { pawn:1, knight:3, bishop:3, rook:5, queen:9, king:100 };

function createChessBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
  for (let c=0;c<8;c++) { b[0][c]={type:back[c],color:'black'}; b[1][c]={type:'pawn',color:'black'}; b[7][c]={type:back[c],color:'white'}; b[6][c]={type:'pawn',color:'white'}; }
  return b;
}

const inBounds = (r,c) => r>=0&&r<8&&c>=0&&c<8;
const findKing = (b,col) => { for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(b[r][c]?.type==='king'&&b[r][c].color===col) return {row:r,col:c}; return null; };

function isAttacked(b,row,col,by) {
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) { const p=b[r][c]; if(p&&p.color===by) { if(getRawMoves(b,r,c,p,null,true).some(m=>m.row===row&&m.col===col)) return true; } } return false;
}

function getRawMoves(b,row,col,piece,last,skipCastle=false) {
  const moves=[], {type,color}=piece, dir=color==='white'?-1:1;
  const add=(r,c)=>{ if(inBounds(r,c)){ const t=b[r][c]; if(!t||t.color!==color) moves.push({row:r,col:c}); } };
  const slide=(dirs)=>{ for(const[dr,dc] of dirs) for(let i=1;i<8;i++){ const r=row+dr*i,c=col+dc*i; if(!inBounds(r,c))break; const t=b[r][c]; if(!t) moves.push({row:r,col:c}); else { if(t.color!==color) moves.push({row:r,col:c}); break; } } };
  switch(type){
    case 'pawn':
      if(!b[row+dir]?.[col]){ moves.push({row:row+dir,col}); if(!piece.hasMoved&&!b[row+2*dir]?.[col]) moves.push({row:row+2*dir,col}); }
      for(const dc of[-1,1]){ if(inBounds(row+dir,col+dc)){ const t=b[row+dir][col+dc]; if(t&&t.color!==color) moves.push({row:row+dir,col:col+dc}); if(last?.piece.type==='pawn'&&Math.abs(last.from.row-last.to.row)===2&&last.to.row===row&&last.to.col===col+dc) moves.push({row:row+dir,col:col+dc}); } } break;
    case 'knight': for(const[dr,dc] of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(row+dr,col+dc); break;
    case 'bishop': slide([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
    case 'rook': slide([[-1,0],[1,0],[0,-1],[0,1]]); break;
    case 'queen': slide([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]); break;
    case 'king':
      for(const[dr,dc] of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(row+dr,col+dc);
      if(!skipCastle&&!piece.hasMoved){ const opp=color==='white'?'black':'white', br=color==='white'?7:0;
        const kr=b[br][7]; if(kr?.type==='rook'&&!kr.hasMoved&&!b[br][5]&&!b[br][6]&&!isAttacked(b,br,4,opp)&&!isAttacked(b,br,5,opp)&&!isAttacked(b,br,6,opp)) moves.push({row:br,col:6});
        const qr=b[br][0]; if(qr?.type==='rook'&&!qr.hasMoved&&!b[br][1]&&!b[br][2]&&!b[br][3]&&!isAttacked(b,br,2,opp)&&!isAttacked(b,br,3,opp)&&!isAttacked(b,br,4,opp)) moves.push({row:br,col:2});
      } break;
  }
  return moves;
}

function getValidChessMoves(b,row,col,last) {
  const piece=b[row][col]; if(!piece) return [];
  const raw=getRawMoves(b,row,col,piece,last), valid=[], opp=piece.color==='white'?'black':'white';
  for(const m of raw) {
    const nb=b.map(r=>[...r]); nb[m.row][m.col]={...piece,hasMoved:true}; nb[row][col]=null;
    if(piece.type==='king'&&Math.abs(m.col-col)===2){ if(m.col===6){nb[row][5]=nb[row][7];nb[row][7]=null;}else{nb[row][3]=nb[row][0];nb[row][0]=null;} }
    const kp=findKing(nb,piece.color); if(kp&&!isAttacked(nb,kp.row,kp.col,opp)) valid.push(m);
  }
  return valid;
}

function allChessMoves(b,color,last) {
  const moves=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=b[r][c]; if(p&&p.color===color) for(const to of getValidChessMoves(b,r,c,last)) moves.push({from:{row:r,col:c},to,piece:p,captured:b[to.row][to.col]||undefined}); }
  return moves;
}

function evalChess(b,forC) {
  let s=0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=b[r][c]; if(p){ const v=PIECE_VAL[p.type]+(p.type==='pawn'?(p.color==='white'?(6-r)*0.1:r*0.1):0); s+=p.color===forC?v:-v; } }
  return s;
}

function getChessAI(b,color,diff,last) {
  const moves=allChessMoves(b,color,last); if(!moves.length) return null;
  if(diff==='easy') return moves[Math.floor(Math.random()*moves.length)];
  const evaled=moves.map(m=>{ const nb=b.map(r=>[...r]); nb[m.to.row][m.to.col]={...m.piece,hasMoved:true}; nb[m.from.row][m.from.col]=null; return {move:m,score:evalChess(nb,color)+(m.captured?PIECE_VAL[m.captured.type]*2:0)}; });
  evaled.sort((a,b)=>b.score-a.score);
  if(diff==='medium'){ const top=evaled.slice(0,Math.min(5,evaled.length)); return top[Math.floor(Math.random()*top.length)].move; }
  return evaled[0].move;
}

function Chess({ onBack }) {
  const [mode, setMode] = useState('pvai');
  const [diff, setDiff] = useState('medium');
  const [playerColor, setPlayerColor] = useState('white');
  const [board, setBoard] = useState(createChessBoard);
  const [current, setCurrent] = useState('white');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [winner, setWinner] = useState(null);
  const [over, setOver] = useState(false);
  const [check, setCheck] = useState(false);
  const [scores, setScores] = useState({ white:0, black:0, draws:0 });
  const [thinking, setThinking] = useState(false);
  const [settings, setSettings] = useState(true);
  const [promo, setPromo] = useState(null);
  const ref = useRef(null);

  const aiColor = mode === 'pvai' ? (playerColor === 'white' ? 'black' : 'white') : null;

  useEffect(() => {
    if (over || thinking || promo) return;
    const isAI = mode === 'aivai' || (mode === 'pvai' && current === aiColor);
    if (isAI) {
      setThinking(true);
      ref.current = setTimeout(() => {
        const mv = getChessAI(board, current, diff, lastMove);
        if (mv) execChessMove(mv);
        setThinking(false);
      }, mode === 'aivai' ? 1000 : 600);
    }
    return () => clearTimeout(ref.current);
  }, [current, over, mode, aiColor, diff, promo]);

  const execChessMove = useCallback((move, promoteTo) => {
    const nb = board.map(r=>[...r]);
    let piece = {...move.piece, hasMoved:true};
    if(piece.type==='pawn'&&(move.to.row===0||move.to.row===7)) piece={...piece,type:promoteTo||'queen'};
    if(piece.type==='king'&&Math.abs(move.to.col-move.from.col)===2){ if(move.to.col===6){nb[move.from.row][5]={...nb[move.from.row][7],hasMoved:true};nb[move.from.row][7]=null;}else{nb[move.from.row][3]={...nb[move.from.row][0],hasMoved:true};nb[move.from.row][0]=null;} }
    if(piece.type==='pawn'&&move.from.col!==move.to.col&&!board[move.to.row][move.to.col]) nb[move.from.row][move.to.col]=null;
    nb[move.to.row][move.to.col]=piece; nb[move.from.row][move.from.col]=null;
    const next=current==='white'?'black':'white';
    const kp=findKing(nb,next), isChk=kp?isAttacked(nb,kp.row,kp.col,current):false;
    const nextMoves=allChessMoves(nb,next,move);
    let w=null, go=false;
    if(!nextMoves.length){ go=true; w=isChk?current:'draw'; }
    setBoard(nb); setCurrent(next); setSelected(null); setValidMoves([]); setLastMove(move); setWinner(w); setOver(go); setCheck(isChk); setPromo(null);
    if(go) setScores(s=>({white:w==='white'?s.white+1:s.white,black:w==='black'?s.black+1:s.black,draws:w==='draw'?s.draws+1:s.draws}));
  }, [board, current]);

  const handleClick = (r, c) => {
    if(mode==='aivai'||thinking||over||promo) return;
    if(mode==='pvai'&&current!==playerColor) return;
    const clicked=board[r][c];
    if(clicked&&clicked.color===current){ setSelected({row:r,col:c}); setValidMoves(getValidChessMoves(board,r,c,lastMove)); return; }
    if(selected){
      if(validMoves.some(m=>m.row===r&&m.col===c)){
        const piece=board[selected.row][selected.col];
        if(piece.type==='pawn'&&(r===0||r===7)){ setPromo({row:r,col:c}); return; }
        execChessMove({from:selected,to:{row:r,col:c},piece,captured:board[r][c]||undefined});
      }
    }
  };

  const handlePromo = (type) => { if(!promo||!selected) return; const piece=board[selected.row][selected.col]; execChessMove({from:selected,to:promo,piece,captured:board[promo.row][promo.col]||undefined,isPromotion:true},type); };

  const reset = () => { clearTimeout(ref.current); setThinking(false); setPromo(null); setBoard(createChessBoard()); setCurrent('white'); setSelected(null); setValidMoves([]); setLastMove(null); setWinner(null); setOver(false); setCheck(false); };

  if (settings) return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900 p-6 overflow-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="text-center mb-6"><h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Crown className="w-7 h-7 text-emerald-400" /> Chess</h1></div>
      <div className="max-w-md mx-auto w-full bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={mode==='pvai'} color="emerald" onClick={() => setMode('pvai')}><Users className="w-4 h-4" /> vs AI</Btn>
          <Btn active={mode==='aivai'} color="emerald" onClick={() => setMode('aivai')}><Bot className="w-4 h-4" /> AI vs AI</Btn>
        </div>
        {mode==='pvai'&&<><Label>Play as</Label><div className="grid grid-cols-2 gap-2 mb-4">
          <Btn active={playerColor==='white'} color="white" onClick={() => setPlayerColor('white')}><span className="text-xl">♔</span> White</Btn>
          <Btn active={playerColor==='black'} color="slate" onClick={() => setPlayerColor('black')}><span className="text-xl">♚</span> Black</Btn>
        </div></>}
        <Label>Difficulty</Label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {['easy','medium','hard'].map(d => <Btn key={d} active={diff===d} color="emerald" onClick={() => setDiff(d)} className="text-xs capitalize">{d}</Btn>)}
        </div>
        <button onClick={() => { reset(); setSettings(false); }} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 rounded-lg font-semibold text-white flex items-center justify-center gap-2"><Zap className="w-5 h-5" /> Start</button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900 p-4 overflow-auto items-center">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 self-start"><ChevronLeft className="w-4 h-4" /> Back</button>
      <div className="flex justify-between items-center mb-3 w-full max-w-sm">
        <div className="text-sm"><span className="text-slate-400">W: </span><span className="text-white font-bold">{scores.white}</span></div>
        <div className="text-center">{over?<div className="flex items-center gap-2 font-bold"><Trophy className="w-5 h-5 text-yellow-400" /><span className="text-white">{winner==='draw'?'Stalemate!':`${winner} Wins!`}</span></div>:<div className="flex items-center gap-2 text-sm">{thinking&&<Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />}{check&&<span className="text-red-400 font-bold">Check! </span>}<span className="text-white">{thinking?'AI thinking...':`${current}'s turn`}</span></div>}</div>
        <div className="text-sm"><span className="text-slate-400">B: </span><span className="text-white font-bold">{scores.black}</span></div>
      </div>
      <div className="p-1.5 bg-slate-800 rounded-lg shadow-2xl mb-3">
        <div className="grid grid-cols-8 gap-0">
          {board.map((row,ri) => row.map((piece,ci) => {
            const dark=(ri+ci)%2===1, isSel=selected?.row===ri&&selected?.col===ci, isValid=validMoves.some(m=>m.row===ri&&m.col===ci);
            const isLast=lastMove&&((lastMove.from.row===ri&&lastMove.from.col===ci)||(lastMove.to.row===ri&&lastMove.to.col===ci));
            return (
              <button key={`${ri}-${ci}`} onClick={() => handleClick(ri,ci)}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-2xl sm:text-3xl transition-all relative ${dark?'bg-emerald-800':'bg-emerald-200'} ${isSel?'ring-2 ring-yellow-400 ring-inset':''} ${isLast?'bg-yellow-500/30':''}`}>
                {piece && <span className={piece.color==='white'?'text-white drop-shadow-lg':'text-slate-900'}>{PIECE_SYM[piece.type][piece.color]}</span>}
                {isValid && (piece ? <div className="absolute inset-0 ring-2 ring-red-400 ring-inset opacity-70" /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />)}
              </button>
            );
          }))}
        </div>
      </div>
      {promo && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-800 rounded-xl p-4 shadow-2xl"><p className="text-white mb-3 text-center text-sm">Promote to:</p>
          <div className="flex gap-2">{['queen','rook','bishop','knight'].map(t => <button key={t} onClick={() => handlePromo(t)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-3xl flex items-center justify-center">{PIECE_SYM[t][current==='white'?'black':'white']}</button>)}</div>
        </div>
      </div>}
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> New Game</button>
        <button onClick={() => { reset(); setScores({white:0,black:0,draws:0}); setSettings(true); }} className="px-5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg text-sm">Settings</button>
      </div>
    </div>
  );
}

// ─── Shared UI atoms ────────────────────────────────────────────────────────

function Label({ children }) {
  return <label className="text-sm text-slate-400 mb-2 block">{children}</label>;
}

const colorClasses = {
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  blue: 'bg-blue-600 text-white',
  red: 'bg-red-600 text-white',
  white: 'bg-slate-200 text-slate-900',
  slate: 'bg-slate-600 text-white',
};

function Btn({ active, color, onClick, children, className = '' }) {
  return (
    <button onClick={onClick}
      className={`p-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${active ? colorClasses[color] : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'} ${className}`}>
      {children}
    </button>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function GamesArenaWindow() {
  const [game, setGame] = useState(null);

  if (game === 'nova-strike') return <IframeGame src="/games/nova-strike.html" title="Nova Strike" onBack={() => setGame(null)} />;
  if (game === 'atomic-steamworld') return <IframeGame src="https://atomic-steamworld.replit.app" title="Atomic Steamworld" onBack={() => setGame(null)} />;
  if (game === 'gilded-cage') return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
        <button onClick={() => setGame(null)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Arena
        </button>
        <span className="text-slate-500 text-sm ml-2">The Gilded Cage</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <GildedCageGame />
      </div>
    </div>
  );
  if (game === 'chess') return <Chess onBack={() => setGame(null)} />;
  if (game === 'checkers') return <Checkers onBack={() => setGame(null)} />;
  if (game === 'tictactoe') return <TicTacToe onBack={() => setGame(null)} />;

  return <GameSelector onSelect={setGame} />;
}
