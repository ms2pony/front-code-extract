const GetScaffoldProcessor = require("./getScaffold")
const AliasProcessor = require("./alias")

const planInfo = {
  currentScanffoldPlan:'eui',

  scanffoldPlanMap:{
    eui:{
      plans:[
        {
          name:'getScaffold',
          phase:'create',
          point:'start',
          arguments:{
            gitUrl:'https://gitlab.cscec3b-iti.com/tancong/eui-scaffold.git'
          },
          hook: GetScaffoldProcessor.process
        },
        {
          name:'alias',
          phase:'create',
          point:'start',
          arguments:{
            configRelativePath: 'vue.config.js',
            resolConfPath:'K:\\front-code-extract\\analyzer\\config\\resolver.js',
            reportJsonPath:'K:\\front-code-extract\\analyzer\\output\\dependency-report.json'
          },
          hook: AliasProcessor.process
        }
      ]
    }
  }
}

function getPlan(planName){
  return planInfo.scanffoldPlanMap[planName]
}

module.exports = getPlan;