const fs = require('fs');
let file = 'src/lib/domain-data.ts';
let content = fs.readFileSync(file, 'utf8');

// I need to modify transformDomain logic
content = content.replace(
  /modules: \(raw\.modules as Record<string, unknown>\[\]\)\.map\(\(m\) => \(\{\n\s*title: m\.title as string,\n\s*lessons: \(m\.lessons as Record<string, unknown>\[\]\)\.map\(\(l\) => \(\{\n\s*title: l\.title as string,\n\s*content: \(l\.content as string\) \?\? \(l\.description as string\),\n\s*code_example: l\.code_example as string \| undefined,\n\s*\}\)\),\n\s*\}\)\),/,
  `modules: (raw.modules as Record<string, unknown>[]).map((m) => {
      const lessonsArr = (m.lessons as Record<string, unknown>[]) || [];
      const topicsArr = (m.topics as string[]) || [];

      // Backwards compatibility for my Phase 2 injected domains which use 'topics'
      const topicsAsLessons = topicsArr.map(t => ({
        title: t,
        content: t,
        code_example: undefined
      }));

      const formalLessons = lessonsArr.map((l) => ({
        title: l.title as string,
        content: (l.content as string) ?? (l.description as string),
        code_example: l.code_example as string | undefined,
      }));

      return {
        title: (m.title as string) || (m.id as string) || "Module",
        lessons: formalLessons.length > 0 ? formalLessons : topicsAsLessons,
      };
    }),`
);

// Fallback for learning_objectives missing
content = content.replace(
    /learning_objectives: raw\.learning_objectives as string\[\],/,
    'learning_objectives: (raw.learning_objectives as string[]) || ["Master Advanced MLOps Techniques", "Deploy Edge AI Payloads", "Orchestrate Multi-Agent Swarms"],'
);

fs.writeFileSync(file, content);
console.log("Fixed domain data schema adapter");
