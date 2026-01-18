# Tiling Corona Finder

## Project Summary: Equitransitive Square Corona Enumeration

### Problem

We study a tiling problem originating with **Doris Schattschneider**: classify **unilateral, equitransitive tilings** of the plane by squares of different integer sizes.

She studied and enumerated all valid patterns with 3 square sizes (1, 2, & 3).

This research is to find all valid patterns with 4 square sizes (1, 2, 3, & 4).

The algorithm to find such valid patterns:
1- enumerate all coronas with a center of size 1, then center of size 2, then 3, then 4.
2- For each corona, find other compatible coronas with it
3- if we find 4 compatible coronas (one with a different square-size in center), we can put them together to make a valid tiling pattern. 
4- enumerate all these possible patterns.

A key step is enumerating all **valid local neighborhoods ("coronas")** around a central square that satisfy the geometric and symmetry constraints.

This code focuses on **enumerating unique valid coronas**, starting with small center sizes (currently implemented for center = 1).

---

## Quick Start

### Prerequisites

- Node.js (v16 or higher with ES modules support)

### Installation

```bash
npm install
```

Note: No build step required! All code is plain JavaScript.

### Run

```bash
npm start
```

Expected output:
```
Enumerating coronas for center = 1...
Unique coronas with center = 1: 24

Enumerating coronas for center = 2...
Unique coronas with center = 2: 34

Sample 2-coronas:
2|1^0,2^1|1^0,2^1|1^0,2^1|1^0,2^1
2|1^0,2^1|1^0,2^1|1^0,2^1|3^0
...
```

### Run Tests

```bash
npm test
```

Expected output:
```
✓ valid: center=2, all edges size 3
✓ valid: center=1, mixed edge sizes
...
33 passed, 0 failed
```

### Other Commands

- **Generate JSON**: `npm run generate`
- **Start web server**: `npm run serve` (serves on port 8000)

### Pre-generated Data

The repository includes `valid-coronas.json` with all unique coronas for center sizes 1-4:
- Center 1: 24 coronas
- Center 2: 34 coronas
- Center 3: 165 coronas
- Center 4: 616 coronas
- **Total: 839 coronas**

This allows you to:
- Load coronas without recalculating them
- Use as reference data for testing
- Start compatibility analysis without regenerating coronas

To regenerate the JSON file:
```bash
node generate-all-coronas.js
```

---

## Goal / Solution

Build a **computational framework** that:

1. Represents a corona (a central square plus squares attached along its four edges)
2. Validates whether a corona satisfies the required constraints
3. Enumerates all valid coronas for a given center size
4. Removes duplicates using **equitransitivity** (cyclic rotation of edges)

This framework will later scale to centers of size 2, 3, and 4 and be extended toward global tiling enumeration.

---

## Representation

### Corona Structure

A **Corona** has:
- `center`: integer side length of the central square
- `edges`: a list of 4 edges in cyclic order

### Edge Segments

Each edge is a **walk of segments**:
- A segment is `{size, offset}` meaning a square of side `size` starts at `offset` along the edge
- Offsets must satisfy `0 ≤ offset ≤ center`
- Overhang past the edge is allowed

### Compact Notation

Coronas can be serialized to/from a compact string form:

```
<center>|s^o,s^o|s^o|s^o,s^o|s^o
```

Example:
```
1|2^0|2^0|2^0|3^0
```

This represents a corona with:
- Center size: 1
- Edge 0: one segment of size 2 at offset 0
- Edge 1: one segment of size 2 at offset 0
- Edge 2: one segment of size 2 at offset 0
- Edge 3: one segment of size 3 at offset 0

---

## Validation Rules

A corona is valid if:

### Basic Structure
- It has exactly 4 edges
- Center is a positive integer

### Edge Constraints
Each edge must:
- Start at offset 0
- Form a real walk: next offset = previous offset + previous size
- Reach at least the center length (overhang allowed)
- Use only allowed segment sizes (default: 1, 2, 3, 4)

