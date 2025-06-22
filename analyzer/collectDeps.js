
const fs = require('fs');
const path = require('path');
const parseVue = require('./parseVue');
const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const { resetResolver } = require('./resolve');
const { resetStats, printStats, resolveStats } = require('./resolve-stats');

module.exports = async function collectDeps(entry, projectRoot) {
  resetResolver();
  resetStats(); // 重置统计信息
  
  const seen = new Set();
  const stack = [path.resolve(entry)];
  
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
  
  // 输出解析统计
  printStats();
  
  // 返回依赖列表和统计信息
  return {
    dependencies: [...seen],
    aliasStats: {
      totalResolutions: resolveStats.totalResolutions,
      failedResolutions: resolveStats.failedResolutions,
      aliasMatches: resolveStats.aliasMatches
    }
  };
};

// 导出统计对象供push.js使用
// module.exports.resolveStats = resolveStats;
