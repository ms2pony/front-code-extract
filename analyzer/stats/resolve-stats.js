// 独立的统计模块，避免循环引用
const resolveStats = {
  aliasMatches: new Map(), // alias -> count
  totalResolutions: 0,
  failedResolutions: 0,
  detailedLogs: [], // 存储详细的解析日志
  modules: [], // 存储涉及到的模块列表
  routeFiles: new Set() // 新增：存储路由文件的绝对路径
};

function resetStats() {
  resolveStats.aliasMatches.clear();
  resolveStats.totalResolutions = 0;
  resolveStats.failedResolutions = 0;
  resolveStats.detailedLogs = [];
  resolveStats.modules = [];
  resolveStats.routeFiles.clear(); // 清空路由文件列表
}

// 新增：添加路由文件到统计中
function addRouteFile(routeFilePath) {
  if (routeFilePath && typeof routeFilePath === 'string') {
    resolveStats.routeFiles.add(routeFilePath);
  }
}

// 新增：获取路由文件列表
function getRouteFiles() {
  return Array.from(resolveStats.routeFiles);
}

function addResolution(originalRequest, matchedAlias, resolvedPath, ctx) {
  resolveStats.totalResolutions++;
  
  const logEntry = {
    originalRequest,
    matchedAlias,
    resolvedPath,
    ctx,
    timestamp: Date.now()
  };
  
  resolveStats.detailedLogs.push(logEntry);
  
  // 检测模块路径并添加到modules列表
  if (resolvedPath) {
    const moduleMatch = resolvedPath.match(/src[\\\/]modules[\\\/]([^\\\/]+)/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      if (!resolveStats.modules.includes(moduleName)) {
        resolveStats.modules.push(moduleName);
      }
    }
  }
  
  if (matchedAlias) {
    const alias = matchedAlias.alias;
    resolveStats.aliasMatches.set(alias, (resolveStats.aliasMatches.get(alias) || 0) + 1);
    
    // console.log(`🎯 Alias匹配: '${originalRequest}' -> '${alias}' (${matchedAlias.target})`);
    // console.log(`   解析结果: ${resolvedPath}`);
  } else {
    // console.log(`📁 相对路径: '${originalRequest}' -> ${resolvedPath}`);
  }
}

function addFailedResolution(request, ctx, error) {
  resolveStats.failedResolutions++;
  console.warn(`❌ 解析失败: '${request}' from '${ctx}'`, error?.message || '');
}

function printStats() {
  console.log('\n📊 路径解析统计:');
  console.log(`总解析次数: ${resolveStats.totalResolutions}`);
  console.log(`失败次数: ${resolveStats.failedResolutions}`);
  console.log(`成功率: ${((resolveStats.totalResolutions - resolveStats.failedResolutions) / resolveStats.totalResolutions * 100).toFixed(1)}%`);
  
  // 输出路由文件统计
  if (resolveStats.routeFiles.size > 0) {
    console.log(`\n🛣️ 路由文件统计:`);
    console.log(`发现路由文件: ${resolveStats.routeFiles.size}个`);
  }
  
  // if (resolveStats.aliasMatches.size > 0) {
  //   console.log('\n🎯 Alias使用统计:');
  //   // 按使用次数降序排列
  //   const sortedAliases = [...resolveStats.aliasMatches.entries()]
  //     .sort((a, b) => b[1] - a[1]);
    
  //   for (const [alias, count] of sortedAliases) {
  //     console.log(`  ${alias}: ${count}次`);
  //   }
  // }
}

module.exports = {
  resolveStats,
  resetStats,
  addResolution,
  addFailedResolution,
  addRouteFile, // 新增导出
  getRouteFiles, // 新增导出
  printStats
};