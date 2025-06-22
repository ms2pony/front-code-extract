
// #!/usr/bin/env node
const path = require('path');
const collectDeps = require('./collectDeps');
const { setAliasRoot } = require('./resolve');
const { generateReport, outputToFiles } = require('./output');

(async () => {
  const [,, entryArg, rootArg, outputArg] = process.argv;
  if (!entryArg) {
    console.error('Usage: node cli.js <entry-file> [project-root] [output-dir]');
    console.error('Example: node cli.js ../sample-app/src/main.js ../sample-app ./output');
    process.exit(1);
  }
  
  const entry = path.resolve(entryArg);
  const projectRoot = rootArg ? path.resolve(rootArg) : path.dirname(entry);
  const outputDir = outputArg ? path.resolve(outputArg) : path.join(process.cwd(), 'output');
  
  setAliasRoot(projectRoot);

  console.log('🔍 开始分析依赖...');
  const result = await collectDeps(entry, projectRoot);
  const deps = result.dependencies;
  const aliasStats = result.aliasStats;
  
  console.log('📊 生成报告...');
  const report = generateReport(deps, entry, projectRoot,aliasStats);
  
  console.log('💾 输出到文件...');
  const outputPaths = outputToFiles(report, outputDir);
  
  console.log('\n✅ 分析完成!');
  console.log(`📁 输出目录: ${outputDir}`);
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
