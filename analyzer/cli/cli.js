
// #!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const collectDeps = require('../collector/collectDeps');
const { setAliasRoot } = require('../resolve');
const { generateReport, outputToFiles } = require('../stats/output');

// 读取配置文件
function loadConfig() {
  const configPath = path.join(__dirname, '../config/cli-config.js');
  try {
    if (fs.existsSync(configPath)) {
      // 删除 require 缓存以确保每次都读取最新配置
      delete require.cache[require.resolve('../config/cli-config.js')];
      return require('../config/cli-config.js');
    }
  } catch (error) {
    console.warn('⚠️ 配置文件读取失败，使用默认配置:', error.message);
  }
  return {};
}

(async () => {
  const [,, entryArg, rootArg, outputArg] = process.argv;
  const config = loadConfig();
  
  // 优先使用命令行参数，其次使用配置文件，最后使用默认值
  const entryFile = entryArg || config.entryFile;
  
  if (!entryFile) {
    console.error('❌ 缺少入口文件参数!');
    console.error('\n使用方法:');
    console.error('  1. 命令行参数: node cli.js <entry-file> [project-root] [output-dir]');
    console.error('  2. 配置文件: 在 config/cli-config.js 中设置 entryFile');
    console.error('\n示例:');
    console.error('  node cli.js ../sample-app/src/main.js ../sample-app ./output');
    console.error('\n配置文件示例:');
    console.error('  module.exports = {');
    console.error('    entryFile: "../sample-app/src/main.js",');
    console.error('    projectRoot: "../sample-app",');
    console.error('    outputDir: "./output"');
    console.error('  };');
    process.exit(1);
  }
  
  const entry = path.resolve(entryFile);
  const projectRoot = rootArg || config.projectRoot || path.dirname(entry);
  const outputDir = outputArg || config.outputDir || path.join(process.cwd(), 'output');
  
  // 显示使用的配置
  console.log('📋 使用配置:');
  console.log(`  入口文件: ${entryFile} ${entryArg ? '(命令行)' : '(配置文件)'}`);
  console.log(`  项目根目录: ${projectRoot} ${rootArg ? '(命令行)' : config.projectRoot ? '(配置文件)' : '(默认)'}`);
  console.log(`  输出目录: ${outputDir} ${outputArg ? '(命令行)' : config.outputDir ? '(配置文件)' : '(默认)'}`);
  console.log('');
  
  setAliasRoot(path.resolve(projectRoot));

  console.log('🔍 开始分析依赖...');
  const result = await collectDeps(entry, path.resolve(projectRoot));
  const deps = result.dependencies;
  const aliasStats = result.aliasStats;
  
  console.log('📊 生成报告...');
  const report = generateReport(deps, entry, path.resolve(projectRoot), aliasStats);
  
  console.log('💾 输出到文件...');
  const outputPaths = outputToFiles(report, path.resolve(outputDir));
  
  console.log('\n✅ 分析完成!');
  console.log(`📁 输出目录: ${path.resolve(outputDir)}`);
  console.log(`📄 报告文件:`);
  console.log(`  - JSON格式: ${path.basename(outputPaths.jsonPath)}`);
  console.log(`  - 文本格式: ${path.basename(outputPaths.textPath)}`);
  console.log(`  - 文件列表: ${path.basename(outputPaths.listPath)}`);
  console.log(`\n📈 统计信息:`);
  console.log(`  - 总文件数: ${report.statistics.total}`);
  Object.entries(report.statistics.byType)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([type, count]) => {
      const typeName = type === 'no-extension' ? '无扩展名' : type;
      console.log(`  - ${typeName}: ${count} 个`);
    });
})();
