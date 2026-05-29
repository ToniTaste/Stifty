// main.js

// Lokale Variablen und Konstanten
let workspace;
let currentSteps = [];
let stepsInitialized = false;
let isRunning = false;
let runTimeoutID = null;
let MAX_BLOCKS = 100;
const MAX_EXECUTION_STEPS = 5000;

/**
 * Globale Highlight-Funktion, die von Generated-Code aufgerufen wird.
 * Hightlightet den Block mit der gegebenen ID, wenn im Single-Step-Modus.
 */
window.highlightBlock = function (id) {
    if (workspace) {
        workspace.highlightBlock(id);
    }
};

/**
 * Liest die XML-Datei ein, erstellt eine Map aller <stift_drehe>-Winkel
 * (blockId → Winkel-String), lädt die Blöcke in den Workspace und
 * re-injiziert danach die freien Winkelwerte.
 *
 * @param {string} xmlText – der Inhalt der .xml-Datei als String
 */
function loadXmlWithCustomAngles(xmlText) {
    let xmlDom;
    try {
        xmlDom = Blockly.utils.xml.textToDom(xmlText);
    } catch (e) {
        alert("❌ Fehler beim Parsen der Datei:\n" + e.message);
        return;
    }

    const blocks = xmlDom.querySelectorAll('block');
    if (blocks.length === 0) {
        alert("⚠️ Keine Blöcke gefunden.");
        return;
    }

    const startBlocks = xmlDom.querySelectorAll('block[type="stift_start"]');

    if (startBlocks.length === 0) {
        alert("⚠️ Die Datei enthält keinen Startblock.");
        return;
    }

    if (startBlocks.length > 1) {
        alert("⚠️ Die Datei enthält mehrere Startblöcke.");
        return;
    }

    // 2. Winkelwerte aus allen <block type="stift_drehe"> extrahieren
    const angleMap = {};
    xmlDom.querySelectorAll('block[type="stift_drehe"]').forEach(blockElem => {
        const id = blockElem.getAttribute('id');
        const fieldElem = blockElem.querySelector('field[name="ANGLE"]');
        if (id && fieldElem) {
            angleMap[id] = fieldElem.textContent; // z.B. "11"
        }
    });

    // 3. Workspace leeren und Blöcke aus XML in den Workspace einfügen
    workspace.clear();
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    const startBlock = getStartBlock();
    if (startBlock) {
        startBlock.setDeletable(false);
    }

    // 4. Nachträglich alle Winkel-Werte wiederherstellen
    workspace.getAllBlocks().forEach(block => {
        if (block.type === 'stift_drehe') {
            const blockId = block.id;
            if (angleMap.hasOwnProperty(blockId)) {
                const savedValue = angleMap[blockId]; // z.B. "11"
                const field = block.getField('ANGLE');
				if (!field) {
					return;
				}
                const options = field.menuGenerator_;
                const exists = options.some(opt => opt[1] === savedValue);

                if (!exists) {
                    // CUSTOM-Index suchen, sonst hinten anfügen
                    const idxCustom = options.findIndex(opt => opt[1] === 'CUSTOM');
                    const insertIndex = idxCustom >= 0 ? idxCustom : options.length;
                    options.splice(insertIndex, 0, [savedValue + '°', savedValue]);
                }
                // Nur optische Aktualisierung (setzt auch das Grad-Zeichen)
                field.doValueUpdate_(savedValue);
            }
            // Falls block.id nicht in angleMap: Standardwert behalten
        }
    });

    // 5. Workspace komplett neu rendern
    workspace.render();

    // 6. Initialisierungen für Lauf/Schrittbetrieb zurücksetzen
    stepsInitialized = false;
    stiftReset();
	drawStift();
	deaktiviereStiftVerschieben();
}

const stiftyTheme = Blockly.Theme.defineTheme('stiftyTheme', {
    base: Blockly.Themes.Classic,
    blockStyles: {
        start_blocks: {
            colourPrimary: '#FFBF00',
            hat: 'cap'
        },
        command_blocks: {
            colourPrimary: '#4C97FF'
        },
        loop_blocks: {
            colourPrimary: '#FFAB19'
        }
    }
});

