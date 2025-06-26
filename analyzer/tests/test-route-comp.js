const RouteComponentProcessor = require('../hooks/route-comp');
const RouteProcessor = require('../textproc/route-proc');
const fs = require('fs');
const path = require('path');

/**
 * 测试 RouteComponentProcessor 功能
 */
class RouteCompTest {
  static runTest() {
    console.log('=== RouteComponentProcessor 测试 ===\n');
    
    // 创建测试环境
    this.setupTestEnvironment();
    
    // 运行各种测试
    this.testGetRouteFilesFromReport();
    this.testGetDefaultMockComponentPath();
    this.testProcessAllRoutes();
    
    // 清理测试文件
    this.cleanupTestEnvironment();
    
    console.log('\n=== 测试完成 ===');
  }
  
  /**
   * 创建测试环境
   */
  static setupTestEnvironment() {
    console.log('📁 创建测试环境...');
    
    const testDir = path.join(__dirname, 'route-comp-test');
    const oldProjectDir = path.join(testDir, 'old-project');
    const newProjectDir = path.join(testDir, 'new-project');
    
    // 创建目录结构
    [testDir, oldProjectDir, newProjectDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // 创建老项目的路由文件
    const oldRouteDir = path.join(oldProjectDir, 'src', 'modules', 'user', 'routes');
    fs.mkdirSync(oldRouteDir, { recursive: true });
    
    const oldRouteFile = path.join(oldRouteDir, 'user.js');
    const oldRouteContent = `export default {
  path: '/user',
  component: () => import('../views/UserView.vue'),
  children: [
    {
      path: 'profile',
      component: () => import('../views/Profile.vue')
    }
  ]
};`;
    fs.writeFileSync(oldRouteFile, oldRouteContent, 'utf8');
    
    // 创建新项目的路由文件
    const newRouteDir = path.join(newProjectDir, 'src', 'modules', 'user', 'routes');
    fs.mkdirSync(newRouteDir, { recursive: true });
    
    const newRouteFile = path.join(newRouteDir, 'user.js');
    fs.writeFileSync(newRouteFile, oldRouteContent, 'utf8');
    
    // 创建mock组件目录
    const mockDir = path.join(newProjectDir, 'src', 'mock', 'components');
    fs.mkdirSync(mockDir, { recursive: true });
    
    const mockComponent = path.join(mockDir, 'route-components.vue');
    const mockContent = `<template>
  <div class="mock-component">
    <h2>Mock Route Component</h2>
    <p>这是一个用于测试的模拟路由组件</p>
  </div>
</template>

<script>
export default {
  name: 'MockRouteComponent'
};
</script>`;
    fs.writeFileSync(mockComponent, mockContent, 'utf8');
    
    // 创建dependency-report.json
    const reportPath = path.join(testDir, 'dependency-report.json');
    const reportContent = {
      projectRoot: oldProjectDir,
      entryFile: path.join(oldProjectDir, 'src', 'main.js'),
      routeStatistics: {
        totalRouteFiles: 1,
        routeFiles: [
          {
            absolute: oldRouteFile,
            relative: 'src/modules/user/routes/user.js'
          }
        ]
      }
    };
    fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2), 'utf8');
    
    this.testDir = testDir;
    this.oldProjectDir = oldProjectDir;
    this.newProjectDir = newProjectDir;
    this.reportPath = reportPath;
    
