// generator.js
Blockly.JavaScript.forBlock['stift_start'] = function (block, generator) {
  return '';
};

Blockly.JavaScript.forBlock['stift_gehe'] = function (block, generator) {
  const steps = block.getFieldValue('STEPS');
  const dir = block.getFieldValue('DIRECTION');
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftGehe(${steps},"${dir}");\n`;
};

Blockly.JavaScript.forBlock['stift_drehe'] = function (block, generator) {
  const dir = block.getFieldValue('DIRECTION');
  const angle = block.getFieldValue('ANGLE');
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftDrehe("${dir}", ${angle});\n`;
};

Blockly.JavaScript.forBlock['stift_zustand'] = function (block, generator) {
  const state = block.getFieldValue('STATE');
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftSetzeZustand("${state}");\n`;
};

Blockly.JavaScript.forBlock['stift_farbe'] = function (block, generator) {
  const color = block.getFieldValue('COLOR');
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftSetzeFarbe("${color}");\n`;
};

Blockly.JavaScript.forBlock['stift_zufallsfarbe'] = function (block, generator) {
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftSetzeZufallsfarbe();\n`;
};

Blockly.JavaScript.forBlock['stift_breite'] = function (block, generator) {
  const width = block.getFieldValue('STEPS');
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftSetzeBreite(${width});\n`;
};

Blockly.JavaScript.forBlock['stift_sichtbarkeit'] = function (block) {
  return `highlightBlock(${JSON.stringify(block.id)});\nstiftSichtbarkeitUmschalten();\n`;
};

Blockly.JavaScript.forBlock['custom_repeat'] = function (block, generator) {
  const repeats = block.getFieldValue('TIMES');
  const branch = generator.statementToCode(block, 'DO');
  const code = `for (let i = 0; i < ${repeats}; i++) {\n${branch}}\n`;
  return code;
};
