import { Node, Edge } from 'reactflow';
import { AlgorithmStep } from '../types/graph';

/**
 * Build an adjacency list from ReactFlow nodes and edges.
 * For undirected graphs, edges are added in both directions.
 */
function buildAdjacencyList(
  nodes: Node[],
  edges: Edge[],
  directed: boolean
): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    if (!directed) {
      adj.get(edge.target)?.push(edge.source);
    }
  }

  // Sort neighbor lists numerically (or lexicographically) for deterministic traversal
  for (const [, neighbors] of adj) {
    neighbors.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }

  return adj;
}

/**
 * Creates a deep snapshot of the current algorithm state.
 * Sets are cloned so each step is independent and immutable.
 */
function snapshot(
  currentNodeId: string | null,
  dataStructure: string[],
  processing: Set<string>,
  fullyVisited: Set<string>,
  activeEdge: { source: string; target: string } | null,
  treeEdges: { source: string; target: string }[],
  traversalOrder: string[],
  description: string
): AlgorithmStep {
  return {
    currentNodeId,
    dataStructure: [...dataStructure],
    processing: new Set(processing),
    fullyVisited: new Set(fullyVisited),
    activeEdge: activeEdge ? { ...activeEdge } : null,
    treeEdges: treeEdges.map(e => ({ ...e })),
    traversalOrder: [...traversalOrder],
    description,
  };
}

/**
 * Pre-compute all BFS steps.
 *
 * Step sequence for each dequeue:
 *   1. Dequeue node → mark as fullyVisited, record in traversalOrder
 *   2. For each unvisited neighbor: mark as processing, add to queue, highlight edge
 */
export function calculateBFS(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  directed: boolean
): AlgorithmStep[] {
  const adj = buildAdjacencyList(nodes, edges, directed);
  const steps: AlgorithmStep[] = [];

  const processing = new Set<string>();
  const fullyVisited = new Set<string>();
  const traversalOrder: string[] = [];
  const treeEdges: { source: string; target: string }[] = [];
  const queue: string[] = [];

  // Step 0: Initial state — push start node into queue
  queue.push(startNodeId);
  processing.add(startNodeId);
  steps.push(
    snapshot(
      null,
      queue,
      processing,
      fullyVisited,
      null,
      treeEdges,
      traversalOrder,
      `Initialize: enqueue start node ${startNodeId}`
    )
  );

  while (queue.length > 0) {
    // Dequeue front
    const current = queue.shift()!;
    processing.delete(current);
    fullyVisited.add(current);
    traversalOrder.push(current);

    steps.push(
      snapshot(
        current,
        queue,
        processing,
        fullyVisited,
        null,
        treeEdges,
        traversalOrder,
        `Dequeue node ${current} → mark as fully visited`
      )
    );

    // Explore neighbors
    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!processing.has(neighbor) && !fullyVisited.has(neighbor)) {
        processing.add(neighbor);
        queue.push(neighbor);
        treeEdges.push({ source: current, target: neighbor });

        steps.push(
          snapshot(
            current,
            queue,
            processing,
            fullyVisited,
            { source: current, target: neighbor },
            treeEdges,
            traversalOrder,
            `Discover neighbor ${neighbor} via edge ${current} → ${neighbor}, enqueue`
          )
        );
      }
    }
  }

  // Final step: traversal complete
  steps.push(
    snapshot(
      null,
      queue,
      processing,
      fullyVisited,
      null,
      treeEdges,
      traversalOrder,
      `BFS complete. Traversal order: ${traversalOrder.join(' → ')}`
    )
  );

  return steps;
}

/**
 * Pre-compute all DFS steps using an explicit stack.
 *
 * Neighbors are pushed in reverse sorted order so that the smallest
 * neighbor ID is on top and explored first (matching textbook DFS).
 *
 * Step sequence for each pop:
 *   1. Pop node → if already visited, skip (continue)
 *   2. Mark as fullyVisited, record in traversalOrder
 *   3. Push unvisited neighbors onto stack (reverse order), mark as processing
 */
export function calculateDFS(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  directed: boolean
): AlgorithmStep[] {
  const adj = buildAdjacencyList(nodes, edges, directed);
  const steps: AlgorithmStep[] = [];

  const processing = new Set<string>();
  const fullyVisited = new Set<string>();
  const traversalOrder: string[] = [];
  const treeEdges: { source: string; target: string }[] = [];
  const stack: string[] = [];
  // Track who pushed each node onto the stack (for tree edge recording)
  const parent = new Map<string, string | null>();

  // Step 0: Push start node onto stack
  stack.push(startNodeId);
  processing.add(startNodeId);
  parent.set(startNodeId, null);
  steps.push(
    snapshot(
      null,
      stack,
      processing,
      fullyVisited,
      null,
      treeEdges,
      traversalOrder,
      `Initialize: push start node ${startNodeId} onto stack`
    )
  );

  while (stack.length > 0) {
    // Pop top
    const current = stack.pop()!;

    // If already fully visited (can happen in DFS with duplicate stack entries), skip
    if (fullyVisited.has(current)) {
      continue;
    }

    processing.delete(current);
    fullyVisited.add(current);
    traversalOrder.push(current);

    // Record tree edge if this node was discovered via a parent
    const par = parent.get(current);
    if (par != null) {
      treeEdges.push({ source: par, target: current });
    }

    steps.push(
      snapshot(
        current,
        stack,
        processing,
        fullyVisited,
        null,
        treeEdges,
        traversalOrder,
        `Pop node ${current} → mark as fully visited`
      )
    );

    // Explore neighbors — push in reverse order so smallest is on top
    const neighbors = adj.get(current) || [];
    const reversedNeighbors = [...neighbors].reverse();
    for (const neighbor of reversedNeighbors) {
      if (!fullyVisited.has(neighbor)) {
        stack.push(neighbor);
        processing.add(neighbor);
        // Update parent — last push wins (this is the edge DFS will use)
        parent.set(neighbor, current);

        steps.push(
          snapshot(
            current,
            stack,
            processing,
            fullyVisited,
            { source: current, target: neighbor },
            treeEdges,
            traversalOrder,
            `Discover neighbor ${neighbor} via edge ${current} → ${neighbor}, push onto stack`
          )
        );
      }
    }
  }

  // Final step: traversal complete
  steps.push(
    snapshot(
      null,
      stack,
      processing,
      fullyVisited,
      null,
      treeEdges,
      traversalOrder,
      `DFS complete. Traversal order: ${traversalOrder.join(' → ')}`
    )
  );

  return steps;
}
