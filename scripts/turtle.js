let x = window.DEFAULT_PEN_X, y = window.DEFAULT_PEN_Y, angle = 0, penDown = true;
let penColor = window.DEFAULT_PEN_COLOR;
let penWidth = window.DEFAULT_PEN_WIDTH;
let lineCtx, stiftCtx;
let stiftIstSichtbar = true;
const vectorCommands = [];

function stiftReset() {
  x = window.DEFAULT_PEN_X;
  y = window.DEFAULT_PEN_Y;
  angle = 0;
  penDown = true;
  penColor = window.DEFAULT_PEN_COLOR;
  penWidth = window.DEFAULT_PEN_WIDTH;
  vectorCommands.length = 0;
  stiftIstSichtbar = true;
}

function clearCanvas() {
  lineCtx.clearRect(0, 0, lineCtx.canvas.width, lineCtx.canvas.height);
  stiftCtx.clearRect(0, 0, stiftCtx.canvas.width, stiftCtx.canvas.height);
}

function drawStift() {
  stiftCtx.clearRect(0, 0, stiftCtx.canvas.width, stiftCtx.canvas.height);
  if (stiftIstSichtbar) {
    stiftCtx.clearRect(0, 0, stiftCtx.canvas.width, stiftCtx.canvas.height);
    stiftCtx.save();
    stiftCtx.translate(x, y);
    stiftCtx.rotate(angle * Math.PI / 180);
    stiftCtx.beginPath();
    stiftCtx.moveTo(20, 0);
    stiftCtx.lineTo(0, 7);
    stiftCtx.lineTo(0, -7);
    stiftCtx.closePath();
    stiftCtx.fillStyle = penColor;
    stiftCtx.fill();
    stiftCtx.restore();
  }
}
function stiftSichtbarkeitUmschalten() {
  if (stiftIstSichtbar) {
    stiftIstSichtbar = false;
  } else {
    stiftIstSichtbar = true;
  }
  drawStift();
}


function stiftGehe(steps, dir) {
  const rad = angle * Math.PI / 180;
  let newX, newY;
  if (dir === 'FORWARD') {
    newX = x + steps * Math.cos(rad);
    newY = y + steps * Math.sin(rad);
  }
  else {
    newX = x - steps * Math.cos(rad);
    newY = y - steps * Math.sin(rad);

  }

  if (penDown) {
    lineCtx.fillStyle = penColor;
    lineCtx.beginPath();
    lineCtx.arc(x, y, penWidth / 2, 0, 2 * Math.PI);
    lineCtx.fill();
    lineCtx.beginPath();
    lineCtx.moveTo(x, y);
    lineCtx.lineTo(newX, newY);
    lineCtx.strokeStyle = penColor;
    lineCtx.lineWidth = penWidth;
    lineCtx.stroke();
    lineCtx.beginPath();
    lineCtx.arc(newX, newY, penWidth / 2, 0, 2 * Math.PI);
    lineCtx.fill();

    if (
      isFinite(x) && isFinite(y) &&
      isFinite(newX) && isFinite(newY) &&
      typeof penColor === 'string' &&
      isFinite(penWidth)
    ) {
      vectorCommands.push({
        x1: x, y1: y,
        x2: newX, y2: newY,
        color: penColor,
        width: penWidth
      });
    } else {
      console.warn('Ungültiger Zeichenbefehl übersprungen:', {
        x, y, newX, newY, penColor, penWidth
      });
    }
  }
  x = newX;
  y = newY;
  drawStift();
}



function stiftDrehe(dir, degrees) {
  if (dir === 'LEFT') {
    angle -= degrees;
  } else {
    angle += degrees;
  }
  drawStift();
}

function stiftSetzeZustand(state) {
  penDown = (state === "DOWN");
}

function stiftSetzeFarbe(colour) {
  penColor = colour;
  // Optional: Vektor-Befehl protokollieren (falls du vectorCommands nutzt)
  if (Array.isArray(vectorCommands)) {
    vectorCommands.push({ type: 'colour', color: penColor });
  }
  // Optional: Stift‐Symbol neu zeichnen, damit man die Änderung sofort sieht
  drawStift();
}

function stiftSetzeZufallsfarbe() {
  const palette = ['#999', '#C00', '#F60', '#FF0', '#3C0', '#36F', '#F9F', '#939', '#009', '#C93', '#090', '#666', '#C60', '#33F', '#600'];
  const zufallsIndex = Math.floor(Math.random() * palette.length);
  const zufallsFarbe = palette[zufallsIndex];
  stiftSetzeFarbe(zufallsFarbe);
}

function stiftSetzeBreite(width) {
  penWidth = width;
}
