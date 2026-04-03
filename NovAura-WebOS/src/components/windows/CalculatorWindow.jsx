import React, { useState, useCallback, useEffect } from 'react';
import { Delete, RotateCcw, Plus, Minus, X, Divide, Equal, Percent, History } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

function evaluate(expression) {
  try {
    // Sanitize — only allow numbers, operators, parens, decimal
    const sanitized = expression.replace(/[^0-9+\-*/.()%]/g, '');
    if (!sanitized) return '';
    // Replace % with /100
    const processed = sanitized.replace(/(\d+)%/g, '($1/100)');
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + processed)();
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    // Clean up floating point
    return parseFloat(result.toPrecision(12)).toString();
  } catch {
    return 'Error';
  }
}

const BUTTONS = [
  ['C', '()', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', 'DEL', '='],
];

const OP_ICONS = { '/': Divide, '*': X, '-': Minus, '+': Plus, '=': Equal, '%': Percent, 'DEL': Delete };

export default function CalculatorWindow() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('novaura_calc_history') || '[]'); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [parenDepth, setParenDepth] = useState(0);

  const saveHistory = useCallback((expr, res) => {
    const entry = { expression: expr, result: res, timestamp: Date.now() };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 50);
      kernelStorage.setItem('novaura_calc_history', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleButton = useCallback((btn) => {
    if (btn === 'C') {
      setDisplay('0');
      setExpression('');
      setResult('');
      setParenDepth(0);
      return;
    }

    if (btn === 'DEL') {
      if (display.length <= 1 || display === 'Error') {
        setDisplay('0');
        setExpression('');
      } else {
        const removed = display.slice(-1);
        if (removed === '(') setParenDepth(d => d - 1);
        if (removed === ')') setParenDepth(d => d + 1);
        const newDisplay = display.slice(0, -1);
        setDisplay(newDisplay);
        setExpression(newDisplay);
      }
      setResult('');
      return;
    }

    if (btn === '=') {
      if (!expression && !display) return;
      const expr = expression || display;
      const res = evaluate(expr);
      setResult(res);
      setDisplay(res);
      setExpression('');
      if (res !== 'Error') saveHistory(expr, res);
      return;
    }

    if (btn === '()') {
      if (parenDepth > 0) {
        const last = display.slice(-1);
        if (last && !isNaN(last) || last === ')') {
          setDisplay(d => d + ')');
          setExpression(expr => (expr || display) + ')');
          setParenDepth(d => d - 1);
          return;
        }
      }
      const newDisplay = display === '0' ? '(' : display + '(';
      setDisplay(newDisplay);
      setExpression(newDisplay);
      setParenDepth(d => d + 1);
      return;
    }

    // Number or operator
    const isOp = ['+', '-', '*', '/', '%'].includes(btn);

    if (result && !isOp) {
      // Start new expression after result
      setDisplay(btn);
      setExpression(btn);
      setResult('');
      return;
    }

    if (result && isOp) {
      // Continue from result
      setDisplay(result + btn);
      setExpression(result + btn);
      setResult('');
      return;
    }

    if (display === '0' && !isOp && btn !== '.') {
      setDisplay(btn);
      setExpression(btn);
    } else {
      const newDisplay = display + btn;
      setDisplay(newDisplay);
      setExpression(newDisplay);
    }

    // Live preview
    if (!isOp) {
      const preview = evaluate((expression || display) + btn);
      if (preview && preview !== 'Error') setResult(preview);
    }
  }, [display, expression, result, parenDepth, saveHistory]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleButton(e.key);
      else if (e.key === '+' || e.key === '-' || e.key === '/' || e.key === '%') handleButton(e.key);
      else if (e.key === '*' || e.key === 'x' || e.key === 'X') handleButton('*');
      else if (e.key === '.') handleButton('.');
      else if (e.key === 'Enter' || e.key === '=') handleButton('=');
      else if (e.key === 'Backspace') handleButton('DEL');
      else if (e.key === 'Escape') handleButton('C');
      else if (e.key === '(' || e.key === ')') handleButton('()');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleButton]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Display */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Calculator</span>
          <button onClick={() => setShowHistory(!showHistory)} className={`p-1 rounded ${showHistory ? 'text-primary' : 'text-gray-600 hover:text-gray-400'}`}>
            <History className="w-4 h-4" />
          </button>
        </div>

        {showHistory ? (
          <div className="h-40 overflow-auto scrollbar-thin space-y-1">
            {history.length === 0 ? (
              <p className="text-xs text-gray-600 text-center mt-8">No history yet</p>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setDisplay(h.result); setExpression(''); setResult(''); setShowHistory(false); }}
                  className="w-full text-right px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <p className="text-[10px] text-gray-500">{h.expression}</p>
                  <p className="text-sm text-gray-200 font-medium">= {h.result}</p>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="text-right min-h-[80px] flex flex-col justify-end">
            {expression && (
              <p className="text-sm text-gray-500 truncate mb-0.5">{expression}</p>
            )}
            <p className={`font-bold truncate transition-all ${
              display.length > 12 ? 'text-2xl' : display.length > 8 ? 'text-3xl' : 'text-4xl'
            } ${result && !expression ? 'text-primary' : 'text-gray-100'}`}>
              {display}
            </p>
            {result && expression && (
              <p className="text-sm text-gray-500 mt-0.5">= {result}</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />

      {/* Buttons */}
      <div className="flex-1 p-3 grid grid-rows-5 gap-2">
        {BUTTONS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-2">
            {row.map((btn) => {
              const isOp = ['/', '*', '-', '+', '='].includes(btn);
              const isSpecial = ['C', '()', '%', 'DEL'].includes(btn);
              const IconComp = OP_ICONS[btn];

              return (
                <button
                  key={btn}
                  onClick={() => handleButton(btn)}
                  className={`
                    rounded-xl font-semibold transition-all active:scale-95
                    flex items-center justify-center
                    ${btn === '=' ? 'bg-primary text-white hover:bg-primary/80' :
                      isOp ? 'bg-primary/15 text-primary hover:bg-primary/25' :
                      isSpecial ? 'bg-white/[0.07] text-gray-300 hover:bg-white/[0.12]' :
                      'bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]'}
                    ${btn === '0' ? '' : ''}
                    text-lg
                  `}
                >
                  {IconComp ? <IconComp className="w-5 h-5" /> : btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