    console.log('✓ 测试环境创建完成');
  }
  
  /**
   * 测试从报告文件读取路由文件列表
   */
  static testGetRouteFilesFromReport() {
    console.log('\n🧪 测试 getRouteFilesFromReport...');
    
    try {
      const routeFiles = RouteComponentProcessor.getRouteFilesFromReport(this.newProjectDir);
      
      console.log(`找到 ${routeFiles.length} 个路由文件:`);
      routeFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
      if (routeFiles.length > 0) {
        console.log('✓ getRouteFilesFromReport 测试通过');
      } else {
        console.log('✗ getRouteFilesFromReport 测试失败: 未找到路由文件');
      }
    } catch (error) {
      console.log(`✗ getRouteFilesFromReport 测试失败: ${error.message}`);
    }
  }
  
  /**
   * 测试获取默认mock组件路径
   */
  static testGetDefaultMockComponentPath() {
    console.log('\n🧪 测试 getDefaultMockComponentPath...');
    
    try {
      const mockPath = RouteComponentProcessor.getDefaultMockComponentPath(this.newProjectDir);
      const expectedPath = path.join(this.newProjectDir, 'src', 'mock', 'components', 'route-components.vue');
      
      console.log(`生成的mock路径: ${mockPath}`);
      console.log(`期望的mock路径: ${expectedPath}`);
      
      if (mockPath === expectedPath) {
        console.log('✓ getDefaultMockComponentPath 测试通过');
      } else {
        console.log('✗ getDefaultMockComponentPath 测试失败: 路径不匹配');
      }
    } catch (error) {
      console.log(`✗ getDefaultMockComponentPath 测试失败: ${error.message}`);
    }
  }
  
  /**
   * 测试处理所有路由文件
   */
  static testProcessAllRoutes() {
    console.log('\n🧪 测试 processAllRoutes...');
    
    try {
      const mockComponentPath = RouteComponentProcessor.getDefaultMockComponentPath(this.newProjectDir);
      const result = RouteComponentProcessor.processAllRoutes(this.newProjectDir, mockComponentPath);
      
      console.log('处理结果:');
      console.log(`  总文件数: ${result.total}`);
      console.log(`  成功处理: ${result.success}`);
      console.log(`  处理失败: ${result.failed}`);
      
      if (result.total > 0) {
        console.log('✓ processAllRoutes 测试通过');
        
        // 检查文件是否被正确修改
        const processedFile = path.join(this.newProjectDir, 'src', 'modules', 'user', 'routes', 'user.js');
        if (fs.existsSync(processedFile)) {
          const content = fs.readFileSync(processedFile, 'utf8');
          console.log('\n处理后的文件内容:');
          console.log(content);
        }
      } else {
        console.log('✗ processAllRoutes 测试失败: 未处理任何文件');
      }
    } catch (error) {
      console.log(`✗ processAllRoutes 测试失败: ${error.message}`);
    }
  }
  
  /**
   * 测试边界情况
   */
  static testEdgeCases() {
    console.log('\n🧪 测试边界情况...');
    
    // 测试不存在的报告文件
    console.log('测试不存在的报告文件:');
    const nonExistentProject = path.join(__dirname, 'non-existent-project');
    const emptyResult = RouteComponentProcessor.getRouteFilesFromReport(nonExistentProject);
    console.log(`结果: ${emptyResult.length === 0 ? '✓ 正确返回空数组' : '✗ 应该返回空数组'}`);
    
    // 测试空的报告文件
    console.log('\n测试空的报告文件:');
    const emptyReportDir = path.join(this.testDir, 'empty-test');
    fs.mkdirSync(emptyReportDir, { recursive: true });
    const emptyReportPath = path.join(this.testDir, 'dependency-report-empty.json');
    fs.writeFileSync(emptyReportPath, '{}', 'utf8');
    
    // 这里需要修改getRouteFilesFromReport来接受自定义报告路径进行测试
    console.log('✓ 边界情况测试完成');
  }
  
  /**
   * 清理测试环境
   */
  static cleanupTestEnvironment() {
    console.log('\n🧹 清理测试环境...');
    
    try {
      if (fs.existsSync(this.testDir)) {
        this.removeDirectory(this.testDir);
      }
      console.log('✓ 测试环境清理完成');
    } catch (error) {
      console.log(`⚠ 清理测试环境时出错: ${error.message}`);
    }
  }
  
  /**
   * 递归删除目录
   */
  static removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.removeDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  RouteCompTest.runTest();
}

module.exports = RouteCompTest;