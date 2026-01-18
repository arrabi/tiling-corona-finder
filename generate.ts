// Script to generate and save coronas to JSON
import * as fs from 'fs';
import { Corona } from './corona';

function canonicalRotationEdges(edges: ReadonlyArray<ReadonlyArray<{ size: number; offset: number }>>) {
    function edgeKey(e: ReadonlyArray<{ size: number; offset: number }>) {
        const sorted = [...e].sort((a, b) => 
            a.offset !== b.offset ? a.offset - b.offset : a.size - b.size
        );
        return JSON.stringify(sorted.map(seg => [seg.size, seg.offset]));
    }
    const keys: string[] = [];
    for (let k = 0; k < 4; k++) {
        const rot = [...edges.slice(k), ...edges.slice(0, k)];
        const rotKey = rot.map(e => edgeKey(e)).join(";");
        keys.push(rotKey);
    }
    keys.sort();
    return keys[0];
}

function enumerateUniqueCoronasCenter1(): Corona[] {
    const c = 1;
    const allowedSizes = [1, 2, 3, 4];
    const edgeChoices = [
        [{ size: 2, offset: 0 }],
        [{ size: 3, offset: 0 }],
        [{ size: 4, offset: 0 }]
    ];
    const seen = new Set<string>();
    const unique: Corona[] = [];
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

// Main execution
console.log('Generating coronas for center = 1...');
const coronas = enumerateUniqueCoronasCenter1();
console.log(`Found ${coronas.length} unique coronas`);

// Save to JSON
const outputData = {
    center: 1,
    count: coronas.length,
    generated: new Date().toISOString(),
    coronas: coronas.map(c => c.toCompact())
};

fs.writeFileSync('coronas-center-1.json', JSON.stringify(outputData, null, 2));
console.log('✓ Saved to coronas-center-1.json');

// Display first few
console.log('\nFirst 5 coronas:');
coronas.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.toCompact()}`);
});
