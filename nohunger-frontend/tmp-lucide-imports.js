const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src');
const names = new Set();
function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
    } else if (/\.tsx?$/.test(file)) {
      const txt = fs.readFileSync(p, 'utf8');
      const re = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
      let m;
      while ((m = re.exec(txt))) {
        const imported = m[1].split(',').map((s) => s.trim()).filter(Boolean);
        imported.forEach((name) => names.add(name));
      }
    }
  }
}
walk(root);
console.log(Array.from(names).sort().join('\n'));