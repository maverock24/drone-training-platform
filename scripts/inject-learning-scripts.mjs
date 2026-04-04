// Helper script to inject learning_script arrays into drone_training.json
// Run with: node scripts/inject-learning-scripts.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, '..', 'courses', 'drone_training.json');

const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));

function injectScript(trackIdx, lessonIdx, pages) {
  if (!data.tracks[trackIdx].lessons[lessonIdx].learning_script) {
    data.tracks[trackIdx].lessons[lessonIdx].learning_script = pages;
    console.log(`Injected: Track ${trackIdx}, Lesson ${lessonIdx} - ${data.tracks[trackIdx].lessons[lessonIdx].title}`);
  } else {
    console.log(`Skipped (already exists): Track ${trackIdx}, Lesson ${lessonIdx}`);
  }
}

// Export for use
export { data, injectScript, jsonPath };

export function save() {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Written to ${jsonPath}`);
}
