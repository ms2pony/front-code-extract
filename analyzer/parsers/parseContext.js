const babel = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");
const path = require("path");

/**
 * 解析require.context文件，分析动态导入的符号映射
 * @param {string} contextFilePath - 包含require.context的文件路径
 * @param {string|string[]} importedSymbols - 导入的符号名称
 * @returns {Object} - 符号到文件路径的映射和类型信息
 */
function parseContext(contextFilePath, importedSymbols) {
  const result = {
    type: "unknown", // 'vue-install' | 'symbol-export' | 'unknown'
    symbolToFileMap: {},
    vueInstallFiles: [], // 对于vue install类型，记录所有install文件
    contextInfo: null,
  };

  try {
    if (!fs.existsSync(contextFilePath)) {
      return result;
    }

    const code = fs.readFileSync(contextFilePath, "utf-8");
    const ast = babel.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const symbols = Array.isArray(importedSymbols)
      ? importedSymbols
      : [importedSymbols];
    const contextDir = path.dirname(contextFilePath);

    // 分析require.context调用和install函数
    const contextCalls = [];
    let isVueInstallFile = false;

    traverse(ast, {
      // 检测export default模式中的install方法
      ExportDefaultDeclaration({ node }) {
        console.log("Export入口");
        if (node.declaration.type === "ObjectExpression") {
          // 检查是否有install方法
          const hasInstall = node.declaration.properties.some(
            (prop) => prop.key && prop.key.name === "install"
          );
          if (hasInstall) {
            result.type = "vue-install";
            isVueInstallFile = true;
          }
        } else if (node.declaration.type === "CallExpression") {
          // 检查是否是importAll调用
          if (node.declaration.callee.name === "importAll") {
            result.type = "symbol-export";
          }
        }
      },

      // 在install函数体内扫描require.context调用，但是不能匹配对象方法，比如export default { install(){} }
      FunctionExpression({ node, parent }) {
        // 检查是否是install函数
        if (parent.type === "Property" && parent.key.name === "install") {
          // 在install函数体内查找require.context调用
          console.log("进到FunctionExpression -- vue install里面");
          traverse(
            node,
            {
              CallExpression({ node: callNode }) {
                // 检测 require.context 调用
                if (
                  callNode.callee.type === "MemberExpression" &&
                  callNode.callee.object.name === "require" &&
                  callNode.callee.property.name === "context"
                ) {
                  const args = callNode.arguments;
                  if (args.length >= 2) {
                    const directory = args[0].value || "./";
                    const recursive = args[1].value !== false;
                    const regExp = args[2] ? args[2].raw : "/.js$/";

                    contextCalls.push({
                      directory,
                      recursive,
                      regExp,
                      node: callNode,
                    });

                    result.type = "vue-install";
                    isVueInstallFile = true;
                  }
                }
                // 忽略Vue.use调用，不做处理
              },
            },
            node.scope
          );
        }
      },

      // 也检查顶层的require.context调用
      CallExpression({ node }) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "require" &&
          node.callee.property.name === "context"
        ) {
          const args = node.arguments;
          // console.log("Call根入口 ->CallExpression -> MemberExpression -> require",args);
          if (args.length >= 2) {
            const directory = args[0].value || "./";
            const recursive = args[1].value !== false;
            const regExp = args[2] ? args[2].extra.raw : "/.js$/";

            contextCalls.push({
              directory,
              recursive,
              regExp,
              node,
            });
          }
        }
      },

      // 添加新的访问器来处理对象方法
      // Method({ node, scope, path }) {
      //   // 检查是否是install方法
      //   if (node.key.name === "install") {
      //     // 在install函数体内查找require.context调用
      //     console.log("进到Method -- vue install里面");
      //     traverse(
      //       node,
      //       {
      //         CallExpression({ node: callNode }) {
      //           // 检测 require.context 调用
      //           if (
      //             callNode.callee.type === "MemberExpression" &&
      //             callNode.callee.object.name === "require" &&
      //             callNode.callee.property.name === "context"
      //           ) {
      //             const args = callNode.arguments;
      //             if (args.length >= 2) {
      //               const directory = args[0].value || "./";
      //               const recursive = args[1].value !== false;
      //               const regExp = args[2] ? args[2].extra.raw : "/.js$/";

      //               // console.log("callNode", args);

      //               contextCalls.push({
      //                 directory,
      //                 recursive,
      //                 regExp,
      //                 node: callNode,
      //               });

      //               result.type = "vue-install";
      //               isVueInstallFile = true;
      //             }
      //           }
      //           // 忽略Vue.use调用，不做处理
      //         },
      //       },
      //       scope,
      //       path
      //     ); // 传入scope和path参数
      //   }
      // },
    });

    // console.log("收集了的contextCalls", contextCalls)

    // 处理找到的context调用
    for (const contextCall of contextCalls) {
      const contextPath = path.resolve(contextDir, contextCall.directory);
      result.contextInfo = {
        path: contextPath,
        recursive: contextCall.recursive,
        regExp: contextCall.regExp,
      };

      // console.log("for -- contextCall",contextCall)
      // console.log("for -- contextPath",contextPath)

      if (result.type === "vue-install") {
        // Vue install模式：分析所有匹配的文件
        const files = scanContextFiles(
          contextPath,
          contextCall.recursive,
          contextCall.regExp
        );
        console.log("vue-install - files", files);
        result.vueInstallFiles = files;

        // 分析每个文件，使用类似FileUtil.name的逻辑解析符号
        for (const file of files) {
          const fileName = getFileNameWithoutExtension(file);
          const symbolName = `$${fileName}`; // 类似Vue原型上的符号
          result.symbolToFileMap[symbolName] = file;
        }
      } else if (result.type === "symbol-export") {
        // 符号导出模式：分析importAll逻辑
        const files = scanContextFiles(
          contextPath,
          contextCall.recursive,
          contextCall.regExp
        );

        console.log("循环前symbols检查",symbols)
        for (const file of files) {
          const fileName = getFileNameWithoutExtension(file);
          const componentName = transformComponentName(fileName);

          // console.log("循环中componentName查看",componentName)
          // 检查是否是请求的符号
          if (symbols.includes(componentName) || symbols.includes("*")) {
            result.symbolToFileMap[componentName] = file;
          }
        }
      }
    }
  } catch (error) {
    console.warn(`解析context文件失败: ${contextFilePath}`, error.message);
  }

  return result;
}

