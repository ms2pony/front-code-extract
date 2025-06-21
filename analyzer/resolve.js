const path = require("path");
const fs = require("fs");
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

function resolvePath(ctx, request, type) {
  // console.log("resolvePath - ", ctx, request);

  try {
    const cleaned = request.startsWith("~") ? request.slice(1) : request;

    // 如果是裸文件名或类似 'dialogForm.scss' 这种，不是绝对路径、不是别名、不是 ./../ 开头
    const needsDotSlash =
      !cleaned.startsWith(".") &&
      !cleaned.startsWith("/") &&
      !cleaned.includes("@");
    const req = needsDotSlash ? "./" + cleaned : cleaned;

    const resolvedPath = resolver.resolveSync({}, ctx, type==='css-import' ? req : cleaned);
    // console.log("resolvePath - resolved:", resolvedPath);
    return resolvedPath;
  } catch (error) {
    console.warn(`❌ Failed to resolve '${request}' from '${ctx}'`);
    // 对于无法解析的模块，可以返回原始请求或null
    return null;
  }
}

let resolver = createResolver();

function resetResolver() {
  resolver = createResolver();
}

module.exports = { resolvePath, setAliasRoot, resetResolver };
