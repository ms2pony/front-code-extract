const { parseBarrel } = require('../parsers/parseBarrel');
const path = require('path');

// 测试真实的 barrel 文件
function testRealBarrel() {
  console.log('测试真实的 barrel 文件...');
  
  // 测试 tender routes index.js
  const tenderRoutesPath = path.resolve(__dirname, '../output/eui-pay-core/src/modules/tender/routes/index.js');
  
  console.log('\n=== 测试 tender routes index.js ===');
  console.log('文件路径:', tenderRoutesPath);
  
  // 测试几个具体的符号
  const testSymbols = [
    'CommissionPaymentRoute',
    'ContractRoute', 
    'Home',
    'Bond',
    'Template'
  ];
  
  console.log('测试符号:', testSymbols);
  
  const result = parseBarrel(tenderRoutesPath, testSymbols);
  console.log('\n解析结果:');
  Object.entries(result).forEach(([symbol, filePath]) => {
    console.log(`  ${symbol} -> ${filePath}`);
  });
  
  // 验证结果
  console.log('\n验证结果:');
  testSymbols.forEach(symbol => {
    if (result[symbol]) {
      console.log(`✓ ${symbol}: 成功定位到 ${result[symbol]}`);
    } else {
      console.log(`✗ ${symbol}: 未找到对应文件`);
    }
  });
  
  // 测试单个符号
  console.log('\n=== 测试单个符号 ===');
  const singleResult = parseBarrel(tenderRoutesPath, 'CommissionPaymentRoute');
  console.log('CommissionPaymentRoute 单独测试结果:', singleResult);
  
  return result;
}

// 运行测试
try {
  const result = testRealBarrel();
  console.log('\n测试完成，总共解析到', Object.keys(result).length, '个符号');
} catch (error) {
  console.error('测试过程中出现错误:', error);
}