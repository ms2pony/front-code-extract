const { RouteTracker } = require('../hooks/route-tracker');

/**
 * 测试 RouteTracker.isRouteFile 方法
 */
class RouteTrackerTest {
  static runTest() {
    console.log('=== RouteTracker.isRouteFile 测试 ===\n');
    
    // 测试路径
    const testPaths = [
      'J:\\gitlab\\ifs-eui\\src\\modules\\express\\routes\\car-management.js',
      '/src/router/index.js',
      '/src/modules/user/src/routes/user.js',
      '/src/modules/admin/routes/admin.js',
      '/src/components/Button.vue',
      '/src/utils/helper.js',
      null,
      undefined,
      ''
    ];
    
    console.log('测试路径及结果:');
    testPaths.forEach((path, index) => {
      const result = RouteTracker.isRouteFile(path);
      const pathDisplay = path === null ? 'null' : 
                          path === undefined ? 'undefined' : 
                          path === '' ? '""' : path;
      
      console.log(`${index + 1}. ${pathDisplay}`);
      console.log(`   结果: ${result ? '✓ 是路由文件' : '✗ 不是路由文件'}`);
      console.log('');
    });
    
    // 特别测试用户提供的路径
    const userPath = 'J:\\gitlab\\ifs-eui\\src\\modules\\express\\routes\\car-management.js';
    const userResult = RouteTracker.isRouteFile(userPath);
    
    console.log('=== 用户指定路径测试结果 ===');
    console.log(`路径: ${userPath}`);
    console.log(`结果: ${userResult ? '✓ 匹配成功 - 这是一个路由文件' : '✗ 匹配失败 - 这不是路由文件'}`);
    
    if (userResult) {
      console.log('匹配的模式: /\\/src\\/modules\\/[^/]+\\/routes\\//（第三个模式）');
    }
    
    console.log('\n=== 测试完成 ===');
  }
}

// 运行测试
RouteTrackerTest.runTest();