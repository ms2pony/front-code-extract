
// #!/usr/bin/env node
const path = require('path');
const collectDeps = require('./collectDeps');
const { setAliasRoot } = require('./resolve');

(async () => {
  const [,, entryArg, rootArg] = process.argv;
  if (!entryArg) {
    console.error('Usage: node cli.js <entry-file> [project-root]');
    process.exit(1);
  }
  const entry = path.resolve(entryArg);
  const projectRoot = rootArg ? path.resolve(rootArg) : path.dirname(entry);
  setAliasRoot(projectRoot);

  const deps = await collectDeps(entry, projectRoot);
  // console.log(deps.join('\n'));
})();
