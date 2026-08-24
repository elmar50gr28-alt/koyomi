import { EARTHQUAKE_FORECAST_FLAGS } from './config.js';

export function actionLevelFor({riskScore=0,officialInformation=false,displayAllowed=false},flags=EARTHQUAKE_FORECAST_FLAGS){
  if(officialInformation?.active===true&&['JMA','local-government'].includes(officialInformation.provider))return 3;
  if(!displayAllowed)return 0;
  if(riskScore>=75&&flags.actionLevel2Enabled)return 2;
  if(riskScore>=50&&flags.actionLevel1Enabled)return 1;
  return 0;
}
