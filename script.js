const columns = document.getElementById('cols');
const rows = document.getElementById('rows');
const grid = document.getElementById('grid');
const generate = document.getElementById('generate');
const palette = document.getElementById('palette');
const customColor = document.getElementById('customColor');
const swatches = document.querySelectorAll('.color');
const prevRow = document.getElementById('prevRow');
const nextRow = document.getElementById('nextRow');
const rowStatus = document.getElementById('rowStatus');
const exportBtn = document.getElementById('exportPng');
const mirrorToggle = document.getElementById('mirror');
const STORAGE_KEY = 'patterngrid';
const MIN_SIZE = 4;
const MAX_SIZE = 25;


let currentColor = "#2b2b2b";
let isPainting = false;
let currentRow = 0;
let totalRows = 0;
let totalCols = 0;
let cellList = [];

function buildGrid(numCols, numRows) {
    grid.innerHTML = "";
    cellList = [];
    totalCols = numCols;
    totalRows = numRows;
    currentRow = 0;

    const available = window.innerWidth - 40 - 32 - numCols * 2;
    const size = Math.max(14, Math.min(28, Math.floor(available / numCols)));
    grid.style.setProperty('--cell', size + 'px');
    grid.style.gridTemplateColumns = `32px repeat(${numCols}, var(--cell))`;

    for (let r = 0; r < numRows; r++) {
        // row label first, then that row's cells
        const label = document.createElement('div');
        label.classList.add('row-label');
        label.dataset.row = r;
        label.textContent = r + 1;
        grid.appendChild(label);
        for (let c = 0; c < numCols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            grid.appendChild(cell);
            cellList.push(cell);
        }
    }
    updateTracker();
}

function getClampedValues() {
    const inputRow = Number(rows.value);
    const inputColumns = Number(columns.value);
    const clampedRow = Math.max(MIN_SIZE, Math.min(MAX_SIZE, inputRow));
    const clampedColumns = Math.max(MIN_SIZE, Math.min(MAX_SIZE, inputColumns));
    return { clampedColumns, clampedRow };
}

function applyColor(cell) {
    cell.style.backgroundColor = currentColor;
    cell.dataset.color = currentColor;
}

function paintCell(cell) {
    applyColor(cell);
    if (mirrorToggle.checked) {
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        const twin = cellList[r * totalCols + (totalCols - 1 - c)];
        if (twin) applyColor(twin);
    }
}

function selectSwatch(swatch) {
    swatches.forEach(s => s.classList.remove('selected'));
    if (swatch) {
        swatch.classList.add('selected');
        currentColor = swatch.dataset.color;
    }
}

function saveState() {
    const cells = document.querySelectorAll('.cell');
    const state = {
        cols: totalCols,
        rows: totalRows,
        currentRow,
        colors: Array.from(cells, c => c.dataset.color || null)
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('Could not save', err);
    }
}

function loadState() {
    let state;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        state = JSON.parse(raw);
    } catch (err) {
        return false;
    }
    const validSize = n => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
    if (!state || !validSize(state.cols) || !validSize(state.rows)) return false;
    if (!Array.isArray(state.colors) || state.colors.length !== state.cols * state.rows) return false;

    const validColor = c => c === null || (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c));
    if (!state.colors.every(validColor)) return false;

    columns.value = state.cols;
    rows.value = state.rows;
    buildGrid(state.cols, state.rows);

    document.querySelectorAll('.cell').forEach((cell, i) => {
        const color = state.colors[i];
        if (color) {
            cell.style.backgroundColor = color;
            cell.dataset.color = color;
        }
    });

    setRow(Number(state.currentRow) || 0);
    return true;
}

function updateTracker() {
    document.querySelectorAll('.cell, .row-label').forEach(el => {
        const rowNum = Number(el.dataset.row);
        el.classList.toggle('done', rowNum < currentRow);
        el.classList.toggle('current', rowNum === currentRow);
    });
    rowStatus.textContent = `Row ${currentRow + 1} of ${totalRows}`;
}

function setRow(n) {
    currentRow = Math.max(0, Math.min(totalRows - 1, n));
    updateTracker();
    saveState();
}

grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('row-label')) {
        setRow(Number(e.target.dataset.row));
    }
});

prevRow.addEventListener('click', () => setRow(currentRow - 1));
nextRow.addEventListener('click', () => setRow(currentRow + 1));

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

function endStroke() {
    if (isPainting) saveState(); 
    isPainting = false;
}

window.addEventListener('pointerup', endStroke);
window.addEventListener('pointercancel', endStroke);
palette.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color');
    if (!swatch) return;
    selectSwatch(swatch);
});

customColor.addEventListener('input', (e) => {
    currentColor = e.target.value;
    swatches.forEach(s => s.classList.remove('selected'));
});

function exportPng() {
    const cells = document.querySelectorAll('.cell');
    if (!cells.length) return;

    const size = 24;          
    const labelW = 36;        
    const pad = 10;

    const canvas = document.createElement('canvas');
    canvas.width = labelW + totalCols * size + pad * 2;
    canvas.height = totalRows * size + pad * 2;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f4e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    cells.forEach((cell, i) => {
        const r = Math.floor(i / totalCols);
        const c = i % totalCols;
        const x = pad + labelW + c * size;
        const y = pad + r * size;

        ctx.fillStyle = cell.dataset.color || '#f8f4e9';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size, size);

        if (c === 0) {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillText(String(r + 1), pad + labelW - 8, y + size / 2);
        }
    });

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pattern.png';
        a.click();
        URL.revokeObjectURL(url);
    });
}
exportBtn.addEventListener('click', exportPng);

function regenerate() {
    const { clampedColumns, clampedRow } = getClampedValues();
    columns.value = clampedColumns;
    rows.value = clampedRow;
    buildGrid(clampedColumns, clampedRow);
    saveState();
}

generate.addEventListener('click', () => {
    const hasPaint = document.querySelector('.cell[data-color]');
    if (hasPaint && !confirm('Start a new grid? This clears your current pattern.')) return;
    regenerate();
});

window.addEventListener('load', () => {
    swatches.forEach(s => s.style.backgroundColor = s.dataset.color);
    selectSwatch(swatches[0]);
    if (!loadState()) regenerate();
});