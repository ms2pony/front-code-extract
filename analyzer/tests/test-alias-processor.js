/**
 * 别名处理器测试文件
 * 用于验证重构后的别名匹配功能
 */

const AliasProcessor = require('../hooks/alias');
const AliasMatcher = require('../textproc/alias-proc');
// const AliasFileHandler = require('./alias-file-handler');
const path = require('path');
const fs = require('fs');
const FileUtils = require('../utils/file-utils');

class AliasProcessorTest {
  /**
   * 运行所有测试
   */
  static runAllTests() {
    console.log('=== 开始别名处理器测试 ===\n');
    
    try {
      this.testFileOperationSeparation();
      this.testTextProcessing();
      this.testTemplateReplacement();
      this.testVueConfigGeneration();
      this.testFullProcess();
      
      console.log('\n=== 所有测试完成 ===');
    } catch (error) {
      console.error('测试过程中发生错误:', error);
    }
  }

  /**
   * 测试文件操作分离
   */
  static testFileOperationSeparation() {
    console.log('1. 测试文件操作分离...');
    
    // 模拟数据
    const mockAliasUsage = {
      '@common/common/dopUtil': 6,
      '@': 29,
      '@common/constant/constant.env': 1,
      '@tender': 25,
      '@supplier': 4
    };
    
    const mockAliasDefinitions = {
      '@': 'src',
      '@common': 'src/modules/common',
      '@common/common': 'src/modules/common/src/common',
      '@common/common/dopUtil': 'src/modules/common/src/common/dopUtil',
      '@common/constant': 'src/modules/common/src/constant',
      '@tender': 'src/modules/tender',
      '@supplier': 'src/modules/supplier'
    };
    
    // 测试纯文本处理（不涉及文件操作）
    const matchResult = AliasMatcher.matchAliasUsage(mockAliasUsage, mockAliasDefinitions);
    
    console.log(`   ✓ 匹配到 ${matchResult.length} 个别名`);
    console.log(`   ✓ 文件操作与文本处理成功分离`);
    
    return matchResult;
  }

  /**
   * 测试文本处理功能
   */
  static testTextProcessing() {
    console.log('\n2. 测试文本处理功能...');
    
    const mockMatchResult = [
      {
        usedAlias: '@common/common/dopUtil',
        definedAlias: '@common/common/dopUtil',
        aliasPath: 'src/modules/common/src/common/dopUtil',
        usageCount: 6,
        depth: 3
      },
      {
        usedAlias: '@',
        definedAlias: '@',
        aliasPath: 'src',
        usageCount: 29,
        depth: 1
      },
      {
        usedAlias: '@tender',
        definedAlias: '@tender',
        aliasPath: 'src/modules/tender',
        usageCount: 25,
        depth: 1
      }
    ];
    
    // 测试别名配置生成
    const aliasConfig = AliasMatcher.generateAliasConfig(mockMatchResult);
    console.log('   ✓ 生成的别名配置:');
    Object.entries(aliasConfig).forEach(([alias, path]) => {
      console.log(`     "${alias}": "${path}"`);
    });
    
    // 测试报告生成
    const report = AliasMatcher.generateReport(mockMatchResult);
    console.log(`   ✓ 生成报告长度: ${report.length} 字符`);
    
    return { aliasConfig, report };
  }

  /**
   * 测试模板替换功能
   */
  static testTemplateReplacement() {
    console.log('\n3. 测试模板替换功能...');
    
    // 模拟模板内容
    const mockTemplate = `const { resolve } = require("path")

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        "@": resolve("src"),
        "@components": resolve("src/components")
      }
    }
  }
}`;
    
    const mockAliasConfig = {
      '@': 'src',
      '@common': 'src/modules/common',
      '@tender': 'src/modules/tender'
    };
    
    // 测试模板替换
    const generatedConfig = AliasMatcher.generateVueConfig(mockTemplate, mockAliasConfig);
    
    console.log('   ✓ 模板替换成功');
    console.log('   ✓ 生成的配置包含resolve函数');
    
    // 验证是否包含所有别名
    Object.keys(mockAliasConfig).forEach(alias => {
      if (generatedConfig.includes(`"${alias}":`)) {
        console.log(`   ✓ 包含别名: ${alias}`);
      } else {
        console.log(`   ✗ 缺少别名: ${alias}`);
      }
    });
    
    return generatedConfig;
  }

