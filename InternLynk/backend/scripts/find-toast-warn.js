import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchDir(full);
    } else if (full.endsWith('.js') || full.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('toast.warn')) {
        console.log(`Found toast.warn in: ${full}`);
      }
    }
  }
}

searchDir('c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/InternLynk/frontend/src');
