const path = require("path");
const d = require(path.join(__dirname, "..", "courses", "drone_training.json"));
const s = d.tracks[3].lessons[3].learning_script;
if (!s) { console.log("FAIL: no learning_script"); process.exit(1); }
if (s.length !== 10) { console.log("FAIL: pages=" + s.length); process.exit(1); }
for (let i = 0; i < 10; i++) {
  const p = s[i];
  if (p.page !== i + 1) { console.log("FAIL: page " + (i+1) + " has page=" + p.page); process.exit(1); }
  if (p.content.length < 500) { console.log("FAIL: page " + p.page + " content=" + p.content.length); process.exit(1); }
  if (p.key_takeaways.length < 2 || p.key_takeaways.length > 4) { console.log("FAIL: page " + p.page + " takeaways=" + p.key_takeaways.length); process.exit(1); }
}
console.log("PASS: 10 pages, sequential, content>=500, 2-4 takeaways");
