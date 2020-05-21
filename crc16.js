let PRESET_VALUE = 0xFFFF;
let POLYNOMIAL = 0x8408;

const CRC16 = (pucY) => {
  let uiCrcValue = PRESET_VALUE;
  for(let i = 0; i < pucY.length; i++){
    uiCrcValue = uiCrcValue ^ (pucY[i]);
    for(let j = 0; j < 8; j++){
      if(uiCrcValue & 0x0001){
        uiCrcValue = (uiCrcValue >> 1) ^ POLYNOMIAL;
      } else {
        uiCrcValue = (uiCrcValue >> 1);
      }
    }
  }
  let buf = Buffer.from(uiCrcValue.toString(16), 'hex');
  buf = Buffer.from([buf[1], buf[0]], 'hex');
  return buf; 
};
console.log(CRC16([0x04, 0xff, 0x01]));
module.exports = { CRC16 }