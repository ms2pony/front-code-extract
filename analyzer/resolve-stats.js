// 独立的统计模块，避免循环引用
const resolveStats = {
  aliasMatches: new Map(), // alias -> count
  totalResolutions: 0,
  failedResolutions: 0,
  detailedLogs: [] // 存储详细的解析日志
};

function resetStats() {
  resolveStats.aliasMatches.clear();
  resolveStats.totalResolutions = 0;
  resolveStats.failedResolutions = 0;
  resolveStats.detailedLogs = [];
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
  
  if (resolveStats.aliasMatches.size > 0) {
    console.log('\n🎯 Alias使用统计:');
    // 按使用次数降序排列
    const sortedAliases = [...resolveStats.aliasMatches.entries()]
      .sort((a, b) => b[1] - a[1]);
    
    for (const [alias, count] of sortedAliases) {
      console.log(`  ${alias}: ${count}次`);
    }
  }
}

module.exports = {
  resolveStats,
  resetStats,
  addResolution,
  addFailedResolution,
  printStats
};