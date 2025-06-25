const { contextTracker } = require('../hooks/context-tracker');
const { parseContext } = require('../parsers/parseContext');
const fs = require('fs');
const path = require('path');

/**
 * Context 性能测试
 */
class ContextPerformanceTest {
  static runTest() {
    console.log('=== Context 性能测试 ===\n');
    
    this.setupLargeTestFiles();
    this.testParsingPerformance();
    this.testCachePerformance();
    this.testMemoryUsage();
    this.cleanupTestFiles();
    
    console.log('\n=== 性能测试完成 ===');
  }
  
  static setupLargeTestFiles() {
    const testDir = path.join(__dirname, 'performance-test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 创建大量组件文件
    const componentsDir = path.join(testDir, 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir);
    }
    
    // 生成100个组件文件
    for (let i = 1; i <= 100; i++) {
      const componentContent = `<template><div>Component ${i}</div></template>
<script>
export default {
  name: 'Component${i}'
}
</script>`;
      fs.writeFileSync(path.join(componentsDir, `Component${i}.vue`), componentContent);
    }
    
    // 创建大型context文件
    const largeContextContent = `
import { importAll } from "../utils"

const context = require.context("./", false, /\.vue$/)
export default importAll(context)
`;
    
    fs.writeFileSync(path.join(testDir, 'large-context.js'), largeContextContent);
    
    // 创建复杂的Vue install文件
    const complexVueInstallContent = `
export default {
  install(Vue) {
    const context = require.context('./', true, /\.js$/)
    context.keys().forEach(filePath => {
      if (filePath.endsWith('index.js')) return
      
      const module = context(filePath).default
      if (module && module.name) {
        Object.defineProperty(Vue.prototype, \`$\${module.name}\`, {
          get() { return module }
        })
      }
    })
  }
}
`;
    
    fs.writeFileSync(path.join(testDir, 'complex-vue-install.js'), complexVueInstallContent);
    
    // 创建模块文件
    const modulesDir = path.join(testDir, 'modules');
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir);
    }
    
    for (let i = 1; i <= 50; i++) {
      const moduleContent = `export default { name: "module${i}", version: "1.0.${i}" }`;
      fs.writeFileSync(path.join(modulesDir, `module${i}.js`), moduleContent);
    }
    
    this.testDir = testDir;
  }
  
  static testParsingPerformance() {
    console.log('1. 解析性能测试:\n');
    
    const largeContextFile = path.join(this.testDir, 'large-context.js');
    const complexVueInstallFile = path.join(this.testDir, 'complex-vue-install.js');
    
    const testCases = [
      { name: '大型组件Context', file: largeContextFile },
      { name: '复杂Vue Install', file: complexVueInstallFile }
    ];
    
    testCases.forEach(testCase => {
      console.log(`   ${testCase.name}:`);
      
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        parseContext(testCase.file, ['*']);
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // 转换为毫秒
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`     平均耗时: ${avgTime.toFixed(2)}ms`);
      console.log(`     最小耗时: ${minTime.toFixed(2)}ms`);
      console.log(`     最大耗时: ${maxTime.toFixed(2)}ms`);
      console.log('');
    });
  }
  
  static testCachePerformance() {
    console.log('2. 缓存性能测试:\n');
    
    const testFile = path.join(this.testDir, 'large-context.js');
    
    // 首次解析
    const start1 = process.hrtime.bigint();
    contextTracker.resolveContextSymbols(testFile, ['*']);
    const end1 = process.hrtime.bigint();
    const firstTime = Number(end1 - start1) / 1000000;
    
    // 缓存解析（多次）
    const cacheIterations = 100;
    const start2 = process.hrtime.bigint();
    for (let i = 0; i < cacheIterations; i++) {
      contextTracker.resolveContextSymbols(testFile, ['*']);
    }
    const end2 = process.hrtime.bigint();
    const cacheTime = Number(end2 - start2) / 1000000 / cacheIterations;
    
    console.log(`   首次解析耗时: ${firstTime.toFixed(2)}ms`);
    console.log(`   缓存解析耗时: ${cacheTime.toFixed(4)}ms`);
    console.log(`   性能提升: ${(firstTime / cacheTime).toFixed(0)}x`);
    console.log('');
  }
  
  static testMemoryUsage() {
    console.log('3. 内存使用测试:\n');
    
    const initialMemory = process.memoryUsage();
    
    // 解析多个文件
    const testFiles = [
      path.join(this.testDir, 'large-context.js'),
      path.join(this.testDir, 'complex-vue-install.js')
    ];
    
    testFiles.forEach(file => {
      for (let i = 0; i < 10; i++) {
        contextTracker.resolveContextSymbols(file, [`symbol${i}`]);
      }
    });
    
    const finalMemory = process.memoryUsage();
    const stats = contextTracker.getStats();
    
    console.log(`   初始内存使用: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   最终内存使用: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   内存增长: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   缓存条目数: ${stats.totalContextFiles}`);
    console.log(`   平均每条目内存: ${((finalMemory.heapUsed - initialMemory.heapUsed) / stats.totalContextFiles / 1024).toFixed(2)}KB`);
    console.log('');
  }
  
  static cleanupTestFiles() {
    if (fs.existsSync(this.testDir)) {
      function removeDir(dir) {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach(file => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              removeDir(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dir);
        }
      }
      removeDir(this.testDir);
      console.log('性能测试文件已清理');
    }
  }
}

// 运行测试
if (require.main === module) {
  ContextPerformanceTest.runTest();
}

module.exports = ContextPerformanceTest;