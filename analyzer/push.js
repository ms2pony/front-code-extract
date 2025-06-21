const { resolvePath } = require("./resolve");

module.exports = function push(request, ctx, stack, type) {
  try {
    const abs = resolvePath(ctx, request, type);
    // if (abs) stack.push(abs);
    // console.log("在这里",abs)

    if (!abs) return;

    const judgeNodeModulesPath = abs.includes('node_modules');
    if (judgeNodeModulesPath){
      // console.log("🚫 过滤 node_modules", abs);
      return
    };

    stack.push(abs);
  } catch (e) {
    console.warn("Unresolved:", request, "from", ctx);
  }
};
