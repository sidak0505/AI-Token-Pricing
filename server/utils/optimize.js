// Rule-based prompt optimizer. Free, offline, deterministic.
// It only removes/shortens wording that does not change what the model is asked to do,
// and never touches fenced code blocks (```...```).

const MARK = '\u0001'; // "a sentence start was consumed - capitalise whatever comes next"
const SENT_START = /(^|[.!?]["')\]]*\s+|\n[ \t]*(?:[-*\u2022]|\d+[.)])?[ \t]*)$/;

const REQUEST_VERBS = 'write|create|build|make|explain|summari[sz]e|generate|give|list|help|show|tell|fix|review|translate|draft|design|describe|find|analy[sz]e|convert|rewrite|produce|provide|compare|calculate|check|debug|implement|add|remove|update';

const sub = (p, r, why) => ({ p, r, why });
const RULES = [
  sub(/^\s*(?:hi|hello|hey)(?: there)?[,!.]?[ \t]+/i, '', 'Greetings cost tokens but do not change the task.'),
  sub(/\bi(?: would|'d| want| need)(?: like)? you to\b[ \t]*/gi, '', 'Say the instruction directly - "I would like you to write X" is just "Write X".'),
  sub(new RegExp(`\\b(?:can|could|would|will) you (?:please |kindly )?((?:${REQUEST_VERBS})\\b[^.!?\\n]*)\\?`, 'gi'),
      (m, rest) => rest.trim() + '.', 'A polite question ("Can you write...?") is the same request as an instruction ("Write...").'),
  sub(/\b(?:please note that|please be advised that|it(?:'s| is) important to note that|it should be noted that)\b[ \t]*,?[ \t]*/gi, '', 'Lead-in filler - state the thing directly.'),
  sub(/\b(?:please|kindly)\b[ \t]*,?[ \t]*/gi, '', 'Politeness words cost tokens and do not change what the model does.'),
  sub(/\bdue to the fact that\b/gi, 'because', '"Due to the fact that" -> "because".'),
  sub(/\b(?:despite|in spite of|regardless of) the fact that\b/gi, 'although', '"Despite the fact that" -> "although".'),
  sub(/\bin the event that\b/gi, 'if', '"In the event that" -> "if".'),
  sub(/\bin order to\b/gi, 'to', '"In order to" -> "to" - identical meaning.'),
  sub(/\bin order for\b/gi, 'for', '"In order for" -> "for".'),
  sub(/\bat (?:this point in time|the present time)\b/gi, 'now', '"At this point in time" -> "now".'),
  sub(/\b(?:with regard to|with respect to|in regard to)\b/gi, 'about', '"With regard to" -> "about".'),
  sub(/\ba large number of\b/gi, 'many', '"A large number of" -> "many".'),
  sub(/\bprior to\b/gi, 'before', '"Prior to" -> "before".'),
  sub(/\bsubsequent to\b/gi, 'after', '"Subsequent to" -> "after".'),
  sub(/\bin the near future\b/gi, 'soon', '"In the near future" -> "soon".'),
  sub(/\bin a timely manner\b/gi, 'promptly', '"In a timely manner" -> "promptly".'),
  sub(/\bon a (daily|weekly|monthly) basis\b/gi, (m, w) => w.toLowerCase(), '"On a daily basis" -> "daily".'),
  sub(/\bon a regular basis\b/gi, 'regularly', '"On a regular basis" -> "regularly".'),
  sub(/\beach and every\b/gi, 'each', '"Each and every" -> "each".'),
  sub(/\bfirst and foremost\b/gi, 'first', '"First and foremost" -> "first".'),
  sub(/\bmake use of\b/gi, 'use', '"Make use of" -> "use".'),
  sub(/\butili[sz]ing\b/gi, 'using', '"Utilizing" -> "using".'),
  sub(/\butili[sz]e\b/gi, 'use', '"Utilize" -> "use".'),
  sub(/\b(?:is|are) able to\b/gi, 'can', '"Is able to" -> "can".'),
  sub(/\breally[ \t]+really\b/gi, 'really', 'Doubled intensifier collapsed to one.'),
  sub(/\bvery[ \t]+very\b/gi, 'very', 'Doubled intensifier collapsed to one.'),
  sub(/\b(?:basically|actually|honestly|literally|obviously)\b[ \t]*,?[ \t]*/gi, '', 'Filler adverb the model does not need.'),
  sub(/(?<!\b(?:what|which|same|this|that|any|some|every|each|a|another|type|sort|kind)[ \t])\b(?:kind|sort) of\b[ \t]*/gi, '', 'Hedge words add tokens without adding meaning.'),
  sub(/[\s,]*\b(?:thanks|thank you)\b(?: so much| very much| a lot)?(?: in advance)?[\s.!]*$/i, '', 'Sign-off costs tokens; the model does not need thanks.')
];

function applyRule(str, rule) {
  let count = 0, example = '';
  const out = str.replace(rule.p, (...args) => {
    const i = args.findIndex(a => typeof a === 'number');
    const match = args[0], offset = args[i], whole = args[i + 1];
    count++; if (!example) example = match.trim();
    const rep = typeof rule.r === 'function' ? rule.r(match, ...args.slice(1, i)) : rule.r;
    if (!SENT_START.test(whole.slice(0, offset))) return rep;
    return rep ? rep[0].toUpperCase() + rep.slice(1) : MARK;
  });
  return { out, count, example };
}

function tidyWhitespace(s) {
  return s.replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
}

function repairPunctuation(s) {
  return s
    .replace(/(^|[.!?]["')\]]*[ \t]+|\n[ \t]*|\u0001)[ \t]*[,;:]+[ \t]*/g, '$1')
    .replace(/,[ \t]*,/g, ',')
    .replace(/,[ \t]*([.!?])/g, '$1')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/\u0001[ \t]*([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/\u0001[ \t]*/g, '');
}

/** Returns { tightened, changes: [{ reason, example, occurrences }] } */
export function optimizeRules(text) {
  const changes = [];
  const note = (reason, example, occurrences) => changes.push({ reason, example, occurrences });

  let work = text;

  // Repeated long lines (skip when the text contains code, where repeats are normal).
  if (!work.includes('```')) {
    const seen = new Set(); let dropped = 0, ex = '';
    work = work.split('\n').filter(line => {
      const k = line.trim().toLowerCase();
      if (k.length < 30) return true;
      if (seen.has(k)) { dropped++; ex = ex || line.trim().slice(0, 50) + '...'; return false; }
      seen.add(k); return true;
    }).join('\n');
    if (dropped) note('The same line appears more than once - the model only needs it once.', ex, dropped);
  }

  const totals = new Map();
  const parts = work.split(/(```[\s\S]*?```)/g).map((seg, idx) => {
    if (idx % 2 === 1) return seg; // fenced code: never touch
    let out = seg, fired = false;
    for (const rule of RULES) {
      const r = applyRule(out, rule);
      if (r.count) {
        fired = true; out = r.out;
        const t = totals.get(rule.why) || { example: r.example, n: 0 };
        t.n += r.count; totals.set(rule.why, t);
      }
    }
    out = tidyWhitespace(out);
    return fired ? repairPunctuation(out) : out;
  });
  for (const [why, t] of totals) note(why, t.example, t.n);

  return { tightened: parts.join('').trim(), changes };
}

/** Heuristic prompt-quality tips (things that waste tokens or cause extra turns). */
export function promptChecks(text, tokens) {
  const tips = [];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (!words) return tips;
  const coding = /\b(app|website|api|script|function|bug|code|build|develop|component|backend|frontend)\b/i.test(text);
  const hasStack = /\b(react|node|express|python|django|flask|java|javascript|typescript|html|css|c\+\+|c#|go|golang|rust|swift|kotlin|flutter|sql|php|vue|angular|next\.?js)\b/i.test(text);
  const hasFormat = /\b(json|table|bullets?|markdown|csv|format|code only|no explanation|words|sentences|paragraphs?|steps|yaml)\b/i.test(text);

  if (words < 8) tips.push('Very short prompt. Vague one-liners often cause extra back-and-forth turns, and every turn re-sends the whole conversation - a clearer first prompt is often cheaper overall.');
  if (coding && !hasStack) tips.push('Name the language / framework (e.g. "in React + Node") so the model does not guess and then rewrite.');
  if (!hasFormat) tips.push('Say what the answer should look like (bullets, JSON, "code only", max N words). Output tokens cost 4-6x more than input.');
  if (/step[- ]by[- ]step/i.test(text)) tips.push('"Think step by step" is usually unnecessary with modern reasoning models - they already reason first, and it can add output tokens.');
  if (tokens > 1000) tips.push('Long prompt: if you re-send the same instructions or documents many times, put the stable part first and use prompt caching (cached input is roughly 90% cheaper).');
  return tips;
}
