const { resolvePath } = require('../resolve');
const { addResolution, addFailedResolution } = require('../stats/resolve-stats');
const { routeTracker, RouteTracker } = require('../hooks/route-tracker');
const { barrelTracker, BarrelTracker } = require('../hooks/barrel-tracker');
const { contextTracker, ContextTracker } = require('../hooks/context-tracker'); // 新增

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
    
    // Context文件处理 - 新增
    if (ContextTracker.isContextFile(result.resolvedPath)) {
      // console.log(`🔄 发现context文件: ${result.resolvedPath}`);
      
      // 检查是否有符号信息
      if (symbolInfo && symbolInfo.symbols && symbolInfo.symbols.length > 0) {
        // 有符号导入的情况（原有逻辑）
        const contextResult = contextTracker.resolveContextSymbols(result.resolvedPath, symbolInfo.symbols);
        
        if (contextResult.type === 'vue-install') {
          // Vue install模式：处理所有install文件
          const installFiles = contextTracker.getVueInstallFiles(result.resolvedPath);
          installFiles.forEach(installFile => {
            if (!installFile.includes('node_modules')) {
              addResolution(result.originalRequest + '[vue-install]', result.matchedAlias, installFile, ctx);
              stack.push(installFile);
            }
          });
          
          // 处理Vue上挂载的符号
          Object.entries(contextResult.symbolToFileMap).forEach(([symbol, filePath]) => {
            if (!filePath.includes('node_modules')) {
              addResolution(result.originalRequest + `[${symbol}]`, result.matchedAlias, filePath, ctx);
              stack.push(filePath);
            }
          });
          return;
          
        } else if (contextResult.type === 'symbol-export') {
          // 符号导出模式：处理具体符号
          symbolInfo.symbols.forEach(symbol => {
            if (symbol !== '*') {
              const actualFilePath = contextTracker.getActualFilePath(result.resolvedPath, symbol);
              if (actualFilePath && !actualFilePath.includes('node_modules')) {
                addResolution(result.originalRequest + `[${symbol}]`, result.matchedAlias, actualFilePath, ctx);
                stack.push(actualFilePath);
              }
            }
          });
          return;
        }
      } else {
        // 无符号导入的情况（新增逻辑）- 处理副作用导入
        console.log(`🔄 处理无符号context文件: ${result.resolvedPath}`);
        
        // 解析context文件，获取所有相关文件
        const contextResult = contextTracker.resolveContextSymbols(result.resolvedPath, ['*']); // 使用通配符获取所有文件
        
        if (contextResult.type === 'vue-install') {
          // Vue install模式：处理所有install文件
          const installFiles = contextTracker.getVueInstallFiles(result.resolvedPath);
          installFiles.forEach(installFile => {
            if (!installFile.includes('node_modules')) {
              addResolution(result.originalRequest + '[vue-install-all]', result.matchedAlias, installFile, ctx);
              stack.push(installFile);
            }
          });
          
          // 处理Vue上挂载的所有符号
          Object.entries(contextResult.symbolToFileMap).forEach(([symbol, filePath]) => {
            if (!filePath.includes('node_modules')) {
              addResolution(result.originalRequest + `[${symbol}]`, result.matchedAlias, filePath, ctx);
              stack.push(filePath);
            }
          });
        } else {
          // 其他类型的context文件，获取所有相关文件
          const allFiles = contextTracker.getAllContextFiles(result.resolvedPath);
          allFiles.forEach(filePath => {
            if (!filePath.includes('node_modules')) {
              addResolution(result.originalRequest + '[context-all]', result.matchedAlias, filePath, ctx);
              stack.push(filePath);
            }
          });
        }
        return;
      }
    }
    
    // Barrel文件处理
    if (BarrelTracker.isBarrelFile(result.resolvedPath) && symbolInfo && symbolInfo.symbols) {
      // console.log(`📦 发现barrel文件: ${result.resolvedPath}`);
      // if(result.resolvedPath ==='J:\\gitlab\\ifs-eui\\src\\modules\\tender\\service\\pay\\index.js'){
      //   console.log("有问题文件定位",symbolInfo.symbols,file)
      // }
      
      // 对于每个导入的符号，尝试找到实际的文件
      symbolInfo.symbols.forEach(symbol => {
        if (symbol !== '*') { // 跳过namespace导入
          const actualFilePath = barrelTracker.getActualFilePath(result.resolvedPath, symbol);
          if (actualFilePath) {
            // console.log(`  🎯 符号 '${symbol}' 映射到: ${actualFilePath}`);
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
    addFailedResolution(request, ctx, e);
  }
};
