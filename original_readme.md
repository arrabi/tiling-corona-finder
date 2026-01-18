## Project Summary: Equitransitive Square Corona Enumeration

### Problem

We study a tiling problem originating with **Doris Schattschneider**: classify **unilateral, equitransitive tilings** of the plane by squares of different integer sizes.
A key step is enumerating all **valid local neighborhoods (“coronas”)** around a central square that satisfy the geometric and symmetry constraints.
This code focuses on **enumerating unique valid coronas**, starting with small center sizes (currently implemented for center = 1).

---

### Goal / Solution

Build a **computational framework** that:

1. Represents a corona (a central square plus squares attached along its four edges),
2. Validates whether a corona satisfies the required constraints,
3. Enumerates all valid coronas for a given center size,
4. Removes duplicates using **equitransitivity** (cyclic rotation of edges).

This framework will later scale to centers of size 2, 3, and 4 and be extended toward global tiling enumeration.

---

### Representation

* A **Corona** has:

  * `center`: integer side length of the central square.
  * `edges`: a list of 4 edges in cyclic order.
* Each edge is a **walk of segments**:

  * A segment is `(size, offset)` meaning a square of side `size` starts at `offset` along the edge.
* Offsets must satisfy `0 ≤ offset ≤ center`.
* Overhang past the edge is allowed.

Compact string form (used for output and debugging):

```
<center>|s^o,s^o|s^o|s^o,s^o|s^o
```

Example:

```
1|2^0|2^0|2^0|3^0
```

---

### Validation Rules

A corona is valid if:

* It has exactly 4 edges.
* Each edge:

  * Starts at offset 0,
  * Forms a real walk: next offset = previous offset + previous size,
  * Reaches at least the center length (overhang allowed).
* **Unilateral constraints**:

  * No two consecutive squares on an edge have the same size.
  * A square with the same size as the center cannot be placed at offset 0 (perfect alignment is forbidden).

No corner or vertex logic is used; everything is edge-based.

---

### Enumeration & Deduplication

* For center = 1, valid edges are only single segments `(2,0)`, `(3,0)`, `(4,0)`.
* All 4-edge combinations are generated.
* Coronas are **deduplicated up to cyclic rotation** of the four edges (equitransitive symmetry).
* Reflections are *not* identified (unilateral assumption).

Result for center = 1:

* **81** raw valid coronas
* **24** unique coronas up to rotation

---

### Key Files / Functions

* `EdgeSeg`: represents one square on an edge.
* `Corona.validate()`: enforces all constraints.
* `Corona.to_compact()` / `from_compact()`: serialize / parse coronas.
* `canonical_rotation_edges()`: equitransitive deduplication.
* `enumerate_unique_coronas_center_1()`: example enumerator.

---

### Next Steps

* Generalize edge-walk generation for center sizes 2, 3, and 4.
* Improve pruning during enumeration (edge-level constraints first).
* Extend from local coronas to global tiling propagation.

This code is intentionally minimal, explicit, and math-faithful to support correctness before optimization.
