
const { resolvePath } = require('./resolve');

module.exports = function push(request, ctx, stack) {
  try {
    const abs = resolvePath(ctx, request);
    if (abs) stack.push(abs);
  } catch (e) {
    console.warn('Unresolved:', request, 'from', ctx);
  }
};
