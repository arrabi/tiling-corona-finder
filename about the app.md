### Core Problem
Classify valid local neighborhoods ("coronas") that satisfy geometric and symmetry constraints based on research by Doris Schattschneider.

---

## Key Concepts

### Corona Structure
- **Center**: An integer-sized square (currently working with sizes 1-4)
- **Edges**: Exactly 4 edges in clockwise order (top, right, bottom, left)
- **Edge Segments**: Each edge contains a walk of squares represented as `{size, offset}`
  - `size`: side length of the square (1, 2, 3, or 4)
  - `offset`: position along the edge where the square starts

### Clockwise Edge Convention
- **Top edge** (edge 0): starts at top-left corner, positive offset goes RIGHT
- **Right edge** (edge 1): starts at top-right corner, positive offset goes DOWN
- **Bottom edge** (edge 2): starts at bottom-right corner, positive offset goes LEFT
- **Left edge** (edge 3): starts at bottom-left corner, positive offset goes UP

### Compact Notation
Format: `center|edge0|edge1|edge2|edge3`
- Example: `1|2^0|2^0|2^0|2^0`
  - Center size: 1
  - Each edge: one square of size 2 at offset 0

---

## Critical Validation Rules

When implementing or modifying validation logic, ensure:

1. **Basic Structure**
   - Center must be a positive integer
   - Exactly 4 edges
   - Each edge must be non-empty

2. **Offset Constraints**
   - `0 ≤ offset ≤ center` for all segments
   - Offsets must be integers

3. **Edge Walk Requirements**
   - First segment must start at offset 0
   - Segments form a continuous walk: `next.offset = prev.offset + prev.size`
   - Walk must reach at least the center length (overhang allowed)

4. **Unilateral Constraints** (CRITICAL)
   - No two consecutive segments on the same edge can have equal sizes
   - A segment with `size == center` at `offset == 0` is forbidden (perfect alignment)

5. **Allowed Sizes**
   - Default: [1, 2, 3, 4]
   - Configurable via parameters

---

## Code Patterns

### Creating Coronas

```typescript
const corona = new Corona(1, [
  [{size: 2, offset: 0}],  // top edge
  [{size: 2, offset: 0}],  // right edge
  [{size: 2, offset: 0}],  // bottom edge
  [{size: 2, offset: 0}]   // left edge
]);
```

### Validating Coronas

```typescript
const result = corona.validate();
if (!result.ok) {
  console.error(result.reason, result.where);
}
```

### Serialization

```typescript
// To compact notation
const compact = corona.toCompact();  // "1|2^0|2^0|2^0|2^0"

// From compact notation
const corona = Corona.fromCompact("1|2^0|2^0|2^0|2^0");
```

---

## Visualization Guidelines

### Canvas Drawing
When drawing coronas on canvas:

1. **Center square**: Draw at canvas center
2. **Edge squares**: Position perpendicular to their edge
3. **Positioning logic**:
   - Top: `x = centerX - centerSize/2 + offset`, `y = centerY - centerSize/2 - size`
   - Right: `x = centerX + centerSize/2`, `y = centerY - centerSize/2 + offset`
   - Bottom: `x = centerX + centerSize/2 - offset - size`, `y = centerY + centerSize/2`
   - Left: `x = centerX - centerSize/2 - size`, `y = centerY + centerSize/2 - offset - size`

### Color Scheme
- Center: `#667eea` (purple)
- Size 1: `#ffb74d` (orange)
- Size 2: `#81c784` (green)
- Size 3: `#64b5f6` (blue)
- Size 4: `#e57373` (red)

---

## Deduplication Strategy

### Equitransitive Symmetry
Coronas are deduplicated by cyclic rotation of edges (NOT reflection):
- Generate canonical key by trying all 4 rotations
- Use lexicographically smallest rotation as the canonical form
- Function: `canonicalRotationEdges()`

---

## Data Storage

### JSON Format
```json
{
  "center": 1,
  "count": 24,
  "generated": "ISO-8601-timestamp",
  "coronas": ["1|2^0|2^0|2^0|2^0", ...]
}
```

### Loading/Saving
- **Generate**: Use `npm run generate` (runs generate.ts)
- **Load**: Use `loadCoronasFromFile()` in TypeScript
- File: `coronas-center-{size}.json`

---

## Common Tasks

### Adding Support for New Center Size
1. Implement edge walk generator for that size
2. Enumerate all valid edge combinations
3. Apply validation rules
4. Deduplicate using canonical rotation
5. Save to JSON file

### Debugging Invalid Coronas
1. Check compact notation parsing
2. Verify offset/size values
3. Test edge walk continuity
4. Validate unilateral constraints
5. Check deduplication logic

### Performance Optimization
- Pre-filter at edge level before full corona validation
- Cache canonical keys
- Use Set for duplicate detection
- Sort segments once per edge

---

## Testing Priorities

1. **Validation edge cases**:
   - Empty edges
   - Negative offsets
   - Broken walks
   - Equal adjacent sizes
   - Perfect alignment (size == center at offset 0)

2. **Enumeration correctness**:
   - Count matches expected results
   - No duplicates after deduplication
   - All results pass validation

3. **Serialization roundtrip**:
   - `Corona → toCompact() → fromCompact() → toCompact()` must be identical

---

## Code Style

- Use TypeScript for type safety
- Prefer immutable data structures (`readonly`)
- Explicit validation with detailed error messages
- Math-faithful implementations over optimizations
- Comments explaining geometric meaning

---

## Next Development Steps

1. Extend to center sizes 2, 3, and 4
2. Implement global tiling propagation from coronas
3. Add constraint solver for edge compatibility
4. Create interactive web visualizer with zoom/pan
5. Optimize enumeration with pruning strategies

---

## References

- Original research: Doris Schattschneider's tiling work
- Compact notation is project-specific
- Clockwise edge convention is critical for consistency