/**
 * Initialisiert Blockly, Canvas-Kontexte, etc.
 */
function initBlockly() {
    lineCtx = document.getElementById('lineCanvas').getContext('2d');
    stiftCtx = document.getElementById('stiftCanvas').getContext('2d');
    bgCtx = document.getElementById('bgCanvas').getContext('2d');

    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        trashcan: false,
        zoom: {
            controls: true,
            wheel: false,
            startScale: 0.8
        },
        scrollbars: true,
        renderer: 'zelos',
        theme: stiftyTheme
    });
}

/**
 * Entfernt alle Hervorhebungen im Workspace.
 */
function resetHighlight() {
    workspace.highlightBlock(null);
}

/**
 * Canvas/Grafik-Reset, Stift-Position etc.
 */
function stoppAll() {
    clearCanvas();
    stiftReset();
    drawStift();
    resetHighlight();
    currentSteps = [];
    stepsInitialized = false;
    isRunning = false; // Auch hier das Flag zurücksetzen
    if (runTimeoutID !== null) {
        clearTimeout(runTimeoutID);
        runTimeoutID = null;
    }
}

/**
 * Lädt das Standardprogramm (defaultProgramXml) in den Workspace,
 * dabei wird ebenfalls die Winkel-Recovery angewendet.
 */
function loadDefaultProgram() {
    loadXmlWithCustomAngles(defaultProgramXml);
}

/**
 * Setzt das Programm zurück auf den Default-Zustand.
 * Wird von Button „Blöcke zurücksetzen“ aufgerufen.
 */
function resetProgram() {
    stoppAll();
    loadDefaultProgram();
}

/**
 * „Alles zurücksetzen“ reloadet die Seite komplett.
 */
function reloadAll() {
    location.reload();
}

/**
 * Hilfsfunktion zum Entfernen des Hintergrunds.
 */
