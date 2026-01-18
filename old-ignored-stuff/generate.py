#!/usr/bin/env python3
"""Generate and save coronas to JSON file"""

import json
from datetime import datetime
from original_app import enumerate_unique_coronas_center_1

print('Generating coronas for center = 1...')
coronas = enumerate_unique_coronas_center_1()
print(f'Found {len(coronas)} unique coronas')

# Create output data
data = {
    'center': 1,
    'count': len(coronas),
    'generated': datetime.now().isoformat(),
    'coronas': [c.to_compact() for c in coronas]
}

# Save to JSON file
with open('coronas-center-1.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✓ Saved to coronas-center-1.json')

# Display first few
print('\nFirst 5 coronas:')
for i, c in enumerate(coronas[:5], 1):
    print(f'  {i}. {c.to_compact()}')
