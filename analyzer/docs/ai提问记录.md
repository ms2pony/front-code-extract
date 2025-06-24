## 文本处理
创建一个文本处理的模块，用于处理特定的文本内容。
现在要实现一个功能，根据这个dependency-report.json文件中的 aliasUsage字段的内容，去匹配analyzer\config\resolver.js -> alias中的条目，生成匹配到的条目集。
并且进行排序，排序规则为越精确的匹配在前面，越模糊匹配在后面。例如 @aa/bb/cc : 'xxx' 排在 @aa/bb:'xxx'前面

## route文件处理

push.js 17-18 在这里添加一个hook，用于收集路由文件，并记录每个路由文件被引用的文件，其实就是 push.js 13-13 中的参数file。

1. 需要确定如何确定依赖是否是路由文件，可以根据依赖的绝对路径判断，写正则表达式。如果result.resolvePath匹配 **/src/router 或 **/src/modules/xx/src/routes 或 **/src/modules/xx/routes 即为路由文件

2. 实现该功能的hook应该在 route-tracker.js ，在该文件中实现一个类，并且该类中有一个map存储条目，条目key表示引用路由文件的文件路径，value为数组，存放着依赖的路由文件