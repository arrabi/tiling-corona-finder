// Web application for visualizing coronas

import { Corona,  } from './corona.js';

function canonicalRotationEdges(edges: ReadonlyArray<>) {
    function edgeKey(e: ) {
        const sorted = [...e].sort((a, b) => 
            a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
        );
        return JSON.stringify(sorted.map(seg => [seg.size, seg.offset]));
    }

    const keys[] = [];
    
    for (let k = 0; k < 4; k++) {
        const rot = [...edges.slice(k), ...edges.slice(0, k)];
        const rotKey = rot.map(e => edgeKey(e)).join(";");
        keys.push(rotKey);
    }
    
    keys.sort();
    return keys[0];
}

function enumerateUniqueCoronasCenter1()[] {
    const c = 1;
    const allowedSizes = [1, 2, 3, 4];

    const edgeChoices[] = [
        [{ size: 2, offset: 0 }],
        [{ size: 3, offset: 0 }],
        [{ size: 4, offset: 0 }]
    ];

    const seen = new Set<string>();
    const unique[] = [];

    for (const e0 of edgeChoices) {
        for (const e1 of edgeChoices) {
            for (const e2 of edgeChoices) {
                for (const e3 of edgeChoices) {
                    const cor = new Corona(c, [e0, e1, e2, e3]);
                    
                    if (!cor.validate(allowedSizes).ok) {
                        continue;
                    }

                    const key = canonicalRotationEdges(cor.edges);
                    if (seen.has(key)) {
                        continue;
                    }

                    seen.add(key);
                    unique.push(cor);
                }
            }
        }
    }

    return unique;
}

// -----------------------------
// Visualization
// -----------------------------

function drawCorona(corona, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 20; // pixels per unit
    const centerSize = corona.center * scale;
    const padding = 80;

    // Calculate canvas size based on max overhang
    let maxExtent = corona.center;
    for (const edge of corona.edges) {
        for (const seg of edge) {
            maxExtent = Math.max(maxExtent, seg.offset + seg.size);
        }
    }

    const canvasSize = (maxExtent * 2 + corona.center) * scale + padding * 2;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw center square
    ctx.fillStyle = '#667eea';
    ctx.fillRect(
        centerX - centerSize / 2,
        centerY - centerSize / 2,
        centerSize,
        centerSize
    );
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        centerX - centerSize / 2,
        centerY - centerSize / 2,
        centerSize,
        centerSize
    );

    // Color palette for different sizes
    const colors: { [key] } = {
        1: '#ffb74d',
        2: '#81c784',
        3: '#64b5f6',
        4: '#e57373'
    };

    // Draw each edge
    // Edge 0: top, Edge 1: right, Edge 2: bottom, Edge 3: left
    // Edges go clockwise: top (L→R), right (T→B), bottom (R→L), left (B→T)
    // Squares extend perpendicular to edges, outward from center
    for (let edgeIdx = 0; edgeIdx < 4; edgeIdx++) {
        const edge = corona.edges[edgeIdx];
        const sortedSegs = [...edge].sort((a, b) => a.offset - b.offset);

        for (const seg of sortedSegs) {
            const size = seg.size * scale;
            const offset = seg.offset * scale;

            ctx.fillStyle = colors[seg.size] || '#999';

            let x, y, width, height;

            switch (edgeIdx) {
                case 0: // Top edge (runs left to right)
                    // Square positioned along top edge, extends upward
                    x = centerX - centerSize / 2 + offset;
                    y = centerY - centerSize / 2 - size;
                    width = size;
                    height = size;
                    break;
                case 1: // Right edge (runs top to bottom)
                    // Square positioned along right edge, extends rightward
                    x = centerX + centerSize / 2;
                    y = centerY - centerSize / 2 + offset;
                    width = size;
                    height = size;
                    break;
                case 2: // Bottom edge (runs right to left, clockwise)
                    // Square positioned along bottom edge, extends downward
                    x = centerX + centerSize / 2 - offset - size;
                    y = centerY + centerSize / 2;
                    width = size;
                    height = size;
                    break;
                case 3: // Left edge (runs bottom to top, clockwise)
                    // Square positioned along left edge, extends leftward
                    x = centerX - centerSize / 2 - size;
                    y = centerY + centerSize / 2 - offset - size;
                    width = size;
                    height = size;
                    break;
                default:
                    continue;
            }

            // Draw square
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        }
    }
}

// -----------------------------
// UI Logic
// -----------------------------

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
    const coronasDiv = document.getElementById('coronas') as HTMLDivElement;
    const loadingDiv = document.getElementById('loading') as HTMLDivElement;
    const statsDiv = document.getElementById('stats') as HTMLDivElement;
    const countSpan = document.getElementById('count') as HTMLSpanElement;
    const errorDiv = document.getElementById('error') as HTMLDivElement;

    generateBtn.addEventListener('click', () => {
        try {
            // Show loading
            loadingDiv.style.display = 'block';
            coronasDiv.innerHTML = '';
            statsDiv.style.display = 'none';
            errorDiv.style.display = 'none';

            // Small delay to let UI update
            setTimeout(() => {
                try {
                    const coronas = enumerateUniqueCoronasCenter1();

                    // Hide loading
                    loadingDiv.style.display = 'none';

                    // Show stats
                    countSpan.textContent = coronas.length.toString();
                    statsDiv.style.display = 'block';

                    // Create cards for each corona
                    coronas.forEach((corona, index) => {
                        const card = document.createElement('div');
                        card.className = 'corona-card';

                        const label = document.createElement('div');
                        label.className = 'corona-label';
                        label.textContent = `#${index + 1}: ${corona.toCompact()}`;
                        card.appendChild(label);

                        const canvas = document.createElement('canvas');
                        card.appendChild(canvas);

                        coronasDiv.appendChild(card);

                        drawCorona(corona, canvas);
                    });
                } catch (err) {
                    loadingDiv.style.display = 'none';
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
                }
            }, 10);
        } catch (err) {
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
            errorDiv.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
    });
});
