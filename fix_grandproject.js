const fs = require('fs');
let file = 'src/app/grand-project/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('InteractiveArchitecture')) {
    content = content.replace(
      /import \{ GlossaryText \} from "@\/components\/glossary-text";/,
      "import { GlossaryText } from \"@/components/glossary-text\";\nimport { InteractiveArchitecture } from \"@/components/interactive-architecture\";\nimport { TerminalSimulator } from \"@/components/terminal-simulator\";"
    );

    // Inject before the "Are you ready" CTA 
    content = content.replace(
      /<h2 className="text-3xl font-bold mb-4">Are you ready\?<\/h2>/,
      `<h2 className="text-3xl font-bold mb-4">Phase 1: Architecture Review & Deployment</h2>
            <div className="mb-12">
              <InteractiveArchitecture />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Phase 2: Kubernetes Cluster Provisioning</h2>
            <div className="mb-12">
               <TerminalSimulator 
                expectedCommands={[
                  { command: "kubectl create namespace fire-detection-edge", output: ["namespace/fire-detection-edge created"] },
                  { command: "helm install triton nvidia/triton-inference-server -n fire-detection-edge", output: ["NAME: triton", "LAST DEPLOYED: Wed Apr  3 10:20:00 2026", "NAMESPACE: fire-detection-edge", "STATUS: deployed"] },
                  { command: "kubectl get pods -n fire-detection-edge", output: ["NAME                                      READY   STATUS", "triton-inference-server-9x7f2...   1/1     Running"] }
                ]}
              />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Are you ready?</h2>`
    );

    fs.writeFileSync(file, content);
    console.log("Injected Simulators into Grand Project!");
}
