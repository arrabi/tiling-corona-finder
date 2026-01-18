import * as fs from 'fs';
import { Corona, enumerateUniqueCoronasCenter1 } from './corona-finder';

function main(): void {
    console.log('Generating coronas for center = 1...');
    const coronas = enumerateUniqueCoronasCenter1();
    console.log(`Found ${coronas.length} unique coronas`);
    
    // Save to JSON file
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
}

main();
