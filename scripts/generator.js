
Blockly.JavaScript.forBlock['stift_gehe'] = function (block, generator) {
  const steps = block.getFieldValue('STEPS');
  const dir = block.getFieldValue('DIRECTION');
  return `stiftGehe(${steps},"${dir}");\n`;
};
Blockly.JavaScript.forBlock['stift_start'] = function (block, generator) {
  return generator.statementToCode(block, 'NEXT');
};
Blockly.JavaScript.forBlock['stift_drehe'] = function (block, generator) {
  const dir = block.getFieldValue('DIRECTION');
  const angle = block.getFieldValue('ANGLE');
  return `stiftDrehe("${dir}", ${angle});\n`;
};
Blockly.JavaScript.forBlock['stift_zustand'] = function (block, generator) {
  const state = block.getFieldValue('STATE');
  return `stiftSetzeZustand("${state}");\n`;
};
Blockly.JavaScript.forBlock['stift_farbe'] = function (block, generator) {
  const color = block.getFieldValue('COLOR');
  return `stiftSetzeFarbe("${color}");\n`;
};
Blockly.JavaScript.forBlock['stift_zufallsfarbe'] = function (block, generator) {
  return `stiftSetzeZufallsfarbe();\n`;
};

Blockly.JavaScript.forBlock['stift_breite'] = function (block, generator) {
  const width = block.getFieldValue('STEPS');
  return `stiftSetzeBreite(${width});\n`;
};
Blockly.JavaScript.forBlock['stift_sichtbarkeit'] = function (block) {
  return `stiftSichtbarkeitUmschalten();\n`;
};
Blockly.JavaScript.forBlock['custom_repeat'] = function (block, generator) {
  const repeats = block.getFieldValue('TIMES');
  const branch = generator.statementToCode(block, 'DO');
  const code = `for (let i = 0; i < ${repeats}; i++) {\n${branch}}\n`;
  return code;
};
