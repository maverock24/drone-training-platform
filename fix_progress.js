const fs = require('fs');
let file = 'src/lib/progress-context.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getFlightHours')) {
    content = content.replace(
      /getTrackProgress: \(trackId: string\) => number;/,
      "getTrackProgress: (trackId: string) => number;\n  getFlightHours: () => number;\n  getGlobalRank: () => string;"
    );

    content = content.replace(
      /const getTrackProgress =/,
      `const getFlightHours = () => {
    // 1 completed lesson = 2.5 flight hours. 1 step = 0.2 hours.
    return (completedLessons.size * 2.5) + (completedSteps.size * 0.2);
  };

  const getGlobalRank = () => {
    const hours = getFlightHours();
    if (hours < 10) return "Ground School Cadet";
    if (hours < 50) return "Level 1 Operator";
    if (hours < 150) return "Senior Mission Commander";
    if (hours < 300) return "Edge AI Flight Master";
    return "Chief Systems Architect";
  };

  const getTrackProgress =`
    );

    content = content.replace(
      /isCompleted,\n\s*getTrackProgress,/,
      "isCompleted,\n        getTrackProgress,\n        getFlightHours,\n        getGlobalRank,"
    );

    fs.writeFileSync(file, content);
    console.log("Added Flight Hours and Global Rank to Progress Context!");
}

