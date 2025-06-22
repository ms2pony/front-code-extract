const { ModuleFederationPlugin } = require("webpack").container
const ExternalTemplateRemotesPlugin = require("./ExternalTemplateRemotesPlugin")
const deps = require("./package.json").dependencies
const { resolve, join } = require("path")
const { existsSync } = require("fs")
const PORT = 3001
const assetsDirName = `eui-${Date.now()}`

const API_ENV = process.env.API_ENV || "dev"
const targetUrl = `https://mall-${API_ENV}.3jyx.cn`

module.exports = {
  assetsDir: assetsDirName,

  publicPath:
    process.env.NODE_ENV === "production" && !process.env.DEV
      ? process.env.VUE_APP_ENV === "dev"
        ? "https://static-entry-st.3jyx.cn/zjdev-eui-app/"
        : process.env.VUE_APP_ENV === "st"
        ? "https://static-entry-st.3jyx.cn/zjst-eui-app/"
        : ["uat", "zcuat"].includes(process.env.VUE_APP_ENV)
        ? "https://static.tabe.com.cn/uat-eui-app/"
        : process.env.VUE_APP_ENV === "zjdev"
        ? "https://public-test-shop.oss-cn-shenzhen.aliyuncs.com/zjdev-eui-app/"
        : process.env.VUE_APP_ENV === "zjst"
        ? "https://public-test-shop.oss-cn-shenzhen.aliyuncs.com/zjst-eui-app/"
        : process.env.VUE_APP_ENV === "zjpre"
        ? "https://static-tg.3jyx.cn/zjpre-eui-app/"
        : process.env.VUE_APP_ENV === "zjga"
        ? "https://static-tg.3jyx.cn/zjga-eui-app/"
        : process.env.VUE_APP_ENV === "pre"
        ? "https://static.tabe.cn/pre-eui-app/"
        : "https://static.tabe.cn/ga-eui-app/"
      : "/portal",

  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "~@/style/variables.scss";`,
      },
    },
  },

  configureWebpack: {
    devtool:
      process.env.NODE_ENV === "production"
        ? "nosources-source-map"
        : "eval-cheap-module-source-map",

    resolve: {
      alias: {
        "@": resolve("src"),
        "@auth/assets": resolve("src/modules/auth/src/assets"),
        "@tender": resolve("src/modules/tender"),
        "@mall": resolve("src/modules/mall"),
        "@personalMall": resolve("src/modules/personal-mall"),
        "@supplier": resolve("src/modules/supplier"),
        "@receiptInspection": resolve("src/modules/receipt-inspection"),
        "@express": resolve("src/modules/express"),
        "@premium-service": resolve("src/modules/premium-service"),
        "@common": resolve("src/modules/common"),
        
        // 从dependency-report.txt中提取的高频使用alias
        "@financial/common/components": resolve("src/modules/financial/src/common/components"),
        "@common/constant": resolve("src/modules/common/src/constant"),
        "@common/store/types": resolve("src/modules/common/src/store/types"),
        "@common/common/utils": resolve("src/modules/common/src/common/utils"),
        "@common/common": resolve("src/modules/common/src/common"),
        "@financial/services": resolve("src/modules/financial/src/services"),
        "@financial/enum": resolve("src/modules/financial/src/enum"),
        "@common/enum": resolve("src/modules/common/src/enum"),
        "@common/extension/mixin": resolve("src/modules/common/src/extension/mixin"),
        "@tender/assets": resolve("src/modules/tender/assets"),
        "@app/tender/common/util": resolve("src/modules/tender/common/util"),
        "@financial/constant/constant": resolve("src/modules/financial/src/constant/constant"),
        "@common/common/dopUtil": resolve("src/modules/common/src/common/dopUtil"),
        "@common/extension/directive/attachment": resolve("src/modules/common/src/extension/directive/attachment"),
        "@app/tender/constant/constant": resolve("src/modules/tender/constant/constant"),
        "@financial/constant": resolve("src/modules/financial/src/constant"),
        "@app/supplier/common/corp-profile": resolve("src/modules/supplier/common/corp-profile"),
        "@app/supplier/routes/purchaser": resolve("src/modules/supplier/routes/purchaser"),
        "@auth/service": resolve("src/modules/auth/src/service"),
        "@financial/views/jrt/corp-archives-agreement-preview": resolve("src/modules/financial/src/views/jrt/corp-archives-agreement-preview"),
        "@financial/views/components/_account-list": resolve("src/modules/financial/src/views/components/_account-list"),
        "@financial/common/components/cmbc/cmbc-pay-dialog": resolve("src/modules/financial/src/common/components/cmbc/cmbc-pay-dialog"),
        "@common/constant/constant.env": resolve("src/modules/common/src/constant/constant.env"),
        "@common/service": resolve("src/modules/common/src/service"),
        "@common/common/notif-dialogs": resolve("src/modules/common/src/common/notif-dialogs"),
        "@app/tender/views/home/components/evaluation-confirm-dialog": resolve("src/modules/tender/views/home/components/evaluation-confirm-dialog"),
        "@app/tender/constant/enums/order": resolve("src/modules/tender/constant/enums/order"),
        "@financial/common/components/fund-bank-info.vue": resolve("src/modules/financial/src/common/components/fund-bank-info.vue"),
        "@supplier/assets": resolve("src/modules/supplier/assets"),
        "@financial/views/financingFactor/comps/_financing-info": resolve("src/modules/financial/src/views/financingFactor/comps/_financing-info"),
        "@common/common/date": resolve("src/modules/common/src/common/date"),
        "@financial/views/financingFactor/comps": resolve("src/modules/financial/src/views/financingFactor/comps"),
        "@common/extension/filter": resolve("src/modules/common/src/extension/filter"),
        "@app/tender/common/compute": resolve("src/modules/tender/common/compute")
      },
      symlinks: false,
    },
    plugins: [
      new ExternalTemplateRemotesPlugin(),
    ],
    cache:
      process.env.NODE_ENV === "production"
        ? false
        : {
            type: "filesystem",
            compression: "gzip",
          },
  },

  chainWebpack: (config) => {
    config.plugins.delete("prefetch")

    if (["zjdev", "zjst", "zjpre", "zjga"].includes(process.env.VUE_APP_ENV)) {
      config.plugin("html").tap((args) => {
        args[0].template = resolve("src/index-zj.html")
        return args
      })
    }

    // set svg-sprite-loader
    config.module
      .rule("svg")
      .exclude.add(resolve("src/extension/icon"))
      .end()
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/extension/icon"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]",
      })
      .end()
    // set preserveWhitespace
    config.module
      .rule("vue")
      .use("vue-loader")
      .loader("vue-loader")
      .tap((options) => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config.module
      .rule("scss")
      .oneOf("normal")
      .use("css-loader")
      .tap((options) => {
        options.modules = {
          mode: "icss",
        }
        return options
      })
      .end()

    config.resolve.extensions
      .delete(".mjs")
      .delete(".wasm")
      .delete(".jsx")
      .end()
    config.optimization.delete("splitChunks")

    process.env.NODE_ENV !== "production" &&
      config.module
        .rule("js")
        .use("cache-loader")
        .loader("cache-loader")
        .before("babel-loader")
        .end()
  },

  devServer: {
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    static: {
      directory: join(__dirname, "dist"),
    },
    proxy: {
      // "^/api/ifs": {
      //   target: `http://172.16.53.235:8005`,
      //   changeOrigin: true,
      //   pathRewrite: {
      //     '^/api/ifs': '/'
      //   }
      // },
      ...(existsSync("./proxies.js") ? require("./proxies") : {}),
      "^/api/*": {
        target: targetUrl,
        changeOrigin: true,
      },
      "^/sso": {
        target: targetUrl,
        changeOrigin: true,
      },
      "^/_next/*": {
        target: targetUrl,
        changeOrigin: true,
      },
      "^/supplier_auth": {
        target: targetUrl,
        changeOrigin: true,
      },
      "/ws": {
        ws: false,
        target: targetUrl,
        changeOrigin: true,
      },
      "^/ws/": {
        ws: true,
        target: `wss://mall-${API_ENV}.3jyx.cn`,
        changeOrigin: true,
      },
    },
    host: 'localhost',
    port: PORT,
  },

  // 为了打包效率暂时关闭了sourceMap
  // 更“正确”的生成sourceMap的方式应该是：
  // 1. 打包发布脚本有开关控制
  // 2.1 如果打开了sourceMap，需要额外设置 terserPlugin.terserOptions.sourceMap.root = http://内网地址
  // 2.2 分开push dist 和 sourceMap 到两个服务器去
  productionSourceMap: true,
}