/**
 * 获取文件名（不含扩展名），类似FileUtil.name的实现，用于获取vue插件符号
 * @param {string} filePath - 文件路径
 * @returns {string} - 文件名（不含扩展名）
 */
function getFileNameWithoutExtension(filePath) {
  let filename = path.basename(filePath);
  const i = filename.indexOf(".");
  if (i < 0) {
    return filename;
  }
  return filename.substr(0, i);
}

/**
 * 扫描context目录下的文件
 * @param {string} contextPath - context目录路径
 * @param {boolean} recursive - 是否递归
 * @param {string} regExpStr - 正则表达式字符串
 * @returns {string[]} - 匹配的文件路径数组
 */
function scanContextFiles(contextPath, recursive, regExpStr) {
  const files = [];

  try {
    if (!fs.existsSync(contextPath)) {
      return files;
    }

    // console.log("进入scanContextFiles -> regExpStr", regExpStr);
    // 解析正则表达式
    const regExpMatch = regExpStr.match(/\/(.*)\/([gimuy]*)$/);
    const pattern = regExpMatch
      ? regExpMatch[1]
      : regExpStr.replace(/[\/]/g, "");
    const flags = regExpMatch ? regExpMatch[2] : "";
    const regExp = new RegExp(pattern, flags);

    function scanDir(dir, currentDepth = 0) {
      // console.log("scanDir -> ", contextPath, recursive, regExpStr);

      const entries = fs.readdirSync(dir);
      console.log("scanDir -> entries", entries);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && recursive) {
          scanDir(fullPath, currentDepth + 1);
        } else if (stat.isFile()) {
          const relativePath =
            "./" + path.relative(contextPath, fullPath).replace(/\\/g, "/");
          if (regExp.test(relativePath)) {
            files.push(fullPath);
          }
        }
      }
    }

    scanDir(contextPath);
  } catch (error) {
    console.warn(`扫描context目录失败: ${contextPath}`, error.message);
  }

  return files;
}

/**
 * 分析Vue install文件，提取挂载到Vue上的符号
 * @param {string} filePath - Vue install文件路径
 * @returns {Object} - 符号到文件路径的映射
 */
function analyzeVueInstallFile(filePath) {
  const symbolMap = {};

  try {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = babel.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      // 分析 Object.defineProperty(Vue.prototype, `$${name}`, descriptor)
      CallExpression({ node }) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "Object" &&
          node.callee.property.name === "defineProperty"
        ) {
          const args = node.arguments;
          if (
            args.length >= 3 &&
            args[0].type === "MemberExpression" &&
            args[0].object.name === "Vue" &&
            args[0].property.name === "prototype"
          ) {
            // 提取属性名
            let propName = null;
            if (args[1].type === "TemplateLiteral") {
              // `$${name}` 模式
              const quasi = args[1].quasis[0];
              if (quasi && quasi.value.raw.startsWith("$")) {
                // 需要进一步分析name变量的值
                propName = extractVariableValue(ast, args[1]);
              }
            } else if (args[1].type === "StringLiteral") {
              propName = args[1].value;
            }

            if (propName) {
              symbolMap[propName] = filePath;
            }
          }
        }

        // 分析 Vue.use() 调用
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "Vue" &&
          node.callee.property.name === "use"
        ) {
          const arg = node.arguments[0];
          if (arg && arg.name) {
            // 记录Vue.use的模块
            symbolMap[`Vue.use(${arg.name})`] = filePath;
          }
        }
      },
    });
  } catch (error) {
    console.warn(`分析Vue install文件失败: ${filePath}`, error.message);
  }

  return symbolMap;
}

/**
 * 提取模板字面量中的变量值
 * @param {Object} ast - AST对象
 * @param {Object} templateLiteral - 模板字面量节点
 * @returns {string|null} - 提取的值
 */
function extractVariableValue(ast, templateLiteral) {
  // 简化实现：查找变量声明
  let variableName = null;

  if (templateLiteral.expressions && templateLiteral.expressions[0]) {
    variableName = templateLiteral.expressions[0].name;
  }

  if (!variableName) return null;

  // 在AST中查找变量声明
  let variableValue = null;
  traverse(ast, {
    VariableDeclarator({ node }) {
      if (node.id.name === variableName && node.init) {
        if (node.init.type === "StringLiteral") {
          variableValue = node.init.value;
        } else if (node.init.type === "CallExpression") {
          // 处理 FileUtil.name(filePath) 等调用
          variableValue = `dynamic_${variableName}`;
        }
      }
    },
  });

  return variableValue ? `$${variableValue}` : null;
}

/**
 * 转换组件名称（模拟importAll中的transformComponentName）
 * @param {string} fileName - 文件名
 * @returns {string} - 转换后的组件名
 */
function transformComponentName(fileName) {
  // 移除扩展名
  const nameWithoutExt = fileName.replace(/\.[^.]*$/, "");
  
  // 如果包含连字符或下划线，才进行分割和转换
  if (nameWithoutExt.includes('-') || nameWithoutExt.includes('_')) {
    return nameWithoutExt
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
  }
  
  // 否则直接返回（保持原有大小写）
  return nameWithoutExt;
}

module.exports = {
  parseContext,
};
