const fs = require('fs');

let file = 'src/app/tracks/[trackId]/[moduleId]/[lessonId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('TerminalSimulator')) {
  // Add import
  content = content.replace(
    /import \{ GlossaryText \} from "@\/components\/glossary-text";/,
    "import { GlossaryText } from \"@/components/glossary-text\";\nimport { TerminalSimulator } from \"@/components/terminal-simulator\";\nimport { InteractiveArchitecture } from \"@/components/interactive-architecture\";"
  );
  
  // Try to find the end of the TabsContent for Detailed Explanation to insert Architecture
  content = content.replace(
    /<\/TabsContent>(\s*)<TabsContent value="steps">/,
    "            {/* Intelligent Architecture Injection based on lesson ID */}\n            {(lesson.id.includes('architecture') || lesson.id.includes('hardware')) && (\n               <InteractiveArchitecture />\n            )}\n          </TabsContent>\n$1<TabsContent value=\"steps\">"
  );

  // Towards the end of the Step by Step guide tab, insert Terminal Simulator
  content = content.replace(
    /<\/div>(\s*)<\/TabsContent>(\s*)<TabsContent value="quiz">/,
    `</div>\n\n            {(lesson.title.includes('Terminal') || lesson.title.includes('Deployment') || lesson.title.includes('Orchestration') || lesson.title.includes('Workflow')) && (\n              <TerminalSimulator \n                expectedCommands={[\n                  { command: "kubectl apply -f manifest.yaml", output: ["deployment.apps/triton-inference-server created", "service/triton-service created"] },\n                  { command: "kubectl get pods", output: ["NAME                               READY   STATUS", "triton-inference-server-d9f78...   1/1     Running"] },\n                  { command: "argo app sync edge-inference", output: ["Application 'edge-inference' is out of sync", "Triggering sync to target state... Sync Successful."] }\n                ]}\n              />\n            )}\n          </TabsContent>\n$2<TabsContent value="quiz">`
  );

  fs.writeFileSync(file, content);
  console.log("Injected Terminal and Architecture simulators into Lesson Page.");
}
