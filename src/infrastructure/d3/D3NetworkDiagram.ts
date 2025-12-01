import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  layer: number;
  index: number;
  x: number;
  y: number;
  type: 'input' | 'hidden' | 'output';
  activation?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  weight?: number;
}

/**
 * D3-based neural network architecture diagram.
 * Shows nodes and connections between layers.
 */
export class D3NetworkDiagram {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width: number;
  private height: number;
  private margin = { top: 20, right: 20, bottom: 20, left: 20 };

  constructor(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.width = rect.width || 300;
    this.height = rect.height || 200;

    // Clear existing content
    d3.select(container).selectAll('*').remove();

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  /**
   * Renders the network architecture.
   * @param layers - Array of layer sizes [input, hidden1, hidden2, ..., output]
   * @param activations - Array of activation functions per layer
   * @param weights - Optional weight matrices for connection thickness
   */
  render(
    layers: number[],
    activations: string[] = [],
    weights?: number[][][]
  ): void {
    if (layers.length === 0) return;

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Clear previous content
    this.svg.selectAll('*').remove();

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Calculate node positions
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];

    const layerSpacing = innerWidth / (layers.length - 1 || 1);
    const maxNodes = Math.max(...layers);

    layers.forEach((nodeCount, layerIndex) => {
      const nodeSpacing = innerHeight / (nodeCount + 1);
      const layerType = layerIndex === 0 ? 'input' 
        : layerIndex === layers.length - 1 ? 'output' 
        : 'hidden';

      for (let i = 0; i < nodeCount; i++) {
        const node: NetworkNode = {
          id: `L${layerIndex}N${i}`,
          layer: layerIndex,
          index: i,
          x: layerIndex * layerSpacing,
          y: (i + 1) * nodeSpacing,
          type: layerType,
          activation: activations[layerIndex] ?? (layerType === 'output' ? 'softmax' : 'relu'),
        };
        nodes.push(node);

        // Create links to previous layer
        if (layerIndex > 0) {
          const prevLayerSize = layers[layerIndex - 1] ?? 0;
          for (let j = 0; j < prevLayerSize; j++) {
            const weight = weights?.[layerIndex - 1]?.[j]?.[i];
            links.push({
              source: `L${layerIndex - 1}N${j}`,
              target: node.id,
              weight,
            });
          }
        }
      }
    });

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    
    linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode?.x ?? 0;
      })
      .attr('y1', d => {
        const sourceNode = nodes.find(n => n.id === d.source);
        return sourceNode?.y ?? 0;
      })
      .attr('x2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode?.x ?? 0;
      })
      .attr('y2', d => {
        const targetNode = nodes.find(n => n.id === d.target);
        return targetNode?.y ?? 0;
      })
      .attr('stroke', d => {
        if (d.weight === undefined) return 'var(--border-color)';
        return d.weight >= 0 ? '#22c55e' : '#ef4444';
      })
      .attr('stroke-width', d => {
        if (d.weight === undefined) return 0.5;
        return Math.min(3, Math.abs(d.weight) * 2);
      })
      .attr('stroke-opacity', 0.3);

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeRadius = Math.min(15, innerHeight / (maxNodes * 3));

    nodeGroup.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', nodeRadius)
      .attr('fill', d => {
        switch (d.type) {
          case 'input': return '#3b82f6';
          case 'output': return '#22c55e';
          default: return '#8b5cf6';
        }
      })
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 2);

    // Add layer labels
    const labelGroup = g.append('g').attr('class', 'labels');

    const layerLabels = layers.map((size, i) => ({
      x: i * layerSpacing,
      label: i === 0 ? 'Input' : i === layers.length - 1 ? 'Output' : `Hidden ${i}`,
      size,
    }));

    labelGroup.selectAll('text')
      .data(layerLabels)
      .enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', innerHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '9px')
      .text(d => `${d.label} (${d.size})`);

    // Add activation labels
    if (activations.length > 0) {
      labelGroup.selectAll('.activation')
        .data(layerLabels.slice(1)) // Skip input layer
        .enter()
        .append('text')
        .attr('class', 'activation')
        .attr('x', d => d.x)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '8px')
        .text((_, i) => activations[i + 1] ?? '');
    }
  }

  /**
   * Clears the diagram.
   */
  clear(): void {
    this.svg.selectAll('*').remove();
  }
}