### Unilateral Constraints
- No two consecutive squares on an edge have the same size
- A square with the same size as the center cannot be placed at offset 0 (perfect alignment is forbidden)

No corner or vertex logic is used; everything is edge-based.

---

## Enumeration & Deduplication

### Edge Walk Generation

For any center size, the algorithm generates all valid edge walks:
- Each walk is a sequence of segments covering the center length
- Segments must form a real walk (next offset = prev offset + prev size)
- Walk must start at offset 0 and reach at least the center size
- Excludes segments with size == center at offset == 0 (unilateral)
- Excludes consecutive segments with equal sizes (unilateral)

### Center Size Examples

**Center = 1:**
- Valid edges: `(2,0)`, `(3,0)`, `(4,0)` (single segments only)
- Segment `(1,0)` excluded by unilateral rule
- Result: **24 unique coronas**

**Center = 2:**
- Valid edges include:
  - Single segments: `(3,0)`, `(4,0)` (not `(2,0)`)
  - Two segments: `(1,0),(2,1)`, `(1,0),(3,1)`, `(1,0),(4,1)`, etc.
- Result: **34 unique coronas**

**Center = 3:**
- Valid edges include more complex walks with up to 3 segments
- Result: **165 unique coronas**

**Center = 4:**
- Most complex edge walks with up to 4 segments
- Result: **616 unique coronas**

### Deduplication

- All 4-edge combinations are generated from valid edge walks
- Coronas are **deduplicated up to cyclic rotation** of the four edges (equitransitive symmetry)
- Reflections are *not* identified (unilateral assumption)

---

## Code Structure

### Core Types

```typescript
interface EdgeSeg {
    readonly size: number;
    readonly offset: number;
}

interface ValidationResult {
    ok: boolean;
    reason?: string;
    where?: any;
}
```

### Corona Class

- `validate(allowedSizes?)`: enforces all constraints
- `toCompact()`: serialize to compact notation
- `fromCompact(s)`: parse from compact notation

### Functions

- `canonicalRotationEdges()`: compute canonical form for deduplication
- `generateEdgeWalks(centerSize)`: generate all valid edge walks for any center size
- `enumerateUniqueCoronas(centerSize)`: enumerate all unique coronas for any center size
- `enumerateUniqueCoronasCenter1()`: convenience function for center = 1
- `enumerateUniqueCoronasCenter2()`: convenience function for center = 2

### Exports

All main types and functions are exported for modular use:

```typescript
import { Corona, EdgeSeg, ValidationResult } from './corona';
```

---

## Web Interface

View the web interface:
```bash
npm run serve
```

Then open http://localhost:8000/ in your browser.

- **Main page** (`index.html`): Generate and visualize coronas with center=1
- **Tests page** (`tests.html`): Visual test suite showing all validation test cases

---

## JavaScript Implementation

This implementation uses:
- **ES6 Modules** for clean imports/exports
- **Classes** with validation and serialization methods
- **No build step** - runs directly in Node.js and browsers
- **Static methods** for factory patterns
- **Simple and maintainable** code

---

## Next Steps

- Generalize edge-walk generation for center sizes 2, 3, and 4
- Improve pruning during enumeration (edge-level constraints first)
- Extend from local coronas to global tiling propagation
- Expand test coverage
- Enhance web visualization interface

---

## Files

- `corona.js` - Shared Corona class and validation logic
- `corona-finder.js` - Main enumeration implementation with edge walk generation
- `generate-all-coronas.js` - Script to generate all coronas (centers 1-4) and save to JSON
- `valid-coronas.json` - Pre-generated data with all 839 unique coronas
- `web-app.js` - Web application for visualization
- `tests-app.js` - Test suite visualization
- `corona-finder-test.js` - Unit tests
- `index.html` - Web UI for corona enumeration
- `tests.html` - Web UI for validation tests
- `package.json` - Node.js configuration

---

## References

This code is intentionally minimal, explicit, and math-faithful to support correctness before optimization.

Based on the tiling research of **Doris Schattschneider**.
