
const fs = require('fs');
const path = require('path');
const parseVue = require('./parseVue');
const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const { resetResolver } = require('./resolve');

module.exports = async function collectDeps(entry, projectRoot) {
  resetResolver();
  const seen = new Set();
  const stack = [path.resolve(entry)];
  console.log(stack)
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);

    const ext = path.extname(file);
    let code;
    try {
      code = fs.readFileSync(file, ext === '.png' ? null : 'utf8');
    } catch {
      continue;
    }
    const ctx = path.dirname(file);

    switch (ext) {
      case '.vue': await parseVue(code, ctx, stack); break;
      case '.js':
      case '.ts':  parseJS(code, ctx, stack); break;
      case '.css':
      case '.less':
      case '.scss': await parseCSS(code, ctx, stack); break;
      default:
        // static asset
        break;
    }
  }
  return [...seen];
};
