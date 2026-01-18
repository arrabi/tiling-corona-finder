# Architecture Overview

## System Design

The Tiling Corona Finder is a modular system for enumerating and visualizing valid coronas (local neighborhoods around a central square) in unilateral, equitransitive square tilings.

---

## Core Architecture

### 1. Data Model Layer

#### `EdgeSeg` (Immutable Value Object)
```typescript
interface EdgeSeg {
    readonly size: number;    // Side length of square
    readonly offset: number;  // Position along edge
}
```
- Represents a single square placed on an edge
- Immutable to prevent accidental mutations
- Simple, composable building block

#### `Corona` (Domain Entity)
```typescript
class Corona {
    readonly center: number;
    readonly edges: ReadonlyArray<ReadonlyArray<EdgeSeg>>;
}
```
- Encapsulates complete corona structure
- Immutable arrays for data integrity
- Contains all validation and serialization logic
- Self-contained domain object

**Design Decision**: Immutability throughout ensures predictable behavior and enables safe sharing of corona instances without defensive copying.

---

### 2. Validation Layer

#### Validation Pipeline
```
Corona → validate() → ValidationResult
```

**Multi-stage validation**:
1. **Structural validation**: Center, edge count, non-empty edges
2. **Segment validation**: Size/offset ranges, allowed values
3. **Walk validation**: Continuity, starting point, coverage
4. **Unilateral constraints**: Adjacent sizes, alignment rules

**Design Decision**: Fail-fast validation with detailed error reporting. Each validation step provides context (`where` field) for debugging.

**Return Type**:
```typescript
interface ValidationResult {
    ok: boolean;
    reason?: string;
    where?: any;  // Context about failure location
}
```

---

### 3. Enumeration Engine

#### Strategy: Brute Force with Deduplication

**Process Flow**:
```
1. Generate all valid edge walks for center size
   ↓
2. Generate all 4-edge combinations (cartesian product)
   ↓
3. Validate each corona
   ↓
4. Compute canonical form
   ↓
5. Deduplicate via Set
   ↓
6. Return unique coronas
```

**Edge Walk Generation**:
- Recursive search through segment combinations
- Each segment follows from previous: `next.offset = prev.offset + prev.size`
- Enforces unilateral constraints during generation
- Prunes invalid walks early

**Enumeration Results**:
- **Center = 1**: 3 edge choices → 3^4 = 81 combinations → **24 unique**
- **Center = 2**: 5 edge choices → 5^4 = 625 combinations → **34 unique**
- **Center = 3**: 10 edge choices → 10^4 = 10,000 combinations → **165 unique**
- **Center = 4**: 16 edge choices → 16^4 = 65,536 combinations → **616 unique**

**Design Decision**: Generic `enumerateUniqueCoronas(centerSize)` function works for any center size. Edge walk generation abstracts the complexity of different center sizes.

---

### 4. Deduplication Strategy

#### Canonical Rotation
```typescript
function canonicalRotationEdges(edges): string
```

**Algorithm**:
1. For each of 4 rotations of the edge array
2. Serialize each edge to normalized string
3. Combine into rotation signature
4. Return lexicographically smallest signature

**Example**:
```
[e0, e1, e2, e3] → "e0;e1;e2;e3"
[e1, e2, e3, e0] → "e1;e2;e3;e0"
[e2, e3, e0, e1] → "e2;e3;e0;e1"
[e3, e0, e1, e2] → "e3;e0;e1;e2"
                   ↓
               min(signatures)
```

**Design Decision**: 
- Uses string comparison (simple, deterministic)
- Only cyclic rotation (no reflection) per unilateral requirement
- Edge serialization normalizes segment order for consistency

---

### 5. Serialization Layer

#### Compact Notation Format
```
<center>|<edge0>|<edge1>|<edge2>|<edge3>
```

**Edge Format**: `size^offset,size^offset,...`

