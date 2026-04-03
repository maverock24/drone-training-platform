const fs = require('fs');
let file = 'src/components/glossary-text.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove 'asChild' from TooltipTrigger
content = content.replace(/<TooltipTrigger asChild>/g, '<TooltipTrigger>');

fs.writeFileSync(file, content);
console.log("Fixed GlossaryText TypeScript error");
