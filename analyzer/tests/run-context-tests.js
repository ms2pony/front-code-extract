const ContextTrackerTest = require('./test-context-tracker');
const ContextIntegrationTest = require('./test-context-integration');
const ContextPerformanceTest = require('./test-context-performance');

/**
 * Context 测试运行器
 */
class ContextTestRunner {
  static runAllTests() {
    console.log('🧪 开始运行 Context 相关测试\n');
    console.log('='.repeat(60));
    
    try {
      // 基础功能测试
      console.log('\n📋 运行基础功能测试...');
      ContextTrackerTest.runTest();
      
      console.log('\n' + '='.repeat(60));
      
      // 集成测试
      console.log('\n🔗 运行集成测试...');
      ContextIntegrationTest.runTest();
      
      console.log('\n' + '='.repeat(60));
      
      // 性能测试
      console.log('\n⚡ 运行性能测试...');
      ContextPerformanceTest.runTest();
      
      console.log('\n' + '='.repeat(60));
      console.log('\n✅ 所有测试完成！');
      
    } catch (error) {
      console.error('\n❌ 测试过程中发生错误:', error);
      process.exit(1);
    }
  }
  
  static runSpecificTest(testName) {
    const tests = {
      'basic': ContextTrackerTest,
      'integration': ContextIntegrationTest,
      'performance': ContextPerformanceTest
    };
    
    const TestClass = tests[testName];
    if (TestClass) {
      console.log(`🧪 运行 ${testName} 测试...\n`);
      TestClass.runTest();
    } else {
      console.error(`❌ 未知的测试名称: ${testName}`);
      console.log('可用的测试: basic, integration, performance');
    }
  }
}

// 命令行运行
if (require.main === module) {
  const testName = process.argv[2];
  
  if (testName) {
    ContextTestRunner.runSpecificTest(testName);
  } else {
    ContextTestRunner.runAllTests();
  }
}

module.exports = ContextTestRunner;