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
1. Generate all edge configurations
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

**For center = 1**:
- Edge choices: `[2^0]`, `[3^0]`, `[4^0]` (3 options)
- Total combinations: 3^4 = 81
- After validation: 81 (all valid for center=1)
- After deduplication: 24 unique

**Design Decision**: Simple brute force is sufficient for small center sizes. Complexity scales as O(choices^4), manageable for centers 1-4.

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
  "center": 1,
  "count": 24,
  "generated": "ISO-8601",
  "coronas": ["compact", "notation", ...]
}
```

**Design Decisions**:
- Metadata included (center, count, timestamp)
- Coronas stored in compact notation (not full objects)
- Human-readable JSON (2-space indent)
- One file per center size

**Files**:
- `coronas-center-1.json` (current)
- `coronas-center-2.json` (future)
- etc.

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
- **TypeScript**: Type safety, modern features
- **Node.js**: Runtime for CLI scripts
- **ts-node**: Direct TypeScript execution

### Web Application
- **Vanilla TypeScript**: No framework overhead
- **HTML5 Canvas**: Direct rendering control
- **Simple HTTP Server**: Python's built-in server

### Data
- **JSON**: Human-readable storage
- **Python**: Alternative generation scripts (compatibility)

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
├── corona-finder.ts       # Core TypeScript implementation
├── generate.py            # Python script for JSON generation
├── generate.js            # JavaScript alternative
├── web-app.ts             # Web application (standalone)
├── web-app.js             # Compiled browser code
├── index.html             # Web UI
├── coronas-center-1.json  # Pre-computed results
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── README.md              # User documentation
├── .github/
│   └── copilot-instructions.md  # AI assistant context
└── original_*.py/md       # Reference Python implementation
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

1. **Center sizes**: Only 1-4 implemented
2. **Square sizes**: Fixed to [1, 2, 3, 4]
3. **No global tiling**: Only local coronas
4. **Brute force**: No pruning strategies
5. **Memory**: All coronas kept in memory

### Scalability Considerations

**Center size complexity**:
- Center 1: 24 unique coronas
- Center 2: Estimated 100-500 coronas
- Center 3: Estimated 1000-5000 coronas
- Center 4: Estimated 10000+ coronas

**Memory usage**: ~100 bytes per corona in memory

**Computation time**: Scales exponentially with edge walk complexity

---

## Testing Strategy

### Validation Testing
- Unit tests for each validation rule
- Edge cases (empty, negative, invalid)
- Known valid/invalid examples

### Enumeration Testing
- Count verification against expected results
- Duplicate detection
- Canonical form consistency

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
