## 文本处理
创建一个文本处理的模块，用于处理特定的文本内容。
现在要实现一个功能，根据这个dependency-report.json文件中的 aliasUsage字段的内容，去匹配analyzer\config\resolver.js -> alias中的条目，生成匹配到的条目集。
并且进行排序，排序规则为越精确的匹配在前面，越模糊匹配在后面。例如 @aa/bb/cc : 'xxx' 排在 @aa/bb:'xxx'前面