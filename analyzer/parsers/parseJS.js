
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const push = require('../collector/push');

module.exports = function parseJS(code, ctx, stack, file) {
  if (!code || !code.trim()) return;
  const ast = babel.parse(code, 
    { sourceType: 
      // 'unambiguous', 
      'module', //用module试试，看会不会有问题
      plugins: ['typescript', 'jsx'] }
  );
  traverse(ast, {
    ImportDeclaration({ node }) {
      // 提取导入的符号信息
      const symbols = [];
      if (node.specifiers) {
        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportSpecifier') {
            symbols.push(spec.imported.name);
          } else if (spec.type === 'ImportDefaultSpecifier') {
            symbols.push('default');
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            symbols.push('*');
          }
        });
      }
      
      // 传递符号信息到push函数
      push(node.source.value, ctx, stack, file, { symbols, importType: 'import' });
    },
    ExportNamedDeclaration({ node }) {
      if (node.source) {
        const symbols = [];
        if (node.specifiers) {
          node.specifiers.forEach(spec => {
            if (spec.type === 'ExportSpecifier') {
              symbols.push(spec.local.name);
            }
          });
        }
        push(node.source.value, ctx, stack, file, { symbols, importType: 'export' });
      }
    },
    CallExpression({ node }) {
      const callee = node.callee.name;
      const arg = node.arguments[0];
      if ((callee === 'require' || callee === 'import') && arg && arg.type === 'StringLiteral') {
        // require/import调用通常是整个模块导入
        push(arg.value, ctx, stack, file, { symbols: ['*'], importType: callee });
      }
    }
  });
};