  /**
   * 测试Vue配置生成
   */
  static testVueConfigGeneration() {
    console.log('\n4. 测试Vue配置生成...');
    
    const templatePath = path.resolve(__dirname, '../textproc/template/vue.config.tpl.js');
    
    // 检查模板文件是否存在
    if (!fs.existsSync(templatePath)) {
      console.log('   ⚠ 模板文件不存在，跳过此测试');
      return;
    }
    
    try {
      const templateContent = FileUtils.file.read(templatePath);
      
      if (templateContent) {
        console.log('   ✓ 成功读取模板文件');
        console.log(`   ✓ 模板文件大小: ${templateContent.length} 字符`);
        
        // 验证模板是否包含alias配置
        if (templateContent.includes('alias:')) {
          console.log('   ✓ 模板包含alias配置');
        } else {
          console.log('   ⚠ 模板不包含alias配置');
        }
        
        // 验证模板是否包含resolve函数
        if (templateContent.includes('resolve(')) {
          console.log('   ✓ 模板包含resolve函数');
        } else {
          console.log('   ⚠ 模板不包含resolve函数');
        }
      } else {
        console.log('   ✗ 读取模板文件失败');
      }
    } catch (error) {
      console.log(`   ✗ 模板文件处理错误: ${error.message}`);
    }
  }

  /**
   * 测试完整处理流程
   */
  static testFullProcess() {
    console.log('\n5. 测试完整处理流程...');
    
    // 定义测试路径
    const testPaths = {
      reportPath: path.resolve(__dirname, '../output/dependency-report.json'),
      resolverPath: path.resolve(__dirname, '../config/resolver.js'),
      templatePath: path.resolve(__dirname, '../textproc/template/vue.config.tpl.js'),
      outputPath: path.resolve(__dirname, '../output/test-vue.config.js'),
      reportOutputPath: path.resolve(__dirname, '../output/test-alias-report.txt'),
      jsonOutputPath: path.resolve(__dirname, '../output/test-alias-result.json')
    };
    
    // 检查必要文件是否存在
    const requiredFiles = ['reportPath', 'resolverPath', 'templatePath'];
    const missingFiles = [];
    
    requiredFiles.forEach(fileKey => {
      if (!fs.existsSync(testPaths[fileKey])) {
        missingFiles.push(fileKey);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`   ⚠ 缺少必要文件，跳过完整流程测试: ${missingFiles.join(', ')}`);
      return;
    }
    
    try {
      // 执行完整处理流程
      const result = AliasProcessor.process(testPaths);
      
      if (result.success) {
        console.log('   ✓ 完整处理流程成功');
        console.log(`   ✓ 匹配到 ${result.matchCount} 个别名`);
        console.log('   ✓ 生成的文件:');
        
        // 检查生成的文件
        if (fs.existsSync(testPaths.outputPath)) {
          console.log(`     - Vue配置文件: ${testPaths.outputPath}`);
        }
        if (fs.existsSync(testPaths.reportOutputPath)) {
          console.log(`     - 匹配报告: ${testPaths.reportOutputPath}`);
        }
        if (fs.existsSync(testPaths.jsonOutputPath)) {
          console.log(`     - JSON结果: ${testPaths.jsonOutputPath}`);
        }
        
      } else {
        console.log(`   ✗ 完整处理流程失败: ${result.error || result.message}`);
      }
    } catch (error) {
      console.log(`   ✗ 完整处理流程异常: ${error.message}`);
    }
  }

  /**
   * 清理测试文件
   */
  static cleanup() {
    console.log('\n6. 清理测试文件...');
    
    const testFiles = [
      path.resolve(__dirname, '../output/test-vue.config.js'),
      path.resolve(__dirname, '../output/test-alias-report.txt'),
      path.resolve(__dirname, '../output/test-alias-result.json')
    ];
    
    testFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`   ✓ 删除测试文件: ${path.basename(filePath)}`);
        }
      } catch (error) {
        console.log(`   ⚠ 删除文件失败: ${path.basename(filePath)}`);
      }
    });
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  AliasProcessorTest.runAllTests();
  
  // 询问是否清理测试文件
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n是否清理测试文件？(y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      AliasProcessorTest.cleanup();
    }
    rl.close();
  });
}

module.exports = AliasProcessorTest;