const { ContextTracker, contextTracker } = require('../hooks/context-tracker');
const { parseContext } = require('../parsers/parseContext');
const fs = require('fs');
const path = require('path');

/**
 * 测试 Context 解析功能
 */
class ContextTrackerTest {
  static runTest() {
    console.log('=== Context Tracker 测试 ===\n');
    
    // 创建测试目录
    this.setupTestFiles();
    
    // 运行各种测试
    // this.testIsContextFile();
    // this.testVueInstallMode();
    // this.testSymbolExportMode();
    this.testContextTracker();
    
    // 清理测试文件
    this.cleanupTestFiles();
    
    console.log('\n=== 测试完成 ===');
  }
  
  /**
   * 创建测试文件
   */
  static setupTestFiles() {
    const testDir = path.join(__dirname, 'context-test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Vue install 模式测试文件
    const vueInstallContent = `
import Core from "./core"
import HTTP from "./http"
import Filter from "./filter"
import Directive from "./directive"
import Component from "./component"
import ElementUI,{ Table }  from "element-ui"
import Icon from "./icon"
import Driver from "./driver/install"

ElementUI.MessageBox.setDefaults({closeOnClickModal: false})

export default {
  install(Vue) {
    Vue.use(ElementUI, { size: "small" })
    Vue.use(Core)
    Vue.use(HTTP)
    Vue.use(Filter)
    Vue.use(Directive)
    Vue.use(Component)
    Vue.use(Icon)
    Vue.use(Driver)
  },
}
`;
    
    // Vue install core 文件
    const vueInstallCoreContent = `
import _ from 'lodash'
import {FileUtil} from '../../common'

export default {
  install(Vue, options) {
    const context = require.context('./', true, /\.js$/)
    context.keys().forEach(filePath => {
      if (_.endsWith(filePath, 'index.js')) {
        return
      }
      let module = context(filePath)
      module = module.default || module
      let name = module.name
      if (!name) {
        name = FileUtil.name(filePath)
      }
      let descriptor = module
      if (module.get === undefined) {
        descriptor = {
          get() {
            return module
          }
        }
      }

      Object.defineProperty(Vue.prototype, \`$\${name}\`, descriptor)
      Object.defineProperty(Vue, _.capitalize(name), descriptor)
    })
  }
}
`;
    
    // Symbol export 模式测试文件
    const symbolExportContent = `
import { importAll } from "@common/common/utils"

const context = require.context("./", true, /\.vue$/)
export default importAll(context)
`;
    
    // 创建测试用的组件文件
    const componentFiles = {
      'ComponentA.vue': '<template><div>Component A</div></template>',
      'ComponentB.vue': '<template><div>Component B</div></template>',
      'ComponentC.vue': '<template><div>Component C</div></template>'
    };
    
    // 创建测试用的核心模块文件
    const coreModuleFiles = {
      'auth.js': 'export default { name: "auth", methods: {} }',
      'storage.js': 'export default { name: "storage", get() { return {} } }',
      'validator.js': 'export default { name: "validator", validate() {} }'
    };
    
    // 写入文件
    fs.writeFileSync(path.join(testDir, 'vue-install-index.js'), vueInstallContent);
    fs.writeFileSync(path.join(testDir, 'vue-install-core.js'), vueInstallCoreContent);
    fs.writeFileSync(path.join(testDir, 'symbol-export-index.js'), symbolExportContent);
    
    // 创建组件目录和文件
    const componentsDir = path.join(testDir, 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir);
    }
    Object.entries(componentFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(componentsDir, filename), content);
    });
    
    // 创建核心模块目录和文件
    const coreDir = path.join(testDir, 'core');
    if (!fs.existsSync(coreDir)) {
      fs.mkdirSync(coreDir);
    }
    Object.entries(coreModuleFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(coreDir, filename), content);
    });
    
    this.testDir = testDir;
  }
  
  /**
   * 测试 isContextFile 方法
   */
  static testIsContextFile() {
    console.log('=== 测试 ContextTracker.isContextFile ===\n');
    
    const testPaths = [
      'j:/gitlab/ifs-eui/src/modules/common/src/extension/index.js',
      'j:/gitlab/ifs-eui/src/modules/common/src/extension/core/index.js',
      'j:/gitlab/ifs-eui/src/modules/tender/views/5p1c/settlement/components/index.js',
      '/src/components/index.js',
      '/src/utils/install.js',
      '/src/modules/user/components/index.js',
      '/src/views/Home.vue',
      '/src/utils/helper.js',
      null,
      undefined,
      ''
    ];
    
    console.log('测试路径及结果:');
    testPaths.forEach((testPath, index) => {
      const result = ContextTracker.isContextFile(testPath);
      const pathDisplay = testPath === null ? 'null' : 
                          testPath === undefined ? 'undefined' : 
                          testPath === '' ? '""' : testPath;
      
      console.log(`${index + 1}. ${pathDisplay}`);
      console.log(`   结果: ${result ? '✓ 是context文件' : '✗ 不是context文件'}`);
      console.log('');
    });
  }
  
  /**
   * 测试 Vue Install 模式
   */
  static testVueInstallMode() {
    console.log('=== 测试 Vue Install 模式 ===\n');
    
    const vueInstallFile = path.join(this.testDir, 'vue-install-index.js');
    const vueInstallCoreFile = path.join(this.testDir, 'vue-install-core.js');
    
    console.log('1. 测试简单Vue Install文件:');
    console.log(`   文件: ${vueInstallFile}`);
    
    const result1 = parseContext(vueInstallFile, ['*']);
    console.log(`   类型: ${result1.type}`);
    console.log(`   Vue Install文件数量: ${result1.vueInstallFiles.length}`);
    console.log(`   符号映射数量: ${Object.keys(result1.symbolToFileMap).length}`);
    
    if (Object.keys(result1.symbolToFileMap).length > 0) {
      console.log('   符号映射:');
      Object.entries(result1.symbolToFileMap).forEach(([symbol, filePath]) => {
        console.log(`     ${symbol} -> ${filePath}`);
      });
    }
    console.log('');
    
    console.log('2. 测试带require.context的Vue Install文件:');
    console.log(`   文件: ${vueInstallCoreFile}`);
    
    const result2 = parseContext(vueInstallCoreFile, ['*']);
    console.log(`   类型: ${result2.type}`);
    console.log(`   Vue Install文件数量: ${result2.vueInstallFiles.length}`);
    console.log(`   符号映射数量: ${Object.keys(result2.symbolToFileMap).length}`);
    
    if (result2.contextInfo) {
      console.log(`   Context路径: ${result2.contextInfo.path}`);
      console.log(`   递归: ${result2.contextInfo.recursive}`);
      console.log(`   正则: ${result2.contextInfo.regExp}`);
    }
    
    if (Object.keys(result2.symbolToFileMap).length > 0) {
      console.log('   符号映射:');
      Object.entries(result2.symbolToFileMap).forEach(([symbol, filePath]) => {
        console.log(`     ${symbol} -> ${path.relative(this.testDir, filePath)}`);
      });
    }
    console.log('');
  }
  
  /**
   * 测试 Symbol Export 模式
   */
  static testSymbolExportMode() {
    console.log('=== 测试 Symbol Export 模式 ===\n');
    
    const symbolExportFile = path.join(this.testDir, 'symbol-export-index.js');
    
    console.log('测试importAll模式:');
    console.log(`文件: ${symbolExportFile}`);
    
    const result = parseContext(symbolExportFile, [
      'ComponentA', 'ComponentB'
      // , '*'
    ]);
    console.log(`类型: ${result.type}`);
    console.log(`符号映射数量: ${Object.keys(result.symbolToFileMap).length}`);
    
    if (result.contextInfo) {
      console.log(`Context路径: ${result.contextInfo.path}`);
      console.log(`递归: ${result.contextInfo.recursive}`);
      console.log(`正则: ${result.contextInfo.regExp}`);
    }
    
    if (Object.keys(result.symbolToFileMap).length > 0) {
      console.log('符号映射:');
      Object.entries(result.symbolToFileMap).forEach(([symbol, filePath]) => {
        console.log(`  ${symbol} -> ${path.relative(this.testDir, filePath)}`);
      });
    }
    console.log('');
  }
  
  /**
   * 测试 ContextTracker 类
   */
  static testContextTracker() {
    console.log('=== 测试 ContextTracker 类 ===\n');
    
    const vueInstallFile = path.join(this.testDir, 'vue-install-core.js');
    const symbolExportFile = path.join(this.testDir, 'symbol-export-index.js');
    
    // 测试缓存机制
    console.log('1. 测试缓存机制:');
    const start1 = Date.now();
    const result1 = contextTracker.resolveContextSymbols(vueInstallFile, ['*']);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    const result2 = contextTracker.resolveContextSymbols(vueInstallFile, ['*']);
    const time2 = Date.now() - start2;
    
    console.log(`   首次解析耗时: ${time1}ms`);
    console.log(`   缓存解析耗时: ${time2}ms`);
    console.log(`   缓存效果: ${time1 > time2 ? '✓ 有效' : '✗ 无效'}`);
    console.log('');
    
    // 测试符号查找
    console.log('2. 测试符号查找:');
    const testSymbols = ['ComponentA', 'ComponentB', 'NonExistent'];
    testSymbols.forEach(symbol => {
      const filePath = contextTracker.getActualFilePath(symbolExportFile, symbol);
      console.log(`   ${symbol}: ${filePath ? path.relative(this.testDir, filePath) : '未找到'}`);
    });
    console.log('');
    
    // 测试类型检测
    console.log('3. 测试类型检测:');
    const vueType = contextTracker.getContextType(vueInstallFile);
    const symbolType = contextTracker.getContextType(symbolExportFile);
    console.log(`   Vue Install文件类型: ${vueType}`);
    console.log(`   Symbol Export文件类型: ${symbolType}`);
    console.log('');
    
    // 测试统计信息
    console.log('4. 测试统计信息:');
    const stats = contextTracker.getStats();
    console.log(`   缓存的context文件数量: ${stats.totalContextFiles}`);
    console.log(`   缓存条目数量: ${stats.mappings.length}`);
    console.log('');
  }
  
  /**
   * 清理测试文件
   */
  static cleanupTestFiles() {
    const testDir = this.testDir;
    if (fs.existsSync(testDir)) {
      // 递归删除测试目录
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
      removeDir(testDir);
      console.log('测试文件已清理');
    }
  }
}

// 运行测试
if (require.main === module) {
  ContextTrackerTest.runTest();
}

module.exports = ContextTrackerTest;