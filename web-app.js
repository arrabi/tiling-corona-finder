import { Corona } from './corona.js';
import { enumerateUniqueCoronasCenter1 } from './corona-finder.js';

const generateBtn = document.getElementById('generateBtn');
const coronasDiv = document.getElementById('coronas');
const statsDiv = document.getElementById('stats');
const countSpan = document.getElementById('count');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

const colors = { 1: '#ffb74d', 2: '#81c784', 3: '#64b5f6', 4: '#e57373' };

function drawCoronaToCanvas(corona) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = 200;
    const scale = size / (corona.center * 8);
    const centerSize = corona.center * scale;
    
    canvas.width = size;
    canvas.height = size;
    
    const x = size / 2 - centerSize / 2;
    const y = size / 2 - centerSize / 2;

    // Draw background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, size, size);

    // Draw edges
    for (let edgeIdx = 0; edgeIdx < 4; edgeIdx++) {
        const edge = corona.edges[edgeIdx];
        for (const seg of edge) {
            const segSize = seg.size * scale;
            const offset = seg.offset * scale;
            ctx.fillStyle = colors[seg.size] || '#999';

            let sx, sy;
            switch (edgeIdx) {
                case 0: sx = x + offset; sy = y - segSize; break;
                case 1: sx = x + centerSize; sy = y + offset; break;
                case 2: sx = x + centerSize - offset - segSize; sy = y + centerSize; break;
                case 3: sx = x - segSize; sy = y + centerSize - offset - segSize; break;
            }

            ctx.fillRect(sx, sy, segSize, segSize);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, segSize, segSize);
        }
    }

    // Draw center
    ctx.fillStyle = '#667eea';
    ctx.fillRect(x, y, centerSize, centerSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, centerSize, centerSize);

    // Draw center label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(corona.center.toString(), x + centerSize / 2, y + centerSize / 2);

    return canvas;
}

generateBtn.addEventListener('click', async () => {
    coronasDiv.innerHTML = '';
    statsDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    try {
        const coronas = enumerateUniqueCoronasCenter1();
        
        coronas.forEach((corona, idx) => {
            const card = document.createElement('div');
            card.className = 'corona-card';
            
            const label = document.createElement('div');
            label.className = 'corona-label';
            label.textContent = `#${idx + 1}: ${corona.toCompact()}`;
            card.appendChild(label);
            
            const canvas = drawCoronaToCanvas(corona);
            card.appendChild(canvas);
            
            coronasDiv.appendChild(card);
        });

        countSpan.textContent = coronas.length;
        statsDiv.style.display = 'block';
    } catch (err) {
        errorDiv.textContent = `Error: ${err.message}`;
        errorDiv.style.display = 'block';
        console.error(err);
    } finally {
        loadingDiv.style.display = 'none';
    }
});
