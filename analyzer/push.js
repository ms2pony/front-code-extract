const { resolvePath } = require('./resolve');
const { addResolution, addFailedResolution } = require('./resolve-stats');

module.exports = function push(request, ctx, stack, type) {
  try {
    const result = resolvePath(ctx, request, type);
    
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