**Example**: `1|2^0|2^0|2^0|3^0`

**Design Decisions**:
- Human-readable debugging format
- Reversible (bidirectional conversion)
- Compact for storage
- Easy to parse/generate

**Parsing Strategy**:
```
String → split("|") → [center, e0, e1, e2, e3]
         ↓
Edge string → split(",") → ["size^offset", ...]
              ↓
Regex match → EdgeSeg objects
```

---

### 6. Persistence Layer

#### JSON Storage Format
```json
{
  "metadata": {
    "generated": "2026-01-18T10:44:47.684Z",
    "centerSizes": [1, 2, 3, 4],
    "counts": {
      "1": 24,
      "2": 34,
      "3": 165,
      "4": 616
    },
    "totalCoronas": 839
  },
  "coronas": {
    "1": ["1|2^0|2^0|2^0|2^0", ...],
    "2": ["2|3^0|3^0|3^0|3^0", ...],
    "3": [...],
    "4": [...]
  }
}
```

**Design Decisions**:
- Single file contains all center sizes (1-4)
- Metadata section with counts and timestamp
- Coronas grouped by center size for easy access
- Compact notation for storage efficiency
- Human-readable JSON (2-space indent)

**File**:
- `valid-coronas.json` - All 839 unique coronas for centers 1-4

**Generation Script**:
- `generate-all-coronas.js` - Enumerates all centers 1-4 and saves to JSON

---

### 7. Visualization Layer (Web)

#### Architecture: Client-Side Rendering

**Components**:
```
index.html → UI structure
web-app.ts → Logic + Corona classes (duplicated)
web-app.js → Compiled browser code
```

**Design Decision**: Duplicate corona logic in web app rather than compile/bundle the main TypeScript. Keeps web app simple and standalone.

#### Canvas Rendering Strategy

**Coordinate System**:
- Canvas center = corona center
- Scale factor: 20 pixels per unit
- Dynamic canvas sizing based on overhang

**Drawing Order**:
1. Clear canvas (light gray background)
2. Draw center square (purple, 2px border)
3. Draw edge squares (color by size, 2px border)

**Positioning Algorithm**:
```typescript
// Squares extend perpendicular from edges
switch (edgeIndex) {
  case 0: // Top: extend upward
    x = centerX - centerSize/2 + offset
    y = centerY - centerSize/2 - size
  case 1: // Right: extend rightward
    x = centerX + centerSize/2
    y = centerY - centerSize/2 + offset
  case 2: // Bottom: extend downward (clockwise from right)
    x = centerX + centerSize/2 - offset - size
    y = centerY + centerSize/2
  case 3: // Left: extend leftward (clockwise from bottom)
    x = centerX - centerSize/2 - size
    y = centerY + centerSize/2 - offset - size
}
```

**Design Decision**: Explicit positioning formulas per edge ensure correct clockwise convention.

---

## Technology Stack

### Backend/CLI
- **JavaScript (ES6+)**: Modern features with ES modules
- **Node.js**: Runtime for CLI scripts
- **No build step**: Direct execution of JS files

### Web Application
- **Vanilla JavaScript**: No framework overhead
- **HTML5 Canvas**: Direct rendering control
- **Simple HTTP Server**: npm http-server

### Data
- **JSON**: Human-readable storage
- **Python**: Old scripts in `old-ignored-stuff/` (reference only)

---

## Design Principles

### 1. **Math-Faithful Implementation**
- Code directly reflects mathematical definitions
- No premature optimization
- Clarity over cleverness

### 2. **Immutability by Default**
- Readonly arrays and objects
- No side effects in core logic
- Predictable behavior

### 3. **Fail-Fast Validation**
- Comprehensive error checking
- Detailed error messages
- Context information for debugging

### 4. **Explicit Over Implicit**
- Clear naming conventions
- Documented edge conventions
- No magic numbers

