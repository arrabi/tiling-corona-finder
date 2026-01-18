// ============================================================
// Generate all coronas for center sizes 1-4 and save to JSON
// ============================================================

import { enumerateUniqueCoronas } from './corona-finder.js';
import fs from 'fs';

function generateAllCoronas() {
    const result = {};
    const metadata = {
        generated: new Date().toISOString(),
        centerSizes: [1, 2, 3, 4],
        counts: {}
    };

    console.log('Generating all coronas for center sizes 1-4...\n');

    for (let centerSize = 1; centerSize <= 4; centerSize++) {
        console.log(`Enumerating center = ${centerSize}...`);
        const coronas = enumerateUniqueCoronas(centerSize);
        
        result[centerSize] = coronas.map(c => c.toCompact());
        metadata.counts[centerSize] = coronas.length;
        
        console.log(`  Found ${coronas.length} unique coronas`);
    }

    const totalCount = Object.values(metadata.counts).reduce((sum, count) => sum + count, 0);
    metadata.totalCoronas = totalCount;

    const output = {
        metadata,
        coronas: result
    };

    console.log(`\nTotal coronas: ${totalCount}`);
    console.log('\nSaving to valid-coronas.json...');
    
    fs.writeFileSync('valid-coronas.json', JSON.stringify(output, null, 2), 'utf-8');
    console.log('Done!');
    
    return output;
}

// Run if this is the main module
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    generateAllCoronas();
}

export { generateAllCoronas };
