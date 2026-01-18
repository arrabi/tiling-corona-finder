# Development Plan: Multi-Center Corona Enumeration and Compatibility

## Current State
- ✓ Successfully enumerates 24 valid 1-coronas
- ✓ Core Corona class with validation logic
- ✓ Canonical rotation for deduplication
- ✓ JSON serialization format established
- ✓ valid-coronas.json contains all 1-coronas

---

## Phase 1: Enumerate Valid 2-Coronas

### Goal
Generate all valid coronas with center size = 2, save to valid-coronas.json

### Implementation Tasks
- [x] **Extend enumeration logic** for center = 2
   - Valid edge walks: combinations of segments that cover length 2
   - Possible single-segment edges: `[{2,0}]`, `[{3,0}]`, `[{4,0}]`
   - Possible two-segment edges: `[{1,0},{1,1}]`, `[{1,0},{2,1}]`, `[{1,0},{3,1}]`, etc.
   - Exclude: `[{2,0}]` (violates unilateral: size == center at offset 0)
   
- [x] **Generate edge choices** for center = 2
   - Enumerate all valid walks covering length 2
   - Filter by unilateral constraints:
     - No consecutive equal sizes
     - No perfect center alignment (size=2 at offset=0)
   
- [x] **Enumerate all combinations**
   - Generate all 4-edge combinations
   - Validate each corona
   - Deduplicate using canonical rotation
   - Visualize these enumerated coronas in the webpage (index.html)
   
- [x] **Update valid-coronas.json**
   - Extend JSON structure to support multiple center sizes
   - New format: `{ "1": [...], "2": [...] }`
   - Preserve existing 1-coronas

### Expected Output
- [x] Updated valid-coronas.json with 2-coronas added
- [x] Console output: count of unique 2-coronas found
- [x] Visualize these enumerated coronas in the webpage (index.html)
- [x] Unit tests pass successfully
- [x] Documentation updated: README.md, architecture.md, plan.md

---

## Phase 2: Enumerate Valid 3-Coronas

### Goal
Generate all valid coronas with center size = 3, append to valid-coronas.json

### Implementation Tasks
- [ ] **Generate edge choices** for center = 3
   - Valid walks covering length 3
   - Single segments: `{4,0}`, `{3,0}` excluded (violates unilateral), `{4,0}` valid
   - Two segments: `{1,0},{2,1}`, `{1,0},{3,1}`, `{2,0},{1,2}`, `{1,0},{4,1}`, etc.
   - Three segments: `{1,0},{1,1},{1,2}`, `{1,0},{1,1},{2,2}`, etc.
   
- [ ] **Edge walk generator**
   - Create recursive/iterative function to generate all valid walks
   - Input: center size, allowed sizes
   - Output: list of valid edge walks
   
- [ ] **Enumerate and validate**
   - Generate all 4-edge combinations
   - Apply validation and deduplication
   - Add "Generate Coronas (Center = 3)" button to index.html
   - Update web-app.js to handle center=3 enumeration
   
- [ ] **Append to valid-coronas.json**
   - Add `"3": [...]` entry

### Expected Output
- [ ] valid-coronas.json includes 3-coronas
- [ ] Count of unique 3-coronas
- [ ] Button for center=3 added to index.html
- [ ] Unit tests pass successfully
- [ ] Documentation updated: README.md, architecture.md, plan.md

---

## Phase 3: Enumerate Valid 4-Coronas

### Goal
Generate all valid coronas with center size = 4, append to valid-coronas.json

### Implementation Tasks
- [ ] **Generate edge choices** for center = 4
   - Valid walks covering length 4
   - Exclude: `{4,0}` (perfect center alignment)
   - Include: all other valid combinations
   
- [ ] **Enumerate and validate**
   - Same process as phases 1-2
   - Add "Generate Coronas (Center = 4)" button to index.html
   - Update web-app.js to handle center=4 enumeration
   
- [ ] **Finalize valid-coronas.json**
   - Complete structure: `{ "1": [...], "2": [...], "3": [...], "4": [...] }`