### 5. **Separation of Concerns**
- Data model isolated from validation
- Enumeration separate from deduplication
- Visualization independent of core logic

---

## File Organization

```
/
├── corona.ts              # Shared Corona class and interfaces
├── corona-finder.ts       # Core TypeScript implementation
├── generate.ts            # TypeScript script for JSON generation
├── web-app.ts             # Web application (standalone)
├── index.html             # Web UI
├── valid-coronas.json     # Pre-computed results
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── README.md              # User documentation
└── .github/
    └── copilot-instructions.md  # AI assistant context
```

---

## Extension Points

### Adding New Center Sizes

1. **Implement edge walk generator**:
   ```typescript
   function generateEdgeWalks(center: number): EdgeSeg[][]
   ```
   - Generate all valid combinations of segments
   - Respect offset and walk constraints
   - Return array of valid edge configurations

2. **Create enumeration function**:
   ```typescript
   function enumerateUniqueCoronas(center: number): Corona[]
   ```
   - Use cartesian product of edge walks
   - Apply validation
   - Deduplicate

3. **Generate and store**:
   ```bash
   npm run generate  # Update script for new center
   ```

### Adding Visualization Features

**Potential enhancements**:
- Zoom/pan controls
- Hover tooltips with compact notation
- Export to SVG
- Animation of enumeration process
- Edge coloring by offset
- Interactive corona builder

### Performance Optimization

**When needed for larger centers**:
- Pre-filter edges before corona generation
- Parallel enumeration (Web Workers)
- Incremental deduplication
- Indexed canonical forms
- Streaming JSON for large datasets

---

## Constraints and Limitations

### Current Limitations

1. **Center sizes**: 1-4 implemented ✓
2. **Square sizes**: Fixed to [1, 2, 3, 4]
3. **No global tiling**: Only local coronas
4. **No compatibility analysis**: Not yet implemented
5. **Memory**: All coronas kept in memory (manageable for 839 coronas)

### Scalability Considerations

**Center size complexity (actual counts)**:
- Center 1: 24 unique coronas
- Center 2: 34 unique coronas
- Center 3: 165 unique coronas
- Center 4: 616 unique coronas
- **Total: 839 coronas**

**Edge walk counts by center**:
- Center 1: 3 valid edge walks
- Center 2: 5 valid edge walks
- Center 3: 10 valid edge walks
- Center 4: 16 valid edge walks

**Memory usage**: ~100 bytes per corona in memory (~84 KB total)

**Computation time**: 
- Center 1-2: Instant (<10ms)
- Center 3: Fast (~100ms)
- Center 4: Moderate (~2-3 seconds)
- Scales exponentially with edge walk complexity

---

## Testing Strategy

### Validation Testing
- Unit tests for each validation rule
- Edge cases (empty, negative, invalid)
- Known valid/invalid examples

### Enumeration Testing
- Count verification against expected results (24, 34, 165, 616)
- All coronas pass validation
- Duplicate detection via canonical rotation
- Canonical form consistency
- Edge walk generation correctness

### Serialization Testing
- Roundtrip: `Corona → compact → Corona`
- Edge cases in parsing
- Invalid notation handling

### Visualization Testing
- Manual inspection of rendered coronas
- Reference image comparison
- Position calculation verification

---

## Future Architecture Evolution

### Phase 2: Global Tiling
- Constraint satisfaction solver
- Edge compatibility checking
- Tile propagation algorithm
- Backtracking search

### Phase 3: Analysis Tools
- Corona statistics
- Symmetry group analysis
- Edge distribution patterns
- Frequency analysis

### Phase 4: Interactive System
- Real-time corona builder
- Constraint visualizer
- Tiling explorer
- Educational tools

---

## References

- **Original implementation**: `original_app.py`
- **Copilot instructions**: `.github/copilot-instructions.md`
- **Main documentation**: `README.md`
- **Research context**: Doris Schattschneider's tiling work
