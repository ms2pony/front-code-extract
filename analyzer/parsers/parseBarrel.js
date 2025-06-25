const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');
const { resolvePath } = require('../resolve');

/**
 * 解析barrel文件，根据导入的符号找到实际的文件路径
 * @param {string} barrelPath - barrel文件的绝对路径
 * @param {string|string[]} importedSymbols - 导入的符号名称
 * @returns {Object} - 符号到文件路径的映射
 */
function parseBarrel(barrelPath, importedSymbols) {
  const symbolToFileMap = {};
  
  try {
    if (!fs.existsSync(barrelPath)) {
      return symbolToFileMap;
    }
    
    const code = fs.readFileSync(barrelPath, 'utf-8');
    const ast = babel.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    const symbols = Array.isArray(importedSymbols) ? importedSymbols : [importedSymbols];
    const barrelDir = path.dirname(barrelPath);
    
    // 用于存储导入的符号映射（处理两步模式）
    const importMap = new Map(); // localName -> sourcePath
    
    /**
     * 使用 resolvePath 解析路径，支持别名和复杂路径处理
     * @param {string} sourcePath - 相对路径
     * @returns {string} - 解析后的绝对路径
     */
    function resolveSourcePath(sourcePath) {
      const result = resolvePath(barrelDir, sourcePath);
      return result.resolvedPath || path.resolve(barrelDir, sourcePath);
    }
    
    traverse(ast, {
      // 处理 import { Symbol } from './path'
      ImportDeclaration({ node }) {
        if (node.specifiers && node.source) {
          const sourcePath = node.source.value;
          const absoluteSourcePath = resolveSourcePath(sourcePath);
          
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportSpecifier') {
              const importedName = spec.imported.name;
              const localName = spec.local.name;
              
              // 记录导入映射（用于两步模式）
              importMap.set(localName, absoluteSourcePath);
              
              // 检查是否是我们要找的符号
              if (symbols.includes(importedName) || symbols.includes(localName)) {
                symbolToFileMap[importedName] = absoluteSourcePath;
              }
            } else if (spec.type === 'ImportDefaultSpecifier') {
              const localName = spec.local.name;
              
              // 记录默认导入映射
              importMap.set(localName, absoluteSourcePath);
              
              if (symbols.includes(localName)) {
                symbolToFileMap[localName] = absoluteSourcePath;
              }
            }
          });
        }
      },
      
      // 处理 export { Symbol } from './path'
      ExportNamedDeclaration({ node }) {
        if (node.specifiers && node.specifiers.length > 0 && node.source) {
          // 处理 export { Symbol } from './path'
          const sourcePath = node.source.value;
          const absoluteSourcePath = resolveSourcePath(sourcePath);
          
          node.specifiers.forEach(spec => {
            if (spec.type === 'ExportSpecifier') {
              const exportedName = spec.exported.name;
              const localName = spec.local.name;
              
              if (symbols.includes(exportedName) || symbols.includes(localName)) {
                symbolToFileMap[exportedName] = absoluteSourcePath;
              }
            }
          });
        } else if (node.specifiers && node.specifiers.length > 0 && !node.source) {
          // 处理独立的 export { Symbol } 语句（两步模式）
          node.specifiers.forEach(spec => {
            if (spec.type === 'ExportSpecifier') {
              const exportedName = spec.exported.name;
              const localName = spec.local.name;
              
              // 检查是否是我们要找的符号
              if (symbols.includes(exportedName)) {
                // 从导入映射中查找对应的文件路径
                const sourcePath = importMap.get(localName);
                if (sourcePath) {
                  symbolToFileMap[exportedName] = sourcePath;
                }
              }
            }
          });
        } else if (node.declaration) {
          // 处理 export const/function/class 等直接导出声明
          if (node.declaration.type === 'VariableDeclaration') {
            // 处理 export const SYMBOL = ...
            node.declaration.declarations.forEach(declarator => {
              if (declarator.id && declarator.id.name) {
                const exportedName = declarator.id.name;
                if (symbols.includes(exportedName)) {
                  // 如果是在当前文件中直接导出的，则指向当前文件
                  symbolToFileMap[exportedName] = barrelPath;
                }
              }
            });
          } else if (node.declaration.type === 'FunctionDeclaration' || 
                     node.declaration.type === 'ClassDeclaration') {
            // 处理 export function/class
            const exportedName = node.declaration.id.name;
            if (symbols.includes(exportedName)) {
              symbolToFileMap[exportedName] = barrelPath;
            }
          }
        }
      },
      
      // 处理 export * from './path' (需要进一步解析)
      ExportAllDeclaration({ node }) {
        if (node.source) {
          const sourcePath = node.source.value;
          const absoluteSourcePath = resolveSourcePath(sourcePath);
          
          // 对于export *，我们需要递归解析目标文件
          symbols.forEach(symbol => {
            if (!symbolToFileMap[symbol]) {
              symbolToFileMap[symbol] = absoluteSourcePath;
            }
          });
        }
      }
    });
    
  } catch (error) {
    console.warn(`解析barrel文件失败: ${barrelPath}`, error.message);
  }
  
  return symbolToFileMap;
}

module.exports = {
  parseBarrel
};