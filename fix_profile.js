const fs = require('fs');
let file = 'src/app/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getFlightHours')) {
    content = content.replace(
      /const \{ user, logout \} = useAuth\(\);/,
      "const { user, logout } = useAuth();\n  const { getFlightHours, getGlobalRank } = useProgress();"
    );

    // Update the "Overall Completion" card to "Operational Profile" and include Flight Hours
    content = content.replace(
      /<CardTitle>Overall Completion<\/CardTitle>\n(.*?)<\/CardHeader>\n(.*?)<CardContent>(\s*)<div className="text-4xl font-bold mb-4">(\s*)\{Math.round\(\(totalCompleted \/ totalLessons\) \* 100\)\}%\n(\s*)<\/div>/s,
      `<CardTitle>Operational Profile</CardTitle>
              </CardHeader>
              <CardContent flex flex-col>
                <div className="flex flex-row justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Flight Hours</p>
                    <div className="text-4xl font-bold font-mono text-primary">{getFlightHours().toFixed(1)} hrs</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Global Rank</p>
                    <div className="text-2xl font-bold bg-muted/50 px-3 py-1 rounded inline-block">{getGlobalRank()}</div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Curriculum Completion</p>
                  <div className="text-2xl mt-1 font-bold">
                    {Math.round((totalCompleted / totalLessons) * 100)}%
                  </div>`
    );

    fs.writeFileSync(file, content);
    console.log("Injected Flight Hours and Rank into Profile!");
}
