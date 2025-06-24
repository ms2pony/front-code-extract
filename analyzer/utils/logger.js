class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    console.log(`ℹ️ ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  warn(message) {
    console.warn(`⚠️ ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  debug(message) {
    if (this.verbose) {
      console.log(`🔍 ${message}`);
    }
  }

  // 配置错误的专用方法
  configError(section, details) {
    this.error(`${section}配置不完整!`);
    console.error(details);
  }
}

module.exports = Logger;