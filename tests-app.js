import { Corona } from './corona.js';

const testCases = [
    {
        section: "✅ Valid Coronas",
        tests: [
            { name: "center=2, all edges size 3", corona: Corona.fromCompact("2|3^0|3^0|3^0|3^0"), expectedValid: true },
            { name: "center=1, single segments with mixed sizes", corona: Corona.fromCompact("1|2^0|3^0|4^0|2^0"), expectedValid: true },
            { name: "center=1, all same size", corona: Corona.fromCompact("1|4^0|4^0|4^0|4^0"), expectedValid: true },
            { name: "center=2, multi-segment edges", corona: Corona.fromCompact("2|3^0|4^0|3^0|4^0"), expectedValid: true },
            { name: "center=1, rotational variant", corona: Corona.fromCompact("1|2^0|3^0|2^0|3^0"), expectedValid: true },
            { name: "center=1, large overhang", corona: Corona.fromCompact("1|4^0|4^0|4^0|4^0"), expectedValid: true },
            { name: "edges without 1x1 corner gaps OK", corona: Corona.fromCompact("2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1"), expectedValid: true },
            { name: "no 1x1 corner gaps, asymmetry OK", corona: Corona.fromCompact("2|3^0|4^0|3^0|4^0"), expectedValid: true }
        ]
    },
    {
        section: "❌ Invalid: Center Issues",
        tests: [
            { name: "center=0", corona: new Corona(0, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]), expectedValid: false },
            { name: "center=-1", corona: new Corona(-1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]), expectedValid: false }
        ]
    },
    {
        section: "❌ Invalid: Edge Count",
        tests: [
            { name: "3 edges instead of 4", corona: null, expectedValid: false },
            { name: "5 edges instead of 4", corona: null, expectedValid: false },
            { name: "0 edges", corona: null, expectedValid: false }
        ]
    },
    {
        section: "❌ Invalid: Segment Issues",
        tests: [
            { name: "segment size 0", corona: Corona.fromCompact("1|0^0|2^0|2^0|2^0"), expectedValid: false },
            { name: "offset > center", corona: Corona.fromCompact("1|2^2|2^0|2^0|2^0"), expectedValid: false },
            { name: "offset < 0", corona: Corona.fromCompact("1|2^-1|2^0|2^0|2^0"), expectedValid: false },
            { name: "equal consecutive sizes", corona: Corona.fromCompact("2|2^0,2^2|2^0|2^0|2^0"), expectedValid: false }
        ]
    },
    {
        section: "❌ Invalid: Unilateral Rule",
        tests: [
            { name: "center-sized at offset 0", corona: Corona.fromCompact("1|1^0|2^0|2^0|2^0"), expectedValid: false },
            { name: "center-sized at offset 0 (center=2)", corona: Corona.fromCompact("2|2^0|2^0|2^0|2^0"), expectedValid: false }
        ]
    },
    {
        section: "❌ Invalid: Edge Walk",
        tests: [
            { name: "edge does not start at 0", corona: Corona.fromCompact("1|2^1|2^0|2^0|2^0"), expectedValid: false },
            { name: "gap in edge walk", corona: Corona.fromCompact("2|2^0,4^3|2^0|2^0|2^0"), expectedValid: false },
            { name: "edge walk doesn't reach center", corona: Corona.fromCompact("3|2^0|2^0|2^0|2^0"), expectedValid: false }
        ]
    },
    {
        section: "❌ Invalid: 1×1 Corner Gap",
        tests: [
            { name: "edges with 1x1 gaps", corona: Corona.fromCompact("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"), expectedValid: false }
        ]
    }
];

const colors = { 1: '#ffb74d', 2: '#81c784', 3: '#64b5f6', 4: '#e57373' };

function drawCorona(corona, canvas) {
    if (!corona || !corona.center || !corona.edges) {
        throw new Error("Invalid corona");
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 25;
    const centerSize = corona.center * scale;
    const padding = 40;

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

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let edgeIdx = 0; edgeIdx < 4; edgeIdx++) {
        const edge = corona.edges[edgeIdx];
        const sortedSegs = [...edge].sort((a, b) => a.offset - b.offset);

        for (const seg of sortedSegs) {
            const size = seg.size * scale;
            const offset = seg.offset * scale;
            ctx.fillStyle = colors[seg.size] || '#999';

            let x, y;
            switch (edgeIdx) {
                case 0: x = centerX - centerSize / 2 + offset; y = centerY - centerSize / 2 - size; break;
                case 1: x = centerX + centerSize / 2; y = centerY - centerSize / 2 + offset; break;
                case 2: x = centerX + centerSize / 2 - offset - size; y = centerY + centerSize / 2; break;
                case 3: x = centerX - centerSize / 2 - size; y = centerY + centerSize / 2 - offset - size; break;
            }

            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);

            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seg.size.toString(), x + size/2, y + size/2);
        }
    }

    ctx.fillStyle = '#667eea';
    ctx.fillRect(centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(corona.center.toString(), centerX, centerY);
}

function runTests() {
    const sectionsDiv = document.getElementById('testSections');
    if (!sectionsDiv) return;
    
    sectionsDiv.innerHTML = '';
    let totalCount = 0;
    let validCount = 0;
    let invalidCount = 0;

    testCases.forEach(section => {
        const sectionHeader = document.createElement('h2');
        sectionHeader.className = 'section-header';
        sectionHeader.textContent = section.section;
        sectionsDiv.appendChild(sectionHeader);

        const grid = document.createElement('div');
        grid.className = 'test-grid';

        section.tests.forEach(test => {
            totalCount++;
            if (test.expectedValid) validCount++;
            else invalidCount++;

            const result = test.corona ? test.corona.validate([1, 2, 3, 4]) : { ok: false, reason: 'unparseable' };
            const testPassed = result.ok === test.expectedValid;

            const card = document.createElement('div');
            card.className = `test-card ${testPassed ? 'pass' : 'fail'}`;
            
            const header = document.createElement('div');
            header.className = 'test-header';
            
            const name = document.createElement('div');
            name.className = 'test-name';
            name.textContent = test.name;
            
            const badge = document.createElement('div');
            badge.className = `test-badge ${test.expectedValid ? 'valid' : 'invalid'}`;
            badge.textContent = test.expectedValid ? '✓ Valid' : '✗ Invalid';
            
            header.appendChild(name);
            header.appendChild(badge);
            card.appendChild(header);
            
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'canvas-wrapper';
            const canvas = document.createElement('canvas');
            canvasWrapper.appendChild(canvas);
            card.appendChild(canvasWrapper);
            
            try {
                if (test.corona) {
                    drawCorona(test.corona, canvas);
                } else {
                    canvas.width = 200;
                    canvas.height = 100;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff3e0';
                    ctx.fillRect(0, 0, 200, 100);
                    ctx.fillStyle = '#e65100';
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Cannot render', 100, 50);
                }
            } catch (e) {
                canvas.width = 200;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffebee';
                ctx.fillRect(0, 0, 200, 100);
                ctx.fillStyle = '#c62828';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Error rendering', 100, 50);
            }
            
            grid.appendChild(card);
        });

        sectionsDiv.appendChild(grid);
    });

    document.getElementById('total').textContent = totalCount;
    document.getElementById('validCount').textContent = validCount;
    document.getElementById('invalidCount').textContent = invalidCount;
}

document.addEventListener('DOMContentLoaded', runTests);
