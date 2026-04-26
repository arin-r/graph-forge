import { Node, Edge } from 'reactflow';

export type ForceParams = {
  repulsion: number;   // charge strength (100–3000)
  linkDistance: number; // ideal edge length (30–500)
  gravity: number;     // center pull strength (0.005–0.20)
};

export const DEFAULT_FORCE_PARAMS: ForceParams = {
  repulsion: 800,
  linkDistance: 150,
  gravity: 0.02,
};

export type NodePhysics = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean; // true while being dragged
};

export type SimulationState = {
  physics: Map<string, NodePhysics>;
  isSettled: boolean;
};

const DAMPING = 0.82;
const SETTLE_THRESHOLD = 0.3; // total kinetic energy below this → settled
const DT = 0.45; // time-step scalar
const MIN_DIST = 1; // avoid division by zero

/**
 * Initialise simulation state from current ReactFlow node positions.
 */
export function initSimulation(nodes: Node[]): SimulationState {
  const physics = new Map<string, NodePhysics>();
  for (const n of nodes) {
    physics.set(n.id, {
      x: n.position.x,
      y: n.position.y,
      vx: 0,
      vy: 0,
      pinned: false,
    });
  }
  return { physics, isSettled: false };
}

/**
 * Re-heat the simulation so it starts moving again (e.g. after a slider change).
 * Adds a tiny random nudge to break symmetry.
 */
export function reheatSimulation(state: SimulationState): SimulationState {
  const physics = new Map(state.physics);
  for (const [id, p] of physics) {
    physics.set(id, {
      ...p,
      vx: p.vx + (Math.random() - 0.5) * 2,
      vy: p.vy + (Math.random() - 0.5) * 2,
    });
  }
  return { physics, isSettled: false };
}

/**
 * One tick of the simulation. Returns a new state (immutable).
 */
export function tickSimulation(
  state: SimulationState,
  edges: Edge[],
  params: ForceParams,
  centerX: number,
  centerY: number,
): SimulationState {
  const physics = new Map<string, NodePhysics>();
  // Clone current state
  for (const [id, p] of state.physics) {
    physics.set(id, { ...p });
  }

  const ids = Array.from(physics.keys());

  // --- 1. Charge repulsion (all-pairs) ---
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = physics.get(ids[i])!;
      const b = physics.get(ids[j])!;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_DIST) {
        // nudge apart to avoid singularity
        dx = (Math.random() - 0.5) * 2;
        dy = (Math.random() - 0.5) * 2;
        dist = Math.sqrt(dx * dx + dy * dy);
      }
      // Repulsion: F = repulsion / dist  (1/r falloff — spreads nodes further)
      const force = params.repulsion / dist;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!a.pinned) { a.vx -= fx * DT; a.vy -= fy * DT; }
      if (!b.pinned) { b.vx += fx * DT; b.vy += fy * DT; }
    }
  }

  // --- 2. Spring forces along edges ---
  for (const edge of edges) {
    const a = physics.get(edge.source);
    const b = physics.get(edge.target);
    if (!a || !b) continue;

    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_DIST) dist = MIN_DIST;

    // Hooke: F = k * (dist - ideal) toward target
    const displacement = dist - params.linkDistance;
    const springK = 0.05; // stiffness coefficient
    const force = springK * displacement;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!a.pinned) { a.vx += fx * DT; a.vy += fy * DT; }
    if (!b.pinned) { b.vx -= fx * DT; b.vy -= fy * DT; }
  }

  // --- 3. Center gravity ---
  for (const [, p] of physics) {
    if (p.pinned) continue;
    const dx = centerX - p.x;
    const dy = centerY - p.y;
    p.vx += dx * params.gravity * DT;
    p.vy += dy * params.gravity * DT;
  }

  // --- 4. Apply damping & integrate position ---
  let totalKE = 0;
  for (const [, p] of physics) {
    if (p.pinned) continue;
    p.vx *= DAMPING;
    p.vy *= DAMPING;
    p.x += p.vx;
    p.y += p.vy;
    totalKE += p.vx * p.vx + p.vy * p.vy;
  }

  return {
    physics,
    isSettled: totalKE < SETTLE_THRESHOLD,
  };
}

/**
 * Pin a node (e.g. during drag). Position is locked; velocities zeroed.
 */
export function pinNode(state: SimulationState, nodeId: string, x: number, y: number): SimulationState {
  const physics = new Map(state.physics);
  const p = physics.get(nodeId);
  if (p) {
    physics.set(nodeId, { ...p, x, y, vx: 0, vy: 0, pinned: true });
  }
  return { ...state, physics, isSettled: false };
}

/**
 * Unpin a node (e.g. on drag end). The node will settle back naturally.
 */
export function unpinNode(state: SimulationState, nodeId: string): SimulationState {
  const physics = new Map(state.physics);
  const p = physics.get(nodeId);
  if (p) {
    physics.set(nodeId, { ...p, pinned: false });
  }
  return { ...state, physics, isSettled: false };
}

/**
 * Update the position of a pinned node (during drag move).
 */
export function movePinnedNode(state: SimulationState, nodeId: string, x: number, y: number): SimulationState {
  const physics = new Map(state.physics);
  const p = physics.get(nodeId);
  if (p && p.pinned) {
    physics.set(nodeId, { ...p, x, y });
  }
  return { ...state, physics, isSettled: false };
}