### Expected Output
- [ ] Complete valid-coronas.json with all center sizes 1-4
- [ ] Final counts for each center size
- [ ] Button for center=4 added to index.html
- [ ] Unit tests pass successfully
- [ ] Documentation updated: README.md, architecture.md, plan.md

---

## Phase 4: Corona Compatibility Analysis

### Goal
For each valid corona, for each square size, identify compatible coronas that can tile adjacently without contradiction.

### Concepts

#### Compatibility Definition
Corona A (with center size `a`) is **compatible** with Corona B (with center size `b`) if:
- The arrangement of squares in A does not contradict the arrangement in B
- When A's center is adjacent to B's center, their edge squares can coexist without conflicts

#### Compatibility Rules
Two coronas are compatible if:
1. **Matching edges**: When centers are adjacent, the edge squares on their shared boundary must align consistently
2. **No geometric conflicts**: Square positions and sizes don't create overlaps or gaps
3. **Consistent neighborhoods**: The local tiling can extend to both coronas

### Implementation Tasks

#### 4.1: Compatibility Data Structure
```typescript
interface CompatibilityEntry {
    coronaId: string;           // e.g., "1|2^0|2^0|2^0|2^0"
    centerSize: number;
    compatibleWith: {
        [adjacentSize: number]: string[];  // List of compatible corona IDs
    };
}
```

#### 4.2: Compatibility Checker
- [ ] Create function: `checkCompatibility(coronaA: Corona, coronaB: Corona): boolean`
- [ ] Analyze edge alignment
- [ ] Check geometric constraints
- [ ] Return true if coronas can coexist as neighbors

#### 4.3: Generate Compatibility Matrix
- [ ] For each corona in valid-coronas.json:
  - [ ] For each possible adjacent center size (1, 2, 3, 4):
    - [ ] Test compatibility with all coronas of that size
    - [ ] Record compatible pairs

#### 4.4: Output Format
Save to `corona-compatibility.json`:
```json
{
  "metadata": {
    "generated": "2026-01-18T...",
    "totalCoronas": 123,
    "centerSizes": [1, 2, 3, 4]
  },
  "compatibility": [
    {
      "coronaId": "1|2^0|2^0|2^0|2^0",
      "centerSize": 1,
      "compatibleWith": {
        "1": ["1|2^0|2^0|2^0|2^0", "1|2^0|2^0|2^0|3^0", ...],
        "2": ["2|3^0|3^0|3^0|3^0", ...],
        "3": [...],
        "4": [...]
      }
    },
    ...
  ]
}
```

### Expected Output
- [ ] corona-compatibility.json with complete compatibility matrix
- [ ] Statistics: average compatibility per corona, most/least compatible coronas
- [ ] Unit tests pass successfully
- [ ] Documentation updated: README.md, architecture.md, plan.md

---

## Implementation Notes

### Code Organization
- Create `enumerate-coronas.ts` - generic enumeration for any center size
- Create `generate-all-coronas.ts` - runs phases 1-3
- Create `compatibility-checker.ts` - implements phase 4
- Update `valid-coronas.json` structure progressively

### Testing Strategy
- Verify each phase output before proceeding
- Check total counts against manual calculations for small cases
- Validate JSON structure at each phase

### Performance Considerations
- Center = 4 may generate many coronas (possibly hundreds)
- Compatibility checking is O(n²) - may need optimization
- Consider caching canonical forms

---

## Success Criteria

### Phase 1-3 Complete When:
- [ ] valid-coronas.json contains all coronas for centers 1-4 (7994 total)
- [ ] All coronas pass validation
- [ ] No duplicates (verified via canonical rotation)
- [ ] JSON structure is consistent and parseable
- [ ] Web app displays coronas by center size

### Phase 4 Complete When:
- [ ] corona-compatibility.json exists
- [ ] Every corona has compatibility entries for all 4 center sizes
- [ ] Compatibility is symmetric where applicable
- [ ] Results are reproducible

---

## Future Extensions
- [ ] Enumerate larger center sizes (5, 6, ...)
- [ ] Visualize compatibility graphs
- [ ] Find maximal compatible sets
- [ ] Generate actual tilings from compatible coronas
