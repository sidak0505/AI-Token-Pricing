const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function classifyTask(prompt) {
  const p = prompt.toLowerCase();
  if (/\b(code|build|make|create|develop|implement|website|app|api|backend|frontend|react|node|python|java|bug|debug|deploy)\b/.test(p)) return 'Coding';
  if (/\b(research|compare|analy[sz]e|investigate|find out|literature|sources)\b/.test(p)) return 'Research';
  if (/\b(email|letter|essay|article|blog|rewrite|write)\b/.test(p)) return 'Writing';
  if (/\b(data|csv|excel|sql|dashboard|statistics|analy[sz]is)\b/.test(p)) return 'Data';
  return 'General';
}

export function heuristicPlan(prompt, mode='normal') {
  const type = classifyTask(prompt);
  const chars = prompt.length;
  const complexityScore = clamp(
    1 + Math.floor(chars / 220) +
    (prompt.match(/\b(and|with|also|including|integrate|authentication|database|payment|deployment|research|test|debug)\b/gi) || []).length * 0.5,
    1, 10
  );
  const complexity = complexityScore <= 3 ? 'Low' : complexityScore <= 6 ? 'Medium' : 'High';
  const multiplier = mode === 'quick' ? 0.48 : mode === 'deep' ? 1.55 : 1;
  const coding = type === 'Coding';
  const research = /research|latest|current|sources|compare|documentation|pricing|look up/i.test(prompt) ? 'High' : /app|website|code|build|develop/i.test(prompt) ? 'Low' : 'Medium';
  const base = coding ? 9000 : type === 'Research' ? 6500 : type === 'Data' ? 7000 : 4200;
  const scale = 0.7 + complexityScore * 0.15;
  const totalMid = base * scale * multiplier;

  const names = coding
    ? ['Requirement analysis','Architecture / planning','Code generation','Context / file reading','Testing & tool output','Debugging / iteration','Final response']
    : ['Requirement analysis','Research / planning','Context gathering','Generation / analysis','Verification / iteration','Final response'];

  const ratios = coding ? [0.07,0.11,0.30,0.14,0.12,0.19,0.07] : [0.10,0.24,0.20,0.26,0.13,0.07];
  const variance = mode === 'deep' ? 0.38 : mode === 'quick' ? 0.25 : 0.30;
  const breakdown = names.map((name, i) => {
    const mid = totalMid * ratios[i];
    return { name, min: Math.round(mid * (1-variance)), max: Math.round(mid * (1+variance)) };
  });
  const callsBase = coding ? complexityScore + 2 : 3 + Math.round(complexityScore/2);
  return {
    taskType: type,
    complexity,
    research,
    modelCalls: { min: Math.max(1, Math.round(callsBase * multiplier * .8)), max: Math.max(2, Math.round(callsBase * multiplier * 1.45)) },
    toolCalls: { min: coding ? Math.round(1*multiplier) : 0, max: Math.max(1, Math.round((coding ? complexityScore : 3) * multiplier)) },
    confidence: 'Low',
    assumptions: coding
      ? ['AI coding agent', `${3 + Math.min(8, Math.round(complexityScore))} estimated work units`, mode === 'deep' ? 'research/tool use enabled' : 'basic tool use', 'possible debugging iterations']
      : ['single AI agent', 'moderate context', mode === 'deep' ? 'research/tool use enabled' : 'limited tool use', 'iteration allowance included'],
    breakdown
  };
}
