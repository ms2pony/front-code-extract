const { resolvePath } = require('../resolve');
const { addResolution, addFailedResolution } = require('../stats/resolve-stats');
const { routeTracker, RouteTracker } = require('../hooks/route-tracker');
const { barrelTracker, BarrelTracker } = require('../hooks/barrel-tracker');

/**
 * 
 * @param {*} request 
 * @param {*} ctx 
 * @param {*} stack 
 * @param {String} file 依赖引用出自的文件
 * @param {Object} symbolInfo 符号信息 { symbols: [], importType: 'import'|'export'|'require' }
 * @returns 
 */
module.exports = function push(request, ctx, stack, file, symbolInfo = null) {
  try {
    const result = resolvePath(ctx, request);

    // 1.这里解析result，如果依赖文件是路由文件，则溯源其引用文件
    // 2.保存该依赖文件(路由文件)
    
    if (!result || !result.resolvedPath) {
      addFailedResolution(request, ctx, result?.error);
      return;
    }

    // 统一处理 node_modules 过滤 - 提前检查，避免不必要的处理
    const judgeNodeModulesPath = result.resolvedPath.includes('node_modules');
    if (judgeNodeModulesPath) {
      // 记录但不添加到stack
      addResolution(result.originalRequest, result.matchedAlias, result.resolvedPath, ctx);
      // console.log(`🚫 过滤 node_modules: ${result.resolvedPath}`);
      return;
    }
    
    // 路由文件收集 hook
    if (RouteTracker.isRouteFile(result.resolvedPath)) {
      // console.log(`📍 发现路由文件引用: ${file} -> ${result.resolvedPath}`);
      routeTracker.addRouteReference(file, result.resolvedPath);
    }

    let finalResolvedPath = result.resolvedPath;
    
    // Barrel文件处理
    if (BarrelTracker.isBarrelFile(result.resolvedPath) && symbolInfo && symbolInfo.symbols) {
      console.log(`📦 发现barrel文件: ${result.resolvedPath}`);
      
      // 对于每个导入的符号，尝试找到实际的文件
      symbolInfo.symbols.forEach(symbol => {
        if (symbol !== '*') { // 跳过namespace导入
          const actualFilePath = barrelTracker.getActualFilePath(result.resolvedPath, symbol);
          if (actualFilePath) {
            console.log(`  🎯 符号 '${symbol}' 映射到: ${actualFilePath}`);
            // 检查实际文件路径是否是 node_modules（双重保险）
            const actualFileIsNodeModules = actualFilePath.includes('node_modules');
            if (!actualFileIsNodeModules) {
              addResolution(result.originalRequest + `[${symbol}]`, result.matchedAlias, actualFilePath, ctx);
              stack.push(actualFilePath);
            }
          } else {
            console.log(`  ⚠️ 无法解析符号 '${symbol}' 在barrel文件: ${result.resolvedPath}`);
          }
        }
      });
      
      // 如果有namespace导入或无法解析的符号，仍然添加barrel文件本身
      if (symbolInfo.symbols.includes('*') || symbolInfo.symbols.length === 0) {
        finalResolvedPath = result.resolvedPath;
      } else {
        // 如果所有符号都成功解析，就不需要添加barrel文件本身
        return;
      }
    }

    // 记录解析信息
    addResolution(result.originalRequest, result.matchedAlias, finalResolvedPath, ctx);
    
    stack.push(finalResolvedPath);
  } catch (e) {
    console.log("xxx解析路径失败",e)
    addFailedResolution(request, ctx, e);
  }
};
