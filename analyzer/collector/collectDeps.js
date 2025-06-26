
const fs = require('fs');
const path = require('path');
const parseVue = require('../parsers/parseVue');
const parseJS = require('../parsers/parseJS');
const parseCSS = require('../parsers/parseCSS');
const { resetResolver } = require('../resolve');
const { resetStats, printStats, resolveStats } = require('../stats/resolve-stats');
const { routeTracker } = require('../hooks/route-tracker');

module.exports = async function collectDeps(entries) {
  resetResolver();
  resetStats(); // 重置统计信息
  
  const seen = new Set();
  
  // 支持单个入口文件或多个入口文件
  const entryArray = Array.isArray(entries) ? entries : [entries];
  
  // 将所有入口文件添加到栈中
  const stack = entryArray.map(entry => path.resolve(entry));
  
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;

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
    } catch(err) {
      console.log("collectDeps -> 文件读取失败：",err)
      continue;
    }
    const ctx = path.dirname(file);

    switch (ext) {
      case '.vue': await parseVue(code, ctx, stack,file); break;
      case '.js':
      case '.ts':  parseJS(code, ctx, stack, file); break;
      case '.css':
      case '.less':
      case '.scss': await parseCSS(code, ctx, stack,file); break;
      default:
        // 这里理论上不会执行到，因为上面已经过滤了
        break;
    }
  }
  
  // 输出解析统计
  printStats();
  
  // 输出路由依赖信息
  // const routeStats = routeTracker.getStats();
  // if (routeStats.totalSourceFiles > 0) {
  //   console.log('\n📍 路由依赖统计:');
  //   console.log(`  - 引用路由的文件数: ${routeStats.totalSourceFiles}`);
  //   console.log(`  - 被引用的路由文件数: ${routeStats.totalRouteFiles}`);
  //   console.log(`  - 总引用次数: ${routeStats.totalReferences}`);
    
  //   console.log('\n📍 详细路由引用关系:');
  //   const allReferences = routeTracker.getAllRouteReferences();
  //   for (const [sourceFile, routeFiles] of allReferences) {
  //     console.log(`  ${sourceFile}:`);
  //     routeFiles.forEach(routeFile => {
  //       console.log(`    -> ${routeFile}`);
  //     });
  //   }
  // } else {
  //   console.log('\n📍 未发现路由文件引用关系');
  // }
  
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