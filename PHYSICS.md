# Force-Directed Layout — How It Works

This document explains the physics simulation that powers the interactive graph layout in this project. The engine lives in [`src/lib/forceSimulation.ts`](src/lib/forceSimulation.ts) and runs entirely in the browser with zero external dependencies.

---

## The Core Idea

A force-directed layout treats the graph as a **physical system**. Nodes become charged particles that repel each other, edges become springs that pull connected nodes together, and a gentle gravitational field keeps everything from drifting off-screen. The simulation runs until the system reaches equilibrium — a minimum-energy state where all forces balance out.

This approach produces layouts that are intuitive to read: connected nodes cluster together, unrelated nodes stay apart, and the overall structure tends to reveal the graph's topology naturally.

---

## The Three Forces

### 1. Node Repulsion (Charge)

Every pair of nodes exerts a repulsive force on the other, like same-polarity magnets:

```
F_repulsion = repulsion_strength / distance
```

This is a **1/r falloff** — the force weakens linearly with distance. Nearby nodes get pushed apart strongly, while distant nodes barely affect each other. The `repulsion` parameter (controlled by the "Node Repulsion" slider) scales the overall strength.

- **Low repulsion** → nodes cluster tightly, potentially overlapping.
- **High repulsion** → nodes spread far apart across the canvas.

### 2. Edge Springs (Link Distance)

Each edge acts as a spring connecting its two endpoints, following **Hooke's Law**:

```
F_spring = k × (current_distance - ideal_distance)
```

Where `k = 0.05` is the spring stiffness coefficient. If two connected nodes are farther apart than the ideal distance, the spring pulls them together. If they're closer, it pushes them apart. The `linkDistance` parameter (controlled by the "Edge Stiffness" slider) sets the ideal rest length.

- **Short link distance** → connected nodes sit close together ("tight" springs).
- **Long link distance** → connected nodes drift further apart ("loose" springs).

### 3. Central Gravity

A gentle force pulls every node toward the center of the graph (computed as the centroid of all current positions):

```
F_gravity = gravity_strength × (center - node_position)
```

This prevents the graph from flying apart when repulsion is strong. The `gravity` parameter (controlled by the "Central Gravity" slider) scales this pull.

- **Weak gravity** → the graph can expand freely.
- **Strong gravity** → everything compresses into a dense ball near the center.

---

## The Simulation Loop

The simulation runs inside a `requestAnimationFrame` loop — one tick per screen refresh (~60 fps). Each tick:

1. **Accumulate forces**: For every node, compute the net force from all three sources (repulsion from every other node, springs from connected edges, gravity toward center).

2. **Update velocities**: Forces translate into velocity changes, scaled by a time-step `dt = 0.45`:
   ```
   velocity += force × dt
   ```

3. **Apply damping**: All velocities are multiplied by a damping factor (`0.82`), simulating friction. This prevents the system from oscillating forever:
   ```
   velocity *= 0.82
   ```

4. **Integrate positions**: Each node moves according to its velocity:
   ```
   position += velocity
   ```

5. **Check convergence**: The total **kinetic energy** (sum of `vx² + vy²` for all nodes) is computed. If it falls below a threshold (`0.3`), the system is considered "settled" and the loop stops.

### System Temperature

The kinetic energy is exposed as **System Temperature** in the UI:

| Temperature | Status     | Meaning                              |
|-------------|------------|--------------------------------------|
| KE < 0.5    | Stable     | Fully settled, forces balanced       |
| KE < 5      | Settling   | Almost converged, minor adjustments  |
| KE < 30     | Active     | Forces still redistributing nodes    |
| KE ≥ 30     | Turbulent  | Major reorganisation in progress     |

---

## Re-Heating

When the user adjusts a slider, the simulation may have already settled. To make the graph respond to the new parameters, the engine **re-heats** the system by adding small random velocity nudges to every node:

```
vx += random(-1, 1)
vy += random(-1, 1)
```

This kicks the system out of its current equilibrium so it can find a new one under the updated force parameters. The random nudge also breaks symmetry — without it, perfectly symmetric configurations (like a circular layout) could get stuck.

---

## Interactive Dragging

When a user drags a node:

1. **Pin**: The dragged node is "pinned" — its position is locked to the cursor and its velocity is zeroed. It still participates in force calculations (other nodes react to it), but it doesn't move on its own.

2. **Move**: As the cursor moves, the pinned node's position updates, and the rest of the graph reacts in real-time — springs stretch, repulsion fields shift, and other nodes drift accordingly.

3. **Unpin**: When released, the node is unpinned and the simulation is re-heated. The node drifts back toward its natural equilibrium within the graph structure.

This creates the "physical model" feel described in the feature spec — dragging one node tugs on the entire structure.

---

## Why Not d3-force?

The popular `d3-force` library solves the same problem, but rolling a custom engine here was deliberate:

- **~80 lines of math** vs. adding a dependency (and its transitive deps).
- **Full control** over the animation loop (`requestAnimationFrame`) and integration with React state.
- **Simpler mental model** — the entire physics engine is one pure function (`tickSimulation`) that takes state in and returns state out.
- **No API surface mismatch** — d3-force uses a mutable simulation object that doesn't play well with React's immutable state model without extra wrappers.
