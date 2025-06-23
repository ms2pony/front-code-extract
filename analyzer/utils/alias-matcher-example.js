const AliasMatcher = require('./alias-matcher');
const path = require('path');

// 文件路径
const reportPath = path.resolve(__dirname, '../output/dependency-report.json');
const resolverPath = path.resolve(__dirname, '../config/resolver.js');

// 处理并生成匹配结果
const matchResult = AliasMatcher.process(reportPath, resolverPath);

// 生成报告
const report = AliasMatcher.generateReport(matchResult);

// 输出报告
console.log(report);

// 也可以将结果输出为JSON文件
const fs = require('fs');
fs.writeFileSync(
  path.resolve(__dirname, '../output/alias-match-result.json'),
  JSON.stringify(matchResult, null, 2),
  'utf-8'
);