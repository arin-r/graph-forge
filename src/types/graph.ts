import { Node, Edge } from 'reactflow';

export type Mode = "view" | "addNode" | "addEdge";

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
