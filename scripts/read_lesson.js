const path = require("path");
const d = require(path.join(__dirname, "..", "courses", "drone_training.json"));
const l = d.tracks[3].lessons[3];
console.log("Title:", l.title);
console.log("Quiz count:", l.quiz.length);
console.log("Has explanation:", !!l.detailed_explanation);
l.quiz.forEach((q, i) => console.log("Q" + (i+1) + ":", q.question.substring(0, 100), "| A:", q.answer));
console.log("\n--- DETAILED EXPLANATION ---");
console.log(l.detailed_explanation);
