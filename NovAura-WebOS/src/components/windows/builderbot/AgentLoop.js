/**
 * AgentLoop — Agentic build/test/fix cycle for Cybeni IDE
 *
 * Flow:
 *   1. User sends a build prompt
 *   2. AI generates complete project files
 *   3. Files are applied to the editor and the preview iframe refreshes
 *   4. We wait `errorWaitMs` for the iframe's console bridge to report errors
 *   5. If errors found → AI gets the error list + current code and auto-fixes
 *   6. Repeat up to maxRetries times or until the preview is clean
 *
 * The agent NEVER uses mock/placeholder data unless flagged as unavoidable.
 */

// ── System prompt for agent build mode ──────────────────────────────────────
const AGENT_SYSTEM_PROMPT = `You are Cybeni, an AI that builds fully working web applications.

CRITICAL RULES — follow every single one:
1. Output COMPLETE files. Never use "..." or "rest of code unchanged" shortcuts.
2. Each file must be wrapped in a code fence with its filename as the language:
   \`\`\`index.html
   ...full file content...
   \`\`\`
3. Do NOT use mock, dummy, or placeholder data unless the user explicitly asks for it or it is technically unavoidable. Use real logic, real structure, real data.
4. The output runs inside a sandboxed iframe — use only vanilla HTML/CSS/JS unless the user specifies a framework. Do NOT use import statements, bundlers, or Node APIs unless the project context already has those.
5. Be self-contained: all styles in style.css or inline, all logic in relevant JS files.
6. Fix every error in the error report completely before responding. Do not partially fix.
7. No explanations needed — just output the files.`;

// ── Error formatter ──────────────────────────────────────────────────────────
function formatErrors(errors) {
  if (!errors.length) return '';
  return errors
    .slice(0, 20) // cap to avoid token explosion
    .map((e, i) => `[${i + 1}] ${e.level.toUpperCase()}: ${e.text}`)
    .join('\n');
}

// ── Snapshot current files for AI context ───────────────────────────────────
function snapshotFiles(flatFiles) {
  return flatFiles
    .filter((f) => f.type === 'file' && f.content)
    .map((f) => `\`\`\`${f.name}\n${f.content}\n\`\`\``)
    .join('\n\n');
}

/**
 * Run the agentic build loop.
 *
 * @param {object} opts
 * @param {string}   opts.prompt        – User's build request
 * @param {Function} opts.callAI        – async (messages: [{role, content}]) => string
 * @param {Function} opts.applyBlocks   – (blocks: [{filename, code}][]) => void
 * @param {Function} opts.triggerRun    – () => void  — bumps runKey to refresh iframe
 * @param {Function} opts.getErrors     – () => [{level, text}]  — current iframe errors
 * @param {Function} opts.clearErrors   – () => void
 * @param {Function} opts.getFlatFiles  – () => [{name, content, path}]
 * @param {Function} opts.parseBlocks   – (text: string) => [{filename, code}]
 * @param {Function} opts.onStatus      – (msg: string) => void  — live status callback
 * @param {Function} opts.onMessage     – (role: 'assistant'|'system', text: string) => void
 * @param {number}   opts.maxRetries    – max fix iterations (default 5)
 * @param {number}   opts.errorWaitMs   – ms to wait for iframe errors after refresh (default 3500)
 * @returns {Promise<{success: boolean, iterations: number}>}
 */
export async function runAgentLoop({
  prompt,
  callAI,
  applyBlocks,
  triggerRun,
  getErrors,
  clearErrors,
  getFlatFiles,
  parseBlocks,
  onStatus,
  onMessage,
  maxRetries = 5,
  errorWaitMs = 3500,
}) {
  const status = (msg) => {
    onStatus(msg);
  };

  // Conversation accumulates context across iterations so the AI knows what it already wrote
  const conversation = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
  ];

  // ── Step 1: Initial build ───────────────────────────────────────────────────
  status('🧠 Thinking...');
  conversation.push({ role: 'user', content: prompt });

  let aiResponse;
  try {
    aiResponse = await callAI(conversation);
  } catch (err) {
    onMessage('system', `❌ AI call failed: ${err.message}`);
    return { success: false, iterations: 0 };
  }

  conversation.push({ role: 'assistant', content: aiResponse });
  onMessage('assistant', aiResponse);

  // Apply initial build
  const initialBlocks = parseBlocks(aiResponse);
  if (initialBlocks.filter((b) => b.filename).length > 0) {
    status('📝 Writing files...');
    applyBlocks(initialBlocks);
    status('🔄 Launching preview...');
    triggerRun();
  } else {
    // AI didn't output any files — treat as chat response, no loop needed
    return { success: true, iterations: 0 };
  }

  // ── Step 2: Error/fix loop ──────────────────────────────────────────────────
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Wait for the iframe to fully load and report errors
    status(`⏳ Testing in preview (attempt ${attempt}/${maxRetries})...`);
    await sleep(errorWaitMs);

    const errors = getErrors();

    if (errors.length === 0) {
      status('✅ Build successful — no errors!');
      onMessage('system', `✅ **Build complete** — Preview running clean after ${attempt === 1 ? 'initial build' : `${attempt - 1} fix iteration${attempt > 2 ? 's' : ''}`}.`);
      return { success: true, iterations: attempt - 1 };
    }

    // Errors found — feed them back
    const errorSummary = formatErrors(errors);
    const currentCode = snapshotFiles(getFlatFiles());

    status(`🔧 Fixing ${errors.length} error${errors.length > 1 ? 's' : ''}...`);

    const fixPrompt = [
      `The preview iframe reported the following errors after running your code:`,
      `\`\`\``,
      errorSummary,
      `\`\`\``,
      ``,
      `Current project files:`,
      currentCode,
      ``,
      `Fix ALL errors completely. Output the full corrected files — no partial diffs, no "rest unchanged". Real data only, no placeholders.`,
    ].join('\n');

    conversation.push({ role: 'user', content: fixPrompt });

    let fixResponse;
    try {
      fixResponse = await callAI(conversation);
    } catch (err) {
      onMessage('system', `❌ AI fix call failed: ${err.message}`);
      return { success: false, iterations: attempt };
    }

    conversation.push({ role: 'assistant', content: fixResponse });
    onMessage('assistant', fixResponse);

    const fixBlocks = parseBlocks(fixResponse);
    if (fixBlocks.filter((b) => b.filename).length > 0) {
      applyBlocks(fixBlocks);
      clearErrors();
      status(`🔄 Reloading preview after fix ${attempt}...`);
      triggerRun();
    } else {
      // AI responded with explanation but no files — break to avoid infinite non-fix loop
      onMessage('system', '⚠️ AI did not output file changes in the fix. Loop stopped.');
      return { success: false, iterations: attempt };
    }
  }

  // Exhausted retries
  const remaining = getErrors();
  onMessage('system', `⚠️ Reached max retries (${maxRetries}). ${remaining.length} error(s) remain. You may continue debugging manually.`);
  return { success: false, iterations: maxRetries };
}

// ── Utility ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
