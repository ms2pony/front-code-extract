const fs = require('fs');
const path = require('path');

// 确保输出目录存在
function ensureOutputDir(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// 生成文件树结构
function generateFileTree(deps, projectRoot) {
  const tree = {};
  
  deps.forEach(dep => {
    const relativePath = path.relative(projectRoot, dep);
    if (relativePath.startsWith('..')) return; // 跳过项目外的文件
    
    const parts = relativePath.split(path.sep);
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? { __file: true, __path: dep } : {};
      }
      if (index < parts.length - 1) {
        current = current[part];
      }
    });
  });
  
  return tree;
}

// 渲染文件树
function renderTree(tree, prefix = '', isLast = true) {
  let result = '';
  const entries = Object.entries(tree).filter(([key]) => !key.startsWith('__'));
  
  entries.forEach(([name, subtree], index) => {
    const isLastEntry = index === entries.length - 1;
    const connector = isLastEntry ? '└── ' : '├── ';
    const icon = subtree.__file ? getFileIcon(name) : '📁';
    
    result += `${prefix}${connector}${icon} ${name}\n`;
    
    if (!subtree.__file) {
      const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
      result += renderTree(subtree, newPrefix, isLastEntry);
    }
  });
  
  return result;
}

// 获取文件图标
function getFileIcon(filename) {
  const ext = path.extname(filename);
  const icons = {
    '.vue': '🟢',
    '.js': '🟡',
    '.ts': '🔵',
    '.css': '🎨',
    '.less': '🎨',
    '.scss': '🎨',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🖼️',
    '.svg': '🖼️',
    '.json': '📋',
    '.md': '📝',
    '.html': '🌐'
  };
  return icons[ext] || '📄';
}

// 统计文件类型
function getFileStats(deps) {
  const stats = {};
  const typeStats = {};
  
  deps.forEach(dep => {
    const ext = path.extname(dep);
    const type = ext || 'no-extension';
    
    if (!typeStats[type]) {
      typeStats[type] = 0;
    }
    typeStats[type]++;
  });
  
  stats.total = deps.length;
  stats.byType = typeStats;
  
  return stats;
}

// 生成报告内容 - 修改为支持多入口文件和路由文件统计
function generateReport(deps, entries, projectRoot, aliasStats = null) {
  const stats = getFileStats(deps);
  const tree = generateFileTree(deps, projectRoot);
  const treeString = renderTree(tree);
  
  // 确保entries是数组格式
  const entryArray = Array.isArray(entries) ? entries : [entries];
  
  // 获取路由文件列表
  const { getRouteFiles } = require('./resolve-stats');
  const routeFiles = getRouteFiles();
  
  const report = {
    summary: {
      projectRoot: projectRoot,
      entryFiles: entryArray.map(entry => ({
        absolute: entry,
        relative: path.relative(projectRoot, entry)
      })),
      totalFiles: stats.total,
      analysisTime: new Date().toISOString()
    },
    statistics: {
      total: stats.total,
      byType: stats.byType
    },
    // alias统计
    aliasStatistics: aliasStats ? {
      totalResolutions: aliasStats.totalResolutions,
      failedResolutions: aliasStats.failedResolutions,
      successRate: aliasStats.totalResolutions > 0 ? 
        ((aliasStats.totalResolutions - aliasStats.failedResolutions) / aliasStats.totalResolutions * 100).toFixed(1) : '0',
      aliasUsage: Object.fromEntries(aliasStats.aliasMatches || new Map())
    } : null,
    // 新增：路由文件统计
    routeStatistics: {
      totalRouteFiles: routeFiles.length,
      routeFiles: routeFiles.map(routeFile => ({
        absolute: routeFile,
        relative: path.relative(projectRoot, routeFile)
      }))
    },
    fileTree: treeString,
    fileList: deps.map(dep => ({
      absolute: dep,
      relative: path.relative(projectRoot, dep),
      type: path.extname(dep) || 'no-extension'
    }))
  };
  
  return report;
}

// 输出到文件
function outputToFiles(report, outputDir) {
  ensureOutputDir(outputDir);
  
  // 输出JSON格式的完整报告
  const jsonPath = path.join(outputDir, 'dependency-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  
  // 输出可读的文本报告
  const textReport = generateTextReport(report);
  const textPath = path.join(outputDir, 'dependency-report.txt');
  fs.writeFileSync(textPath, textReport, 'utf8');
  
  // 输出简单的文件列表
  const listPath = path.join(outputDir, 'file-list.txt');
  const fileList = report.fileList.map(f => f.absolute).join('\n');
  fs.writeFileSync(listPath, fileList, 'utf8');
  
  return {
    jsonPath,
    textPath,
    listPath
  };
}

// 生成文本格式报告 - 修改为支持多入口文件
function generateTextReport(report) {
  let text = '';
  
  text += '📊 项目依赖分析报告\n';
  text += '='.repeat(50) + '\n';
  text += `📁 项目根目录: ${report.summary.projectRoot}\n`;
  
  // 处理多入口文件显示
  if (report.summary.entryFiles.length === 1) {
    text += `🎯 入口文件: ${report.summary.entryFiles[0].relative}\n`;
  } else {
    text += `🎯 入口文件: ${report.summary.entryFiles.length}个\n`;
    report.summary.entryFiles.forEach((entry, index) => {
      text += `   ${index + 1}. ${entry.relative}\n`;
    });
  }
  
  text += `📈 总依赖文件数: ${report.summary.totalFiles}\n`;
  text += `⏰ 分析时间: ${report.summary.analysisTime}\n\n`;
  
  text += '📋 文件类型统计:\n';
  Object.entries(report.statistics.byType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const icon = getFileIcon(`file${type}`);
      const typeName = type === 'no-extension' ? '无扩展名' : type;
      text += `  ${icon} ${typeName}: ${count} 个\n`;
    });
  
  // alias统计部分
  if (report.aliasStatistics) {
    text += '\n🎯 Alias解析统计:\n';
    text += `📊 总解析次数: ${report.aliasStatistics.totalResolutions}\n`;
    text += `❌ 失败次数: ${report.aliasStatistics.failedResolutions}\n`;
    text += `✅ 成功率: ${report.aliasStatistics.successRate}%\n\n`;
    
    if (Object.keys(report.aliasStatistics.aliasUsage).length > 0) {
      text += '📈 Alias使用频率排行:\n';
      const sortedAliases = Object.entries(report.aliasStatistics.aliasUsage)
        .sort(([,a], [,b]) => b - a);
      
      sortedAliases.forEach(([alias, count], index) => {
        const rank = index + 1;
        const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '  ';
        text += `  ${medal} ${alias}: ${count}次\n`;
      });
    }
  }
  
  text += '\n🌳 文件树结构:\n';
  text += report.fileTree;
  
  text += '\n' + '='.repeat(50) + '\n';
  text += '✅ 分析完成!\n';
  
  return text;
}

module.exports = {
  generateReport,
  outputToFiles,
  ensureOutputDir
};