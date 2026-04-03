const fs = require('fs');
let file = 'src/components/navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getFlightHours')) {
    content = content.replace(
      /\} from "lucide-react";/,
      "} from \"lucide-react\";\nimport { useProgress } from \"@/lib/progress-context\";\nimport { Badge } from \"@/components/ui/badge\";"
    );

    content = content.replace(
      /const \{ user, loading, logout \} = useAuth\(\);/,
      "const { user, loading, logout } = useAuth();\n  const { getFlightHours, getGlobalRank } = useProgress();"
    );

    // Desktop nav inject rank
    content = content.replace(
      /<Link href="\/profile">\n(\s*)<Button variant="ghost" size="sm" className="gap-1\.5 text-sm text-muted-foreground hover:text-foreground">\n(\s*)<User className="h-3\.5 w-3\.5" \/>\n(\s*)\{user\.username\}\n(\s*)<\/Button>\n(\s*)<\/Link>/,
      `<Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <User className="h-3.5 w-3.5" />
                    {user.username}
                  </Button>
                </Link>
                <Badge variant="secondary" className="font-mono bg-cyan-950/30 text-cyan-400 border-cyan-800 pointer-events-none">
                  {getFlightHours().toFixed(1)} Hrs • {getGlobalRank().split(' ')[0]}
                </Badge>`
    );

    fs.writeFileSync(file, content);
    console.log("Injected Gamified Flight Hours and Rank Badge into Navbar!");
}
