const { contextTracker } = require('../hooks/context-tracker');
// const push = require('../collector/push');
const fs = require('fs');
const path = require('path');

/**
 * Context 集成测试 - 测试在push.js中的集成效果
 */
class ContextIntegrationTest {
  static runTest() {
    console.log('=== Context 集成测试 ===\n');
    
    this.setupTestEnvironment();
    this.testPushIntegration();
    this.cleanupTestEnvironment();
    
    console.log('\n=== 集成测试完成 ===');
  }
  
  static setupTestEnvironment() {
    const testDir = path.join(__dirname, 'integration-test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 创建模拟的Vue项目结构
    const projectStructure = {
      'src/extension/index.js': `
import Core from "./core"
import HTTP from "./http"

export default {
  install(Vue) {
    Vue.use(Core)
    Vue.use(HTTP)
  }
}
`,
      'src/extension/core/index.js': `
export default {
  install(Vue) {
    const context = require.context('./', true, /\.js$/)
    context.keys().forEach(filePath => {
      if (filePath.endsWith('index.js')) return
      
      const module = context(filePath).default
      const name = module.name || 'testModule'
      
      Object.defineProperty(Vue.prototype, \`$\${name}\`, {
        get() { return module }
      })
    })
  }
}
`,
      'src/extension/core/auth.js': 'export default { name: "auth" }',
      'src/extension/core/storage.js': 'export default { name: "storage" }',
      'src/components/index.js': `
import { importAll } from "../utils"

const context = require.context("./", false, /\.vue$/)
export default importAll(context)
`,
      'src/components/Button.vue': '<template><button>Button</button></template>',
      'src/components/Input.vue': '<template><input /></template>',
      'src/utils/index.js': `
export const importAll = (context) => {
  const modules = {}
  context.keys().forEach((filePath) => {
    const moduleName = filePath.replace(/^\.\//, '').replace(/\.vue$/, '')
    modules[moduleName] = context(filePath).default
  })
  return modules
}
`
    };
    
    // 创建文件结构
    Object.entries(projectStructure).forEach(([relativePath, content]) => {
      const fullPath = path.join(testDir, relativePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    });
    
    this.testDir = testDir;
  }
  
  static testPushIntegration() {
    console.log('测试push.js集成效果:\n');
    
    // 模拟依赖收集过程
    const testCases = [
      {
        name: 'Vue Extension Index',
        file: path.join(this.testDir, 'src/extension/index.js'),
        symbols: ['default']
      },
      {
        name: 'Vue Extension Core',
        file: path.join(this.testDir, 'src/extension/core/index.js'),
        symbols: ['default']
      },
      {
        name: 'Components Index',
        file: path.join(this.testDir, 'src/components/index.js'),
        symbols: ['Button', 'Input']
      }
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`${index + 1}. ${testCase.name}:`);
      console.log(`   文件: ${path.relative(this.testDir, testCase.file)}`);
      
      if (fs.existsSync(testCase.file)) {
        const result = contextTracker.resolveContextSymbols(testCase.file, testCase.symbols);
        
        console.log(`   类型: ${result.type}`);
        console.log(`   符号数量: ${Object.keys(result.symbolToFileMap).length}`);
        
        if (result.type === 'vue-install') {
          console.log(`   Vue Install文件: ${result.vueInstallFiles.length}个`);
          result.vueInstallFiles.forEach(file => {
            console.log(`     - ${path.relative(this.testDir, file)}`);
          });
        }
        
        if (Object.keys(result.symbolToFileMap).length > 0) {
          console.log('   符号映射:');
          Object.entries(result.symbolToFileMap).forEach(([symbol, filePath]) => {
            console.log(`     ${symbol} -> ${path.relative(this.testDir, filePath)}`);
          });
        }
      } else {
        console.log('   ✗ 文件不存在');
      }
      
      console.log('');
    });
  }
  
  static cleanupTestEnvironment() {
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
      console.log('集成测试文件已清理');
    }
  }
}

// 运行测试
if (require.main === module) {
  ContextIntegrationTest.runTest();
}

module.exports = ContextIntegrationTest;