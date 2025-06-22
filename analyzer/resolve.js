const fs = require("fs");
const path = require("path");
const { ResolverFactory, CachedInputFileSystem } = require("enhanced-resolve");
const resolverConfig = require("./resolver-config");

let aliasRoot = process.cwd();

function setAliasRoot(root) {
  aliasRoot = root;
}

function createResolver() {
  // 构建完整的alias路径
  const alias = {};
  Object.keys(resolverConfig.alias).forEach((key) => {
    alias[key] = path.join(aliasRoot, resolverConfig.alias[key]);
  });

  return ResolverFactory.createResolver({
    ...resolverConfig,
    alias,
    fileSystem: new CachedInputFileSystem(
      fs,
      resolverConfig.fileSystemOptions.cacheDuration
    ),
  });
}

// 新增函数：检测请求匹配的alias
function detectMatchedAlias(request) {
  const aliases = Object.keys(resolverConfig.alias);
  
  // 按长度降序排序，优先匹配更具体的alias
  const sortedAliases = aliases.sort((a, b) => b.length - a.length);
  
  for (const aliasKey of sortedAliases) {
    if (request.startsWith(aliasKey)) {
      // 检查是否是完整匹配（避免 @app 匹配到 @app/xxx 的情况）
      const nextChar = request[aliasKey.length];
      if (!nextChar || nextChar === '/' || nextChar === '\\') {
        return {
          alias: aliasKey,
          target: resolverConfig.alias[aliasKey],
          fullTarget: path.join(aliasRoot, resolverConfig.alias[aliasKey])
        };
      }
    }
  }
  
  return null;
}

function resolvePath(ctx, request, type) {
  try {
    let cleaned = request.startsWith("~") ? request.slice(1) : request;

    // 检测匹配的alias
    const matchedAlias = detectMatchedAlias(cleaned);

    // 如果是css代码，裸文件名或类似 'dialogForm.scss' 这种，不是绝对路径、不是别名、不是 ./../ 开头
    if(type === 'css-import'){
      const needsDotSlash =
        !cleaned.startsWith(".") &&
        !cleaned.startsWith("/") &&
        !cleaned.includes("@");
        cleaned = needsDotSlash ? "./" + cleaned : cleaned;
    }

    const resolvedPath = resolver.resolveSync({}, ctx, cleaned);
    
    return {
      resolvedPath,
      matchedAlias,
      originalRequest: request
    };
  } catch (error) {
    return {
      resolvedPath: null,
      matchedAlias: null,
      originalRequest: request,
      error
    };
  }
}

let resolver = createResolver();

function resetResolver() {
  resolver = createResolver();
}

module.exports = { resolvePath, setAliasRoot, resetResolver };
