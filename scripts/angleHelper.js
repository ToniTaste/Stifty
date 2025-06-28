// cdoAngleHelper.js
(function (Blockly) {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** Parameter für die Helpers */
  const SIZE = 150;
  const RADIUS = SIZE / 2 - 10;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const COLORS = {
    sector: '#4C97FF',
    skel: '#4C97FF',
    center: '#4C97FF'
  };

  /** Berechnet den Arc-Path ab 0° rechts CCW. */
  function computeArcPath(value) {
    const theta = value * Math.PI / 180;
    const x1 = CX + RADIUS * Math.cos(theta);
    const y1 = CY - RADIUS * Math.sin(theta);
    const largeArc = value > 180 ? 1 : 0;
    return `M ${CX + RADIUS} ${CY}`
      + ` A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${x1} ${y1}`;
  }

  /** Berechnet den CW-Arc-Path ab 0° rechts im Uhrzeigersinn. */
  function computeArcPathCW(value) {
    const theta = value * Math.PI / 180;
    const x1 = CX + RADIUS * Math.cos(theta);
    const y1 = CY + RADIUS * Math.sin(theta);
    const largeArc = value > 180 ? 1 : 0;
    // sweep-flag = 1 für CW
    return `M ${CX + RADIUS} ${CY}`
      + ` A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1}`;
  }

  /** Baut das leere SVG und <defs> für den Pfeil. */
  function createSvgContainer() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', SIZE);
    svg.setAttribute('height', SIZE);
    svg.setAttribute('class', 'cdo-angle-helper-svg');

    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" viewBox="0 0 8 10"
              markerUnits="strokeWidth" markerWidth="3" markerHeight="4"
              refX="8" refY="5" orient="auto">
        <path d="M0,0 L8,5 L0,10Z" fill="${COLORS.sector}"/>
      </marker>`;
    svg.appendChild(defs);
    return svg;
  }

  /** Zeichnet den Hintergrundkreis. */
  function addBackground(svg) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', CX);
    circle.setAttribute('cy', CY);
    circle.setAttribute('r', RADIUS);
    circle.setAttribute('class', 'cdo-angle-helper-bg');
    svg.appendChild(circle);
  }

  /** Zeichnet die 15°-Ticks außen, mit variabler Länge. */
  function addTicks(svg) {
    for (let angle = 0; angle < 360; angle += 15) {
      let len = (angle % 90 === 0 ? 15
        : angle % 45 === 0 ? 10
          : 5);
      const tick = document.createElementNS(SVG_NS, 'line');
      tick.setAttribute('x1', CX + RADIUS);
      tick.setAttribute('y1', CY);
      tick.setAttribute('x2', CX + RADIUS - len);
      tick.setAttribute('y2', CY);
      tick.setAttribute('stroke', '#444');
      tick.setAttribute('stroke-width', '1');
      tick.setAttribute('stroke-linecap', 'round');
      tick.setAttribute('transform', `rotate(${angle}, ${CX}, ${CY})`);
      svg.appendChild(tick);
    }
  }

  /** Zeichnet den gefüllten Sektor. */
  function addSector(svg, value, useCW) {
    const arcPath = useCW
      ? computeArcPathCW(value)
      : computeArcPath(value);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d',
      `M${CX},${CY}` +
      `L${CX + RADIUS},${CY}` +
      arcPath.slice(1) +
      ' Z'
    );
    path.setAttribute('fill', COLORS.sector);
    path.setAttribute('fill-opacity', '0.3');
    svg.appendChild(path);
  }

  /** Zeichnet Schenkel (Linien zu 0° und value). */
  function addSkeleton(svg, value, useCW) {
    const angles = useCW ? [0, -value] : [0, value];
    angles.forEach(v => {
      const theta = v * Math.PI / 180;
      const x = CX + RADIUS * Math.cos(theta);
      const y = CY - RADIUS * Math.sin(theta);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', CX);
      line.setAttribute('y1', CY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'cdo-angle-helper-skel');
      svg.appendChild(line);
    });
  }

  /** Zeichnet den Arc mit Pfeil-Marker am Ende. */
  function addArc(svg, value, useCW) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute(
      'd',
      useCW
        ? computeArcPathCW(value)
        : computeArcPath(value)
    );
    path.setAttribute('class', 'cdo-angle-helper-arc');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(path);
  }

  /** Zeichnet den Mittelpunkt. */
  function addCenter(svg) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', CX);
    dot.setAttribute('cy', CY);
    dot.setAttribute('r', 3);
    dot.setAttribute('class', 'cdo-angle-helper-center');
    svg.appendChild(dot);
  }

  /** Hauptfunktion: baut SVG mit allen Elementen auf und hängt es an menuDiv. */
  function showAngleHelper(field, menuDiv, overrideValue) {
    // alte Helper entfernen
    menuDiv.querySelectorAll('.cdo-angle-helper-container')
      .forEach(el => el.remove());

    // Richtung und Winkel bestimmen
    const dir = field.getSourceBlock().getFieldValue('DIRECTION') || 'LEFT';
    const useCW = dir === 'RIGHT';
    const raw = (typeof overrideValue === 'number')
      ? overrideValue
      : parseInt(field.getValue(), 10) || 0;

    // SVG-Container aufbauen
    const svg = createSvgContainer();
    addBackground(svg);
    addTicks(svg);
    addSector(svg, raw, useCW);
    addSkeleton(svg, raw, useCW);
    addArc(svg, raw, useCW);
    addCenter(svg);

    // Container & anhängen
    const wrapper = document.createElement('div');
    wrapper.className = 'cdo-angle-helper-container';
    wrapper.appendChild(svg);
    menuDiv.appendChild(wrapper);
  }

  Blockly.CdoAngleHelper = { showAngleHelper };
})(Blockly);
