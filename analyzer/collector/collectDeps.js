
const fs = require('fs');
const path = require('path');
const parseVue = require('../parsers/parseVue');
const parseJS = require('../parsers/parseJS');
const parseCSS = require('../parsers/parseCSS');
const { resetResolver } = require('../resolve');
const { resetStats, printStats, resolveStats } = require('../stats/resolve-stats');

module.exports = async function collectDeps(entry, projectRoot) {
  resetResolver();
  resetStats(); // 重置统计信息
  
  const seen = new Set();
  const stack = [path.resolve(entry)];
  
  while (stack.length) {
    const file = stack.pop();
    // console.log("collectDeps --- file",file, seen)
    // console.log("collectDeps-while: file ->",file,path.dirname(file))
    if (seen.has(file)) continue;
    // console.log("collectDeps --- 2")

    seen.add(file);

    const ext = path.extname(file);
    
    // 定义需要读取内容的文件类型
    const textFileExtensions = ['.vue', '.js', '.ts', '.css', '.less', '.scss'];
    
    // 如果不是文本文件，跳过内容读取
    if (!textFileExtensions.includes(ext)) {
      // static asset - 直接跳过，不读取文件内容
      // console.log(`非文本文件或前端代码文件类型-跳过读取内容，文件路径：${file}`)
      continue;
    }
    
    let code;
    try {
      code = fs.readFileSync(file, 'utf8');
      // console.log("collectDeps --- code",code)
    } catch(err) {
      console.log("collectDeps -> 文件读取失败：",err)
      continue;
    }
    const ctx = path.dirname(file);

    switch (ext) {
      case '.vue': await parseVue(code, ctx, stack); break;
      case '.js':
      case '.ts':  parseJS(code, ctx, stack, file); break;
      case '.css':
      case '.less':
      case '.scss': await parseCSS(code, ctx, stack); break;
      default:
        // 这里理论上不会执行到，因为上面已经过滤了
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
