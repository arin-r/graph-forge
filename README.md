# Graph Visualizer

Welcome to **Graph Visualizer**, an interactive, force-directed graph rendering and algorithm simulation playground built with **Next.js**, **React Flow**, and **Tailwind CSS**. 

This application lets you visualize complex graph structures dynamically, tweak real-time physics parameters, and observe classic graph traversal algorithms step-by-step.

---

## Features

- **Interactive Force-Directed Layout**: A real-time custom physics engine to handle node repulsion, edge stiffness, and central gravity. Watch your graphs organically untangle and react to drag events! *(Check out [`PHYSICS.md`](./PHYSICS.md) for the deep dive into the math).*
- **Advanced Graph Capabilities**: Fully supports both **directed** and **undirected** graphs. 
- **Flexible Data Input**: Input graphs easily using either an **Adjacency Matrix** or an **Adjacency List** format.
- **Import/Export & Persistence**: Import your own graph configurations or export the current layout for later use. Your graph data is also persistently saved in **Local Storage**, so you won't lose your work on refresh. Included is a handy custom script for generating test graphs!
- **Step-by-Step Algorithm Animations**: Visualize graph traversals intuitively with powerful playback controls. Play, pause, step forward, step backward, and control the playback speed. Supported algorithms:
  - **Breadth-First Search (BFS)**
  - **Depth-First Search (DFS)**
- **Traversal Tree Highlights**: As algorithms run, the application tracks and visually distinguishes the edges that form the traversal tree from the rest of the graph.
- **Dynamic Edge Routing**: Intelligent straight-line edges that dynamically attach to the nearest point on a node's perimeter, offering a sleek, natural look compared to fixed-point connections.
- **Dynamic Graphs**: Build and modify your graphs directly by adding edges and nodes as required on the canvas.

---

## How It Works

Under the hood, **Graph Visualizer** brings together several modern web technologies to create a seamless interactive experience:

1. **Graph Rendering (`reactflow`)**: Nodes and edges are rendered onto a high-performance canvas using the `reactflow` library. This gives us drag-and-drop capabilities, panning, zooming, and a robust state-management system for the visual elements.
2. **Custom Physics Simulation**: A proprietary physics engine runs continuously to calculate forces (repulsion between all nodes, spring forces along edges, and central gravity). These calculations dictate the continuous movement of nodes until the layout reaches an equilibrium state.
3. **Algorithm State Machine**: When an algorithm (like BFS or DFS) is triggered, the system pre-computes a deterministic sequence of "snapshots." The UI then plays back these snapshots, highlighting active nodes, enqueueing/pushing operations, and traversal tree building.
4. **Dynamic Routing Components**: Custom React components (like `FloatingEdge`) compute SVG paths on the fly to route edges dynamically around node boundaries based on relative angles.

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/graph-visualizer.git
   cd graph-visualizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or yarn install / pnpm install / bun install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or yarn dev / pnpm dev / bun dev
   ```

4. **Explore the app**: Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Learn More

- Dive into the physics logic powering the force-directed layout: [**`PHYSICS.md`**](./PHYSICS.md)
- Learn more about the underlying UI framework: [Next.js Documentation](https://nextjs.org/docs)

