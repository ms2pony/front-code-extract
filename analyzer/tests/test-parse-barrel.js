const { parseBarrel } = require('../parsers/parseBarrel');
const fs = require('fs');
const path = require('path');

// 创建测试目录和文件
const testDir = path.join(__dirname, 'barrel-test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 测试文件内容
const testFiles = {
  // 模式1: 直接 export from
  'barrel1.js': `
export { ComponentA, ComponentB } from './components/comp-a';
export { ServiceX } from './services/service-x';
export { default as UtilY } from './utils/util-y';
`,
  
  // 模式2: 先导入再导出 (类似 index.js)
  'barrel2.js': `
import ComponentA from './components/comp-a';
import ComponentB from './components/comp-b';
import ServiceX from './services/service-x';
import UtilY from './utils/util-y';
import { HelperZ } from './helpers/helper-z';

export {
  ComponentA,
  ComponentB,
  ServiceX,
  UtilY,
  HelperZ
};
`,
  
  // 模式3: 混合模式
  'barrel3.js': `
import DefaultComp from './default-comp';
import { NamedComp1, NamedComp2 } from './named-comps';

export { UtilA, UtilB } from './utils';
export * from './constants';
export {
  DefaultComp,
  NamedComp1,
  NamedComp2
};
`,
  
  // 模式4: export * 模式
  'barrel4.js': `
export * from './module-a';
export * from './module-b';
export { default as MainModule } from './main';
`,

  // 模式5: 直接导出常量/函数
  'barrel5.js': `
export const ENUM_A = {
  VALUE1: 'value1',
  VALUE2: 'value2'
};

export const ENUM_B = {
  VALUE3: 'value3'
};

export function utilFunction() {
  return 'util';
}

export class UtilClass {
  constructor() {}
}

`
};

// 创建测试文件
Object.entries(testFiles).forEach(([filename, content]) => {
  fs.writeFileSync(path.join(testDir, filename), content);
});

// 测试用例
function runTests() {
  console.log('开始测试 parseBarrel 功能...');
  
  // // 测试1: 直接 export from 模式
  // console.log('\n=== 测试1: 直接 export from 模式 ===');
  // const barrel1Path = path.join(testDir, 'barrel1.js');
  // const result1 = parseBarrel(barrel1Path, ['ComponentA', 'ServiceX', 'UtilY']);
  // console.log('测试符号:', ['ComponentA', 'ServiceX', 'UtilY']);
  // console.log('解析结果:', result1);
  
  // // 验证结果
  // const expected1 = {
  //   ComponentA: path.resolve(testDir, 'components/comp-a'),
  //   ServiceX: path.resolve(testDir, 'services/service-x'),
  //   UtilY: path.resolve(testDir, 'utils/util-y')
  // };
  // console.log('期望结果:', expected1);
  // console.log('测试1通过:', JSON.stringify(result1) === JSON.stringify(expected1));
  
  // // 测试2: 先导入再导出模式
  // console.log('\n=== 测试2: 先导入再导出模式 ===');
  // const barrel2Path = path.join(testDir, 'barrel2.js');
  // const result2 = parseBarrel(barrel2Path, ['ComponentA', 'ComponentB', 'HelperZ']);
  // console.log('测试符号:', ['ComponentA', 'ComponentB', 'HelperZ']);
  // console.log('解析结果:', result2);
  
  // const expected2 = {
  //   ComponentA: path.resolve(testDir, 'components/comp-a'),
  //   ComponentB: path.resolve(testDir, 'components/comp-b'),
  //   HelperZ: path.resolve(testDir, 'helpers/helper-z')
  // };
  // console.log('期望结果:', expected2);
  // console.log('测试2通过:', JSON.stringify(result2) === JSON.stringify(expected2));
  
  // // 测试3: 混合模式
  // console.log('\n=== 测试3: 混合模式 ===');
  // const barrel3Path = path.join(testDir, 'barrel3.js');
  // const result3 = parseBarrel(barrel3Path, ['DefaultComp', 'NamedComp1', 'UtilA']);
  // console.log('测试符号:', ['DefaultComp', 'NamedComp1', 'UtilA']);
  // console.log('解析结果:', result3);
  
  // const expected3 = {
  //   DefaultComp: path.resolve(testDir, 'default-comp'),
  //   NamedComp1: path.resolve(testDir, 'named-comps'),
  //   UtilA: path.resolve(testDir, 'utils')
  // };
  // console.log('期望结果:', expected3);
  // console.log('测试3通过:', JSON.stringify(result3) === JSON.stringify(expected3));
  
  // // 测试4: export * 模式
  // console.log('\n=== 测试4: export * 模式 ===');
  // const barrel4Path = path.join(testDir, 'barrel4.js');
  // const result4 = parseBarrel(barrel4Path, ['SomeSymbol', 'MainModule']);
  // console.log('测试符号:', ['SomeSymbol', 'MainModule']);
  // console.log('解析结果:', result4);
  
  // // 测试5: 单个符号测试
  // console.log('\n=== 测试5: 单个符号测试 ===');
  // const result5 = parseBarrel(barrel2Path, 'ComponentA');
  // console.log('测试符号:', 'ComponentA');
  // console.log('解析结果:', result5);
  
  // const expected5 = {
  //   ComponentA: path.resolve(testDir, 'components/comp-a')
  // };
  // console.log('期望结果:', expected5);
  // console.log('测试5通过:', JSON.stringify(result5) === JSON.stringify(expected5));
  
  // // 测试6: 不存在的符号
  // console.log('\n=== 测试6: 不存在的符号 ===');
  // const result6 = parseBarrel(barrel1Path, ['NonExistentSymbol']);
  // console.log('测试符号:', ['NonExistentSymbol']);
  // console.log('解析结果:', result6);
  // console.log('测试6通过:', Object.keys(result6).length === 0);
  
  // // 测试7: 不存在的文件
  // console.log('\n=== 测试7: 不存在的文件 ===');
  // const result7 = parseBarrel('/non/existent/file.js', ['AnySymbol']);
  // console.log('解析结果:', result7);
  // console.log('测试7通过:', Object.keys(result7).length === 0);
  
  // console.log('\n所有测试完成!');

  // 测试直接导出模式
  console.log('\n=== 测试8: 直接导出模式 ===');
  const barrel5Path = path.join(testDir, 'barrel5.js');
  const result8 = parseBarrel(barrel5Path, ['ENUM_A', 'utilFunction', 'UtilClass']);
  console.log('测试符号:', ['ENUM_A', 'utilFunction', 'UtilClass']);
  console.log('解析结果:', result8);
}

// 清理函数
function cleanup() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('清理测试文件完成');
  }
}

// 运行测试
try {
  runTests();
} catch (error) {
  console.error('测试过程中出现错误:', error);
} finally {
  cleanup();
}