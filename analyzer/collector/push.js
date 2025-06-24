const { resolvePath } = require('../resolve');
const { addResolution, addFailedResolution } = require('../stats/resolve-stats');
const { routeTracker, RouteTracker } = require('../hooks/route-tracker');

/**
 * 
 * @param {*} request 
 * @param {*} ctx 
 * @param {*} stack 
 * @param {String} file 依赖引用出自的文件
 * @returns 
 */
module.exports = function push(request, ctx, stack, file) {
  try {
    const result = resolvePath(ctx, request);

    // 1.这里解析result，如果依赖文件是路由文件，则溯源其引用文件
    // 2.保存该依赖文件(路由文件)
    
    // 路由文件收集 hook
    if (result && result.resolvedPath && RouteTracker.isRouteFile(result.resolvedPath)) {
      // console.log(`📍 发现路由文件引用: ${file} -> ${result.resolvedPath}`);
      routeTracker.addRouteReference(file, result.resolvedPath);
    }
    
    if (!result || !result.resolvedPath) {
      addFailedResolution(request, ctx, result?.error);
      return;
    }

    const abs = result.resolvedPath;
    const judgeNodeModulesPath = abs.includes('node_modules');
    if (judgeNodeModulesPath){
      // 记录但不添加到stack
      addResolution(result.originalRequest, result.matchedAlias, abs, ctx);
      // console.log(`🚫 过滤 node_modules: ${abs}`);
      return;
    }

    // 记录解析信息
    addResolution(result.originalRequest, result.matchedAlias, abs, ctx);
    
    stack.push(abs);
  } catch (e) {
    addFailedResolution(request, ctx, e);
  }
};
