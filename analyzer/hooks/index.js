const AliasProcessor = require("./alias")

const planInfo = {
  currentScanffoldPlan:'',

  scanffoldPlanMap:{
    eui:{
      gitUrl:'https://gitlab.cscec3b-iti.com/tancong/eui-scaffold.git',
      plans:[
        {
          name:'getScaffold',
          phase:'create',
          point:'start',
          // hook:
        },
        {
          name:'alias',
          phase:'create',
          point:'start',
          hook: AliasProcessor
        }
      ]
    }
  }
}

module.exports = function getPlan(planName){
  return planInfo.scanffoldPlanMap[planName]
}