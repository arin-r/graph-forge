import { Node, Edge } from 'reactflow';

export type Mode = "view" | "addNode" | "addEdge" | "algorithm";

export type GraphState = {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
  mode: Mode;
  selectedNodeId: string | null;
  nextNodeId: number;
};

export type GraphNode = {
  id: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  weight?: number;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
};

export type AlgorithmStep = {
  /** The node being dequeued/popped this step, or null for the initial state */
  currentNodeId: string | null;
  /** Ordered contents of the Queue (BFS) or Stack (DFS) */
  dataStructure: string[];
  /** Node IDs currently in the data structure (frontier) */
  processing: Set<string>;
  /** Node IDs that have been fully explored */
  fullyVisited: Set<string>;
  /** The edge currently being traversed, or null */
  activeEdge: { source: string; target: string } | null;
  /** Edges that form the BFS/DFS tree (cumulative) */
  treeEdges: { source: string; target: string }[];
  /** Ordered list of fully-visited node IDs so far */
  traversalOrder: string[];
  /** Human-readable explanation of this step */
  description: string;
};
