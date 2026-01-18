// Test visualization app for Corona.validate()

import { Corona,  } from './corona.js';

// -----------------------------
// Test definitions
// -----------------------------

TestCase {
    name;
    corona | null;  // null if corona can't be parsed
    compactNotation;
    expectedValid;
    expectedReason?;
}

function createTestCases(): { section; tests: TestCase[] }[] {
    return [
        {
            section: "✅ Valid Coronas",
            tests: [
                {
                    name: "center=2, all edges size 3",
                    compactNotation: "2|3^0|3^0|3^0|3^0",
                    corona.fromCompact("2|3^0|3^0|3^0|3^0"),
                    expectedValid: true
                },
                {
                    name: "center=2, mixed sizes 3 and 4",
                    compactNotation: "2|3^0|3^0|3^0|4^0",
                    corona.fromCompact("2|3^0|3^0|3^0|4^0"),
                    expectedValid: true
                },
                {
                    name: "center=1, single segment size 2",
                    compactNotation: "1|2^0|2^0|2^0|2^0",
                    corona.fromCompact("1|2^0|2^0|2^0|2^0"),
                    expectedValid: true
                },
                {
                    name: "center=1, mixed sizes 2,3,4",
                    compactNotation: "1|2^0|3^0|4^0|2^0",
                    corona.fromCompact("1|2^0|3^0|4^0|2^0"),
                    expectedValid: true
                },
                {
                    name: "center=3, edge with overhang",
                    compactNotation: "3|4^0|4^0|4^0|4^0",
                    corona.fromCompact("3|4^0|4^0|4^0|4^0"),
                    expectedValid: true
                },
                {
                    name: "overhang allowed (extends past center)",
                    compactNotation: "2|4^0|4^0|4^0|4^0",
                    corona.fromCompact("2|4^0|4^0|4^0|4^0"),
                    expectedValid: true
                },
                {
                    name: "corner gap larger than 1x1 is OK",
                    compactNotation: "2|3^0|4^0|3^0|4^0",
                    corona.fromCompact("2|3^0|4^0|3^0|4^0"),
                    expectedValid: true
                }
            ]
        },
        {
            section: "❌ Invalid: Center Issues",
            tests: [
                {
                    name: "center = 0",
                    compactNotation: "center=0 (not parseable)",
                    corona: new Corona(0, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "center must be a positive integer"
                },
                {
                    name: "center = -1",
                    compactNotation: "center=-1 (not parseable)",
                    corona: new Corona(-1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "center must be a positive integer"
                }
            ]
        },
        {
            section: "❌ Invalid: Edge Count",
            tests: [
                {
                    name: "only 3 edges",
                    compactNotation: "3 edges (not parseable)",
                    corona: new Corona(1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "edges must have length 4"
                },
                {
                    name: "5 edges",
                    compactNotation: "5 edges (not parseable)",
                    corona: new Corona(1, [[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "edges must have length 4"
                },
                {
                    name: "empty edge",
                    compactNotation: "has empty edge",
                    corona: new Corona(1, [[{size:2,offset:0}],[],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "edge empty"
                }
            ]
        },
        {
            section: "❌ Invalid: Segment Size",
            tests: [
                {
                    name: "segment size 5 not in allowed list",
                    compactNotation: "1|5^0|2^0|2^0|2^0",
                    corona.fromCompact("1|5^0|2^0|2^0|2^0"),
                    expectedValid: false,
                    expectedReason: "invalid segment size"
                }
            ]
        },
        {
            section: "❌ Invalid: Offset Issues",
            tests: [
                {
                    name: "negative offset",
                    compactNotation: "has offset=-1",
                    corona: new Corona(2, [[{size:2,offset:-1}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "offset out of range"
                },
                {
                    name: "offset > center",
                    compactNotation: "has offset=3 with center=2",
                    corona: new Corona(2, [[{size:2,offset:3}],[{size:2,offset:0}],[{size:2,offset:0}],[{size:2,offset:0}]]),
                    expectedValid: false,
                    expectedReason: "offset out of range"
                }
            ]
        },
        {
            section: "❌ Invalid: Unilateral Rule",
            tests: [
                {
                    name: "center-sized segment at offset 0",
                    compactNotation: "2|2^0|2^0|2^0|2^0",
                    corona.fromCompact("2|2^0|2^0|2^0|2^0"),
                    expectedValid: false,
                    expectedReason: "not unilateral (center-sized aligned)"
                },
                {
                    name: "center=1, size=1 at offset=0",
                    compactNotation: "1|1^0|2^0|2^0|2^0",
                    corona.fromCompact("1|1^0|2^0|2^0|2^0"),
                    expectedValid: false,
                    expectedReason: "not unilateral (center-sized aligned)"
                },
                {
                    name: "two consecutive segments same size",
                    compactNotation: "3|1^0,1^1,2^2|4^0|4^0|4^0",
                    corona: new Corona(3, [
                        [{size:1,offset:0},{size:1,offset:1},{size:2,offset:2}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}]
                    ]),
                    expectedValid: false,
                    expectedReason: "not unilateral (equal adjacent sizes)"
                }
            ]
        },
        {
            section: "❌ Invalid: Edge Walk",
            tests: [
                {
                    name: "edge does not start at 0",
                    compactNotation: "edge starts at offset 1",
                    corona: new Corona(2, [
                        [{size:2,offset:1}],
                        [{size:3,offset:0}],
                        [{size:3,offset:0}],
                        [{size:3,offset:0}]
                    ]),
                    expectedValid: false,
                    expectedReason: "edge does not start at 0"
                },
                {
                    name: "edge walk has gap",
                    compactNotation: "4|1^0,2^3|... (gap at 1-3)",
                    corona: new Corona(4, [
                        [{size:1,offset:0},{size:2,offset:3}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}]
                    ]),
                    expectedValid: false,
                    expectedReason: "invalid edge walk"
                },
                {
                    name: "edge too short (doesn't reach center)",
                    compactNotation: "4|1^0|...",
                    corona: new Corona(4, [
                        [{size:1,offset:0}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}],
                        [{size:4,offset:0}]
                    ]),
                    expectedValid: false,
                    expectedReason: "edge does not reach center length"
                }
            ]
        },
        {
            section: "✅ Valid: Symmetric Corner Gaps",
            tests: [
                {
                    name: "symmetric edges (all 1^0,2^1) - corner gaps OK",
                    compactNotation: "2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1",
                    corona.fromCompact("2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1"),
                    expectedValid: true
                },
                {
                    name: "no corner gaps, asymmetry OK",
                    compactNotation: "2|3^0|4^0|3^0|4^0",
                    corona.fromCompact("2|3^0|4^0|3^0|4^0"),
                    expectedValid: true
                }
            ]
        },
        {
            section: "❌ Invalid: Asymmetric Corner Gaps",
            tests: [
                {
                    name: "asymmetric last segments [2,2,4,4] with corner gaps",
                    compactNotation: "2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1",
                    corona.fromCompact("2|1^0,2^1|1^0,2^1|1^0,4^1|1^0,4^1"),
                    expectedValid: false,
                    expectedReason: "1x1 corner gap with asymmetric edges"
                }
            ]
        }
    ];
}

// -----------------------------
// Visualization
// -----------------------------

function drawCorona(corona, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 25;
    const centerSize = corona.center * scale;
    const padding = 60;

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
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Color palette for different sizes
    const colors: { [key] } = {
        1: '#ffb74d',
        2: '#81c784',
        3: '#64b5f6',
        4: '#e57373'
    };

    // Draw each edge first (so center is on top)
    for (let edgeIdx = 0; edgeIdx < 4; edgeIdx++) {
        const edge = corona.edges[edgeIdx];
        const sortedSegs = [...edge].sort((a, b) => a.offset - b.offset);

        for (const seg of sortedSegs) {
            const size = seg.size * scale;
            const offset = seg.offset * scale;

            ctx.fillStyle = colors[seg.size] || '#999';

            let x, y;

            switch (edgeIdx) {
                case 0: // Top edge
                    x = centerX - centerSize / 2 + offset;
                    y = centerY - centerSize / 2 - size;
                    break;
                case 1: // Right edge
                    x = centerX + centerSize / 2;
                    y = centerY - centerSize / 2 + offset;
                    break;
                case 2: // Bottom edge
                    x = centerX + centerSize / 2 - offset - size;
                    y = centerY + centerSize / 2;
                    break;
                case 3: // Left edge
                    x = centerX - centerSize / 2 - size;
                    y = centerY + centerSize / 2 - offset - size;
                    break;
                default:
                    continue;
            }

            // Draw square
            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);

            // Draw size label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seg.size.toString(), x + size/2, y + size/2);
        }
    }

    // Draw center square on top
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

    // Draw center label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(corona.center.toString(), centerX, centerY);
}

function drawInvalidPlaceholder(canvas: HTMLCanvasElement, message) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 100;

    ctx.fillStyle = '#ffebee';
    ctx.fillRect(0, 0, 200, 100);

    ctx.fillStyle = '#c62828';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️ Cannot render', 100, 40);
    ctx.font = '11px sans-serif';
    ctx.fillText(message, 100, 60);
}

// -----------------------------
// UI Logic
// -----------------------------

document.addEventListener('DOMContentLoaded', () => {
    const sectionsDiv = document.getElementById('testSections') as HTMLDivElement;
    const totalSpan = document.getElementById('total') as HTMLSpanElement;
    const validCountSpan = document.getElementById('validCount') as HTMLSpanElement;
    const invalidCountSpan = document.getElementById('invalidCount') as HTMLSpanElement;

    const testSections = createTestCases();
    
    let totalTests = 0;
    let validTests = 0;
    let invalidTests = 0;

    testSections.forEach(section => {
        // Section header
        const header = document.createElement('h2');
        header.className = 'section-header';
        header.textContent = section.section;
        sectionsDiv.appendChild(header);

        // Test grid
        const grid = document.createElement('div');
        grid.className = 'test-grid';
        sectionsDiv.appendChild(grid);

        section.tests.forEach(test => {
            totalTests++;
            if (test.expectedValid) validTests++;
            else invalidTests++;

            const card = document.createElement('div');
            card.className = `test-card ${test.expectedValid ? 'valid' : 'invalid'}`;

            // Header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'test-header';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'test-name';
            nameDiv.textContent = test.name;

            const badge = document.createElement('div');
            badge.className = `test-badge ${test.expectedValid ? 'valid' : 'invalid'}`;
            badge.textContent = test.expectedValid ? '✓ Valid' : '✗ Invalid';

            headerDiv.appendChild(nameDiv);
            headerDiv.appendChild(badge);
            card.appendChild(headerDiv);

            // Compact notation
            const compactDiv = document.createElement('div');
            compactDiv.className = 'test-compact';
            compactDiv.textContent = test.compactNotation;
            card.appendChild(compactDiv);

            // Reason (for invalid tests)
            if (!test.expectedValid && test.expectedReason) {
                const reasonDiv = document.createElement('div');
                reasonDiv.className = 'test-reason';
                reasonDiv.textContent = `Reason: ${test.expectedReason}`;
                card.appendChild(reasonDiv);
            }

            // Actual validation result
            if (test.corona) {
                const result = test.corona.validate();
                const match = result.ok === test.expectedValid;
                if (!match) {
                    const mismatchDiv = document.createElement('div');
                    mismatchDiv.className = 'test-reason';
                    mismatchDiv.style.background = '#fff3e0';
                    mismatchDiv.style.color = '#e65100';
                    mismatchDiv.textContent = `⚠️ Mismatch! Got: ${result.ok ? 'valid' : result.reason}`;
                    card.appendChild(mismatchDiv);
                }
            }

            // Canvas
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'canvas-wrapper';
            const canvas = document.createElement('canvas');
            canvasWrapper.appendChild(canvas);
            card.appendChild(canvasWrapper);

            // Draw corona or placeholder
            if (test.corona && test.corona.center > 0 && test.corona.edges.length === 4) {
                try {
                    drawCorona(test.corona, canvas);
                } catch (e) {
                    drawInvalidPlaceholder(canvas, 'Rendering error');
                }
            } else {
                drawInvalidPlaceholder(canvas, test.expectedReason || 'Invalid structure');
            }

            grid.appendChild(card);
        });
    });

    // Update stats
    totalSpan.textContent = totalTests.toString();
    validCountSpan.textContent = validTests.toString();
    invalidCountSpan.textContent = invalidTests.toString();
});
