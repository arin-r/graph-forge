import { useCallback } from 'react';
import { useStore, EdgeProps } from 'reactflow';
import type { Node } from 'reactflow';

const NODE_RADIUS = 24; // half of 48px node width/height

function getNodeCenter(node: Node): { x: number; y: number } {
  const w = node.width ?? 48;
  const h = node.height ?? 48;
  return {
    x: (node.positionAbsolute?.x ?? node.position.x) + w / 2,
    y: (node.positionAbsolute?.y ?? node.position.y) + h / 2,
  };
}

function getEdgePoints(sourceNode: Node, targetNode: Node) {
  const s = getNodeCenter(sourceNode);
  const t = getNodeCenter(targetNode);

  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Degenerate case: nodes overlap
  if (dist === 0) {
    return { sx: s.x, sy: s.y - NODE_RADIUS, tx: t.x, ty: t.y + NODE_RADIUS };
  }

  // Unit vector from source center to target center
  const nx = dx / dist;
  const ny = dy / dist;

  return {
    sx: s.x + NODE_RADIUS * nx,
    sy: s.y + NODE_RADIUS * ny,
    tx: t.x - NODE_RADIUS * nx,
    ty: t.y - NODE_RADIUS * ny,
  };
}

export function FloatingEdge({
  id,
  source,
  target,
  style,
  markerEnd,
  label,
}: EdgeProps) {
  const sourceNode = useStore(
    useCallback((store) => store.nodeInternals.get(source), [source])
  );
  const targetNode = useStore(
    useCallback((store) => store.nodeInternals.get(target), [target])
  );

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgePoints(sourceNode, targetNode);
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  const path = `M ${sx} ${sy} L ${tx} ${ty}`;

  return (
    <>
      {/* Invisible wider path for easier click/hover interaction */}
      <path
        d={path}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
      />
      <path
        id={id}
        d={path}
        fill="none"
        className="react-flow__edge-path"
        style={style}
        markerEnd={markerEnd}
      />
      {label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-12}
            y={-10}
            width={24}
            height={20}
            rx={4}
            className="floating-edge-label-bg"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="floating-edge-label-text"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}