function clearBackground() {
    bgCtx.clearRect(0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
}

/**
 * Projekt in XML speichern (Download anstoßen).
 */

async function saveProject() {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    sanitizeBlockIds(xml);
    const xmlText = Blockly.Xml.domToPrettyText(xml);

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'Stiftprogramm.xml',
                types: [{
                        description: 'Blockly Programmdatei',
                        accept: {
                            'text/xml': ['.xml']
                        }
                    }
                ]
            });
            const writable = await handle.createWritable();
            await writable.write(xmlText);
            await writable.close();
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('❌ Fehler beim Speichern:\n' + err.message);
            }
            return;
        }
    }

    // Fallback für Firefox:
    let filename = prompt('Dateiname für das Programm:', 'Stiftprogramm.xml');
    if (!filename)
        return;
    if (!filename.toLowerCase().endsWith('.xml'))
        filename += '.xml';

    const blob = new Blob([xmlText], {
        type: 'text/xml'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Öffnet die Datei-Auswahl, um ein gespeichertes Projekt zu laden.
 */
function loadProject() {
    document.getElementById('xmlInput').click();
}

/**
 * SVG-Hintergrund laden: Öffnet Datei-Auswahl für .svg.
 */
function loadSVG() {
    document.getElementById('svgInput').click();
}

/**
 * SVG-Hintergrund selbständig laden (callback des FileReader).
 */
function handleSvgFile(readerEvent) {
    const svgText = readerEvent.target.result;
    const blob = new Blob([svgText], {
        type: 'image/svg+xml;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        clearBackground();
        bgCtx.drawImage(img, 0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

/**
 * Exportiert das Linienbild als SVG-File (Download).
 */
async function exportSVG() {
    const w = lineCtx.canvas.width;
    const h = lineCtx.canvas.height;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n`;

    const filtered = vectorCommands.filter(cmd =>
            isFinite(cmd.x1) && isFinite(cmd.y1) &&
            isFinite(cmd.x2) && isFinite(cmd.y2) &&
            typeof cmd.color === 'string' &&
            isFinite(cmd.width));

    const skipped = vectorCommands.length - filtered.length;
    if (skipped > 0) {
        console.warn(`${skipped} ungültige Vektorbefehle wurden beim Export ignoriert.`);
    }

    // Linien mit gemeinsamem Stil als Pfad zusammenfassen
    if (filtered.length) {
        let currentColor = filtered[0].color;
        let currentWidth = filtered[0].width;
        let d = `M ${filtered[0].x1} ${filtered[0].y1} L ${filtered[0].x2} ${filtered[0].y2} `;

        // Anfangskreis
        svg += `  <circle cx="${filtered[0].x1}" cy="${filtered[0].y1}" r="${currentWidth / 2}" fill="${currentColor}" />\n`;

        for (let i = 1; i < filtered.length; i++) {
            const cmd = filtered[i];
            const prev = filtered[i - 1];

            // Kreise für Segmentende
            svg += `  <circle cx="${prev.x2}" cy="${prev.y2}" r="${prev.width / 2}" fill="${prev.color}" />\n`;

            if (cmd.color !== currentColor || cmd.width !== currentWidth) {
                svg += `  <path d="${d.trim()}" fill="none" stroke="${currentColor}" stroke-width="${currentWidth}" stroke-linecap="round" />\n`;
                currentColor = cmd.color;
                currentWidth = cmd.width;
                d = `M ${cmd.x1} ${cmd.y1} L ${cmd.x2} ${cmd.y2} `;
            } else {
                if (cmd.x1 !== prev.x2 || cmd.y1 !== prev.y2) {
                    d += `M ${cmd.x1} ${cmd.y1} `;
                }
                d += `L ${cmd.x2} ${cmd.y2} `;
            }
        }

        // letzter Kreis
        const last = filtered[filtered.length - 1];
        svg += `  <circle cx="${last.x2}" cy="${last.y2}" r="${last.width / 2}" fill="${last.color}" />\n`;

        // letzter Pfad
        svg += `  <path d="${d.trim()}" fill="none" stroke="${currentColor}" stroke-width="${currentWidth}" stroke-linecap="round" />\n`;
    }

    svg += `</svg>`;

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'Stiftbild.svg',
                types: [{
                        description: 'SVG-Bild',
                        accept: {
                            'image/svg+xml': ['.svg']
                        }
                    }
                ]
            });
            const writable = await handle.createWritable();
            await writable.write(svg);
            await writable.close();
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('❌ Fehler beim Speichern:\n' + err.message);
            }
            return;
        }
    }

    // Fallback für Firefox
    let filename = prompt('Dateiname für das Bild:', 'Stiftbild.svg');
    if (!filename)
        return;
    if (!filename.toLowerCase().endsWith('.svg'))
        filename += '.svg';

    const blob = new Blob([svg], {
        type: 'image/svg+xml'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Startet die Programmausführung im Durchlaufmodus.
 */
function startRun() {
    if (isRunning) {
        return;
    }

    if (!runInit()) {
        isRunning = false;
        return;
    }

    isRunning = true;
    runRun();
}

/**
 * Initialisierung für den Durchlaufmodus: Generierung + Unrollen von Loops.
 */
function runInit() {
    if (runTimeoutID !== null) {
        clearTimeout(runTimeoutID);
        runTimeoutID = null;
    }

    stoppAll();

    Blockly.JavaScript.init(workspace);
    Blockly.JavaScript.addReservedWords('highlightBlock');

    const start = getStartBlock();
    if (!start) {
        return false;
    }

    const firstBlock = start.getNextBlock();

    const blockCount = countReachableBlocks(firstBlock);
    if (blockCount > MAX_BLOCKS) {
        alert(`⚠️ Zu viele Blöcke!\nMaximal sind ${MAX_BLOCKS} erlaubt, du hast ${blockCount} verwendet.`);
        return false;
    }

    let code = firstBlock ? Blockly.JavaScript.blockToCode(firstBlock) : '';

    code = unrollLoops(code);

    currentSteps = buildExecutionSteps(code);
	if (currentSteps.length > MAX_EXECUTION_STEPS) {
    alert(`⚠️ Das Programm erzeugt zu viele Einzelschritte (${currentSteps.length}). Erlaubt sind maximal ${MAX_EXECUTION_STEPS}.`);
    currentSteps = [];
    return false;
    }
    return true;
}

/**
 * Führt jeden Schritt aus und plant den nächsten via setTimeout.
 */
function runRun() {
    if (currentSteps.length === 0) {
        resetHighlight();
        isRunning = false; // Run beendet
		runTimeoutID = null;
        return;
    }
    const chunk = currentSteps.shift();
    try {
        eval(chunk);
    } catch (e) {
        alert('❌ Fehler im Programm:\n' + e.message);
        drawStift();
        stepsInitialized = false;
        currentSteps = [];
        isRunning = false;
        runTimeoutID = null;
        return;
    }
    const slider = document.getElementById('timeoutSlider');
    const delay = (101 - (parseInt(slider.value, 10) || 70)) * 5;
    runTimeoutID = setTimeout(runRun, delay);
}

function getStartBlock() {
    const startBlocks = workspace
        .getAllBlocks(false)
        .filter(block => block.type === 'stift_start');

    if (startBlocks.length === 0) {
        alert('⚠️ Kein Startblock!');
        return null;
    }

    if (startBlocks.length > 1) {
        alert('⚠️ Es gibt mehrere Startblöcke!');
        return null;
    }

    return startBlocks[0];
}

function countReachableBlocks(block) {
    if (!block || block.isShadow()) {
        return 0;
    }

    let count = 1;

    for (const input of block.inputList) {
        const child = input.connection?.targetBlock();
        if (child) {
            count += countReachableBlocks(child);
        }
    }

    const next = block.getNextBlock();
    if (next) {
        count += countReachableBlocks(next);
    }

    return count;
}

function buildExecutionSteps(code) {
    const lines = code
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const steps = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (
            line.startsWith('highlightBlock(') &&
            i + 1 < lines.length &&
            !lines[i + 1].startsWith('highlightBlock(')) {
            steps.push(line + '\n' + lines[i + 1]);
            i++;
        } else {
            steps.push(line);
        }
    }

    return steps;
}

/**
 * Einzel-Schritt-Betrieb mit Highlighting.
 */
function startStep() {
    if (!stepsInitialized) {
        if (!runInit()) {
            return;
        }
        stepsInitialized = true;
    }

    if (currentSteps.length > 0) {
        const chunk = currentSteps.shift();
        try {
            eval(chunk);
        } catch (e) {
            alert('❌ Fehler bei Schritt:\n' + chunk + '\n' + e.message);
            stoppAll();
            stepsInitialized = false;
            currentSteps = [];
        }
    } else {
        resetHighlight();
        stepsInitialized = false;
        alert('✅ Alle Schritte abgeschlossen.');
    }
}

/**
 * Unroll-Algorithmus: Eine for-Schleife mit fester Schleifenanzahl in
 * viele Einzelbefehle zerlegen (für Visualisierung mit Pause).
 */
function unrollLoops(code) {
    const headerRe = /for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\)\s*{/g;
    let last,
    m;
    while ((m = headerRe.exec(code)) !== null) {
        last = {
            match: m,
            index: m.index
        };
    }
    if (!last) {
        return code
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
    }
    const { match, index } = last;
    const count = Number(match[2]);
    const startBody = index + match[0].length;
    let depth = 1,
    i = startBody;
    while (depth > 0 && i < code.length) {
        const ch = code[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            while (i < code.length && (code[i] !== quote || code[i - 1] === '\\')) {
                i++;
            }
            i++;
            continue;
        }
        if (ch === '{')
            depth++;
        else if (ch === '}')
            depth--;
        i++;
    }
    if (depth !== 0)
        throw new Error("Klammer-Mismatch beim Unrollen");
    const rawBody = code.slice(startBody, i - 1);
    const body = unrollLoops(rawBody);
    const before = code.slice(0, index);
    const after = code.slice(i);
    const expanded = Array(count).fill(body).join('\n');
    return unrollLoops(before + expanded + after);
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Jetzt Event-Handler registrieren und initiales Laden:
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
let stiftVerschiebenAktiv = false;
let stiftWirdGezogen = false;


function setzeStiftVerschiebenAktiv(aktiv) {
    stiftVerschiebenAktiv = aktiv;

    const button = document.getElementById('moveStiftButton');
    const canvas = document.getElementById('stiftCanvas');

    if (!button || !canvas) {
        return;
    }

    if (stiftVerschiebenAktiv) {
        button.classList.add('active');
        canvas.classList.add('move-mode');

    } else {
        button.classList.remove('active');
        canvas.classList.remove('move-mode');
        stiftWirdGezogen = false;
    }
}

function toggleStiftVerschieben() {
    if (isRunning) {
        return;
    }

    setzeStiftVerschiebenAktiv(!stiftVerschiebenAktiv);
}

function deaktiviereStiftVerschieben() {
    setzeStiftVerschiebenAktiv(false);
}

function ermittleCanvasPosition(event) {
    const canvas = document.getElementById('stiftCanvas');
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function initialisiereStiftVerschieben() {
    const canvas = document.getElementById('stiftCanvas');

    canvas.addEventListener('pointerdown', function (event) {
        if (!stiftVerschiebenAktiv || isRunning) {
            return;
        }

        stiftWirdGezogen = true;
        canvas.setPointerCapture(event.pointerId);

        const pos = ermittleCanvasPosition(event);
        stiftSetzeStartposition(pos.x, pos.y);

        event.preventDefault();
    });

    canvas.addEventListener('pointermove', function (event) {
        if (!stiftVerschiebenAktiv || !stiftWirdGezogen || isRunning) {
            return;
        }

        const pos = ermittleCanvasPosition(event);
        stiftSetzeStartposition(pos.x, pos.y);

        event.preventDefault();
    });

    canvas.addEventListener('pointerup', function (event) {
        stiftWirdGezogen = false;
        try {
            canvas.releasePointerCapture(event.pointerId);
        } catch (e) {
            // Falls der Pointer nicht mehr gehalten wird: ignorieren.
        }
    });

    canvas.addEventListener('pointercancel', function () {
        stiftWirdGezogen = false;
    });
	
	document.addEventListener('click', function (event) {
    const button = event.target.closest('button');

    if (!button) {
        return;
    }

    // Der Hand-Button selbst darf natürlich umschalten.
    if (button.id === 'moveStiftButton') {
        return;
    }

    // Jeder andere Button beendet den Verschiebemodus.
    deaktiviereStiftVerschieben();
}, true);
}


window.addEventListener('load', () => {
    // 1) Blockly und Canvas initialisieren
    initBlockly();
    stiftReset();
    drawStift();
	initialisiereStiftVerschieben();

    // 2) Standard-Hintergrund (falls konfiguriert)
    if (window.DEFAULT_BACKGROUND_SVG) {
        const svgText = window.DEFAULT_BACKGROUND_SVG.trim();
        const blob = new Blob([svgText], {
            type: 'image/svg+xml;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            bgCtx.clearRect(0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
            bgCtx.drawImage(img, 0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    // 3) Default-Programm laden (mit Winkel-Recovery)
    loadDefaultProgram();

    // 4) Datei-Ladebereich für Projekt (XML)
    document.getElementById('xmlInput').addEventListener('change', function () {
        const file = this.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = e => loadXmlWithCustomAngles(e.target.result);
        reader.readAsText(file);
    });

    // 5) Datei-Ladebereich für SVG-Hintergrund
    document.getElementById('svgInput').addEventListener('change', function () {
        const file = this.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = handleSvgFile;
        reader.readAsText(file);
        // Mehrfach-Auszuwählen derselben Datei erlauben:
        this.value = '';
    });
});

function sanitizeBlockIds(xmlDom) {
    const usedIds = new Set();
    const blocks = xmlDom.querySelectorAll('block[id]');
    blocks.forEach((block, i) => {
        const newId = `b${i}_${Date.now()}`;
        usedIds.add(newId);
        block.setAttribute('id', newId);
    });
}
