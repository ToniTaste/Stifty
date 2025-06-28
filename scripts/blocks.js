// blocks.js

const DEFAULT_PEN_COLOR = window.DEFAULT_PEN_COLOR;
const DEFAULT_PEN_WIDTH = window.DEFAULT_PEN_WIDTH;

registerFieldColour();
Blockly.defineBlocksWithJsonArray([
  {
    "type": "stift_start",
    "hidden": true,
    "message0": "Start",
    "message1": "%1",
    "args1": [
      {
        "type": "input_statement",
        "name": "NEXT"
      }
    ],
    "colour": "FFBF00",
    "tooltip": "Startpunkt des Programms",
    "helpUrl": ""
  },
  {
    "type": "stift_gehe",
    "message0": "gehe %1 Schritte %2",
    "args0": [
      {
        "type": "field_number",
        "name": "STEPS",
        "value": 40,
        "min": 0,
        "max": 5000
      },
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          ["vor", "FORWARD"],
          ["zurück", "BACKWARD"]
        ],
        "value": "forward"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "4C97FF",
    "tooltip": "Bewegt die Turtle vorwärts",
    "helpUrl": ""
  },
  {
    "type": "stift_drehe",
    "message0": "drehe nach %1 um %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          ["links \u2b6f", "LEFT"],
          ["rechts \u2b6e", "RIGHT"]
        ],
        "value": "LEFT"
      },

      {
        "type": "field_angle_dropdown",
        "name": "ANGLE",
        "options": [
          ["5°", "5"],
          ["10°", "10"],
          ["20°", "20"],
          ["30°", "30"],
          ["36°", "36"],
          ["45°", "45"],
          ["60°", "60"],
          ["72°", "72"],
          ["90°", "90"],
          ["120°", "120"],
          ["144°", "144"],
          ["180°", "180"],
          ["…", "CUSTOM"]
        ],
        "value": "90"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "4C97FF",
    "tooltip": "Dreht die Turtle um einen Winkel",
    "helpUrl": ""
  },
  {
    "type": "stift_zustand",
    "message0": "schalte Stiftspur %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "STATE",
        "options": [
          ["ein", "DOWN"],
          ["aus", "UP"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "0FBD8C",
    "tooltip": "Hebt oder senkt den Stift",
    "helpUrl": ""
  },
  {
    "type": "stift_farbe",
    "message0": "setze Stiftfarbe auf %1",
    "args0": [
      {
        "type": "field_colour",
        "name": "COLOR",
        "colour": DEFAULT_PEN_COLOR
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "0FBD8C",
    "tooltip": "Wählt die Stiftfarbe",
    "helpUrl": ""
  },
  {
    "type": "stift_zufallsfarbe",
    "message0": "setze zufällige Stiftfarbe",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "0FBD8C",
    "tooltip": "Setzt eine zufällige Stiftfarbe",
    "helpUrl": ""
  },
  {
    "type": "stift_breite",
    "message0": "setze Stiftbreite auf %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "STEPS",
        "options": [
          ["3", "3"],
          ["6", "6"],
          ["9", "9"],
          ["12", "12"],
          ["15", "15"]
        ],
        "value": String(DEFAULT_PEN_WIDTH)
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "0FBD8C",
    "tooltip": "Wählt die Stiftbreite",
    "helpUrl": ""
  },
  {
    "type": "stift_sichtbarkeit",
    "message0": "schalte Stiftsichtbarkeit um",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "0FBD8C",
    "tooltip": "Zeigt den Stift an, falls er verborgen ist, oder versteckt ihn, falls er sichtbar ist.",
    "helpUrl": ""
  },
  {
    "type": "custom_repeat",
    "message0": "wiederhole %1 mal",
    "args0": [
      {
        "type": "field_number",
        "name": "TIMES",
        "value": 3,
        "min": 0,
        "max": 360,
        "precision": 1
      }
    ],
    "message1": "%1",
    "args1": [
      {
        "type": "input_statement",
        "name": "DO"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#FFAB19",
    "tooltip": "Wiederholt die Befehle im inneren der Schleife",
    "helpUrl": ""
  }
]);


(function () {
  const bp = Blockly.Blocks['stift_breite'];
  // Speichere das ursprüngliche init, um JSON-Init nicht zu verlieren
  const origInit = bp.init;
  bp.init = function () {
    // 1) Zuerst die normale JSON-Initialisierung
    origInit.call(this);
    // 2) Dann das Dropdown-Feld auf den globalen Default setzen
    this.getField('STEPS')
      .setValue(String(window.DEFAULT_PEN_WIDTH));
  };
})();
