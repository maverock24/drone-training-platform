const fs = require('fs');

// 1. Fix next.config.ts (Remove ignoreBuildErrors)
let nextCfg = 'next.config.ts';
let nextContent = fs.readFileSync(nextCfg, 'utf8');
nextContent = nextContent.replace(/ignoreDuringBuilds: true,/g, 'ignoreDuringBuilds: false,');
nextContent = nextContent.replace(/ignoreBuildErrors: true,/g, 'ignoreBuildErrors: false,');
fs.writeFileSync(nextCfg, nextContent);

// 2. Fix page.tsx
let gpFile = 'src/app/grand-project/page.tsx';
let gpContent = fs.readFileSync(gpFile, 'utf8');

// Fix malformed syntax
gpContent = gpContent.replace(/<GlossaryText text=<GlossaryText text=\{comp\.contribution\} \/> \/>/g, '<GlossaryText text={comp.contribution} />');

// Insert imports if missing
if (!gpContent.includes('import { InteractiveArchitecture }')) {
    gpContent = gpContent.replace(
        /import \{ grandProject \} from "@\/lib\/course-data";/,
        `import { grandProject } from "@/lib/course-data";\nimport { GlossaryText } from "@/components/glossary-text";\nimport { InteractiveArchitecture } from "@/components/interactive-architecture";\nimport { TerminalSimulator } from "@/components/terminal-simulator";`
    );
}
fs.writeFileSync(gpFile, gpContent);
console.log("Fixed issues.");
