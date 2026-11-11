const columns = document.getElementById('cols');
const rows = document.getElementById('rows');
const grid = document.getElementById('grid');
const generate = document.getElementById('generate');
const palette = document.getElementById('palette');
const customColor = document.getElementById('customColor');
const swatches = document.querySelectorAll('.color');

let currentColor = "#2b2b2b";
let isPainting = false;

function buildGrid(numCols, numRows) {
    grid.innerHTML = "";

    // shrink cells on narrow screens so the grid fits
    const available = window.innerWidth - 40 - (numCols - 1) * 2;
    const size = Math.max(14, Math.min(28, Math.floor(available / numCols)));
    grid.style.setProperty('--cell', size + 'px');
    grid.style.gridTemplateColumns = `repeat(${numCols}, var(--cell))`;

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            grid.appendChild(cell);
        }
    }
}

function getClampedValues() {
    const inputRow = Number(rows.value);
    const inputColumns = Number(columns.value);
    const clampedRow = Math.max(4, Math.min(25, inputRow));
    const clampedColumns = Math.max(4, Math.min(25, inputColumns));
    return { clampedColumns, clampedRow };
}

function paintCell(cell) {
    cell.style.backgroundColor = currentColor;
    cell.dataset.color = currentColor;
}

function selectSwatch(swatch) {
    swatches.forEach(s => s.classList.remove('selected'));
    if (swatch) {
        swatch.classList.add('selected');
        currentColor = swatch.dataset.color;
    }
}

/* ---------- painting ---------- */
grid.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('cell')) {
        isPainting = true;
        paintCell(e.target);
    }
});

grid.addEventListener('pointermove', (e) => {
    if (!isPainting) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList.contains('cell')) {
        paintCell(el);
    }
});

window.addEventListener('pointerup', () => { isPainting = false; });
window.addEventListener('pointercancel', () => { isPainting = false; });

palette.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color');
    if (!swatch) return;
    selectSwatch(swatch);
});

customColor.addEventListener('input', (e) => {
    currentColor = e.target.value;
    swatches.forEach(s => s.classList.remove('selected'));
});

function regenerate() {
    const { clampedColumns, clampedRow } = getClampedValues();
    columns.value = clampedColumns;   // show the clamped values in the inputs
    rows.value = clampedRow;
    buildGrid(clampedColumns, clampedRow);
}

generate.addEventListener('click', regenerate);

window.addEventListener('load', () => {
    swatches.forEach(s => s.style.backgroundColor = s.dataset.color);
    selectSwatch(swatches[0]);
    regenerate();
});