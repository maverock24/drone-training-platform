const fs = require('fs');
let file = 'src/app/tracks/[trackId]/[moduleId]/[lessonId]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('System Architecture Blueprint')) {
    content = content.replace(
        /<\/TabsContent>(\s*)<TabsContent value="steps">/,
        `            {/* Intelligent Architecture Injection based on lesson ID */}\n            {(lesson.id.includes('architecture') || lesson.id.includes('hardware')) && (\n               <div className="mt-8"><h3 className="text-xl font-bold mb-4">System Architecture Blueprint</h3><InteractiveArchitecture /></div>\n            )}\n          </TabsContent>\n$1<TabsContent value=\"steps\">`
    );
    fs.writeFileSync(file, content);
}

if (!content.includes('Interactive Lab: Deployment Terminal')) {
    content = content.replace(
        /<\/div>(\s*)<\/TabsContent>(\s*)<TabsContent value="quiz">/,
        `</div>\n\n            {(lesson.title.includes('Terminal') || lesson.title.includes('Deployment') || lesson.title.includes('Orchestration') || lesson.title.includes('Workflow')) && (\n              <div className="mt-8">\n                  <h3 className="text-xl font-bold mb-4">Interactive Lab: Deployment Terminal</h3><TerminalSimulator \n                expectedCommands={[\n                  { command: "kubectl apply -f manifest.yaml", output: ["deployment.apps/triton-inference-server created", "service/triton-service created"] },\n                  { command: "kubectl get pods", output: ["NAME                               READY   STATUS", "triton-inference-server-d9f78...   1/1     Running"] },\n                  { command: "argo app sync edge-inference", output: ["Application 'edge-inference' is out of sync", "Triggering sync to target state... Sync Successful."] }\n                ]}\n              /></div>\n            )}\n          </TabsContent>\n$2<TabsContent value="quiz">`
    );
    fs.writeFileSync(file, content);
}
