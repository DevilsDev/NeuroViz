import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  layer: number;
  index: number;
  x: number;
  y: number;
  type: 'input' | 'hidden' | 'output';
  activation?: string;
  activationValue?: number; // For showing node activation during training
}

interface NetworkLink {
  source: string;
  target: string;
  weight?: number;
  strength?: number; // Normalized weight strength for visualization
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

    // Calculate max weight for normalization
    const maxWeight = Math.max(...links.map(l => Math.abs(l.weight ?? 0)));

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');

    const linkElements = linkGroup.selectAll('line')
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
        if (d.weight === undefined) return '#334155';
        // Gradient color based on weight strength
        const absWeight = Math.abs(d.weight);
        const strength = maxWeight > 0 ? absWeight / maxWeight : 0;
        if (d.weight >= 0) {
          // Positive weights: green gradient
          return d3.interpolateRgb('#10b981', '#22c55e')(strength);
        } else {
          // Negative weights: red gradient
          return d3.interpolateRgb('#f87171', '#ef4444')(strength);
        }
      })
      .attr('stroke-width', d => {
        if (d.weight === undefined) return 0.5;
        const absWeight = Math.abs(d.weight);
        const strength = maxWeight > 0 ? absWeight / maxWeight : 0;
        return 0.5 + strength * 2.5; // Range: 0.5 to 3
      })
      .attr('stroke-opacity', d => {
        if (d.weight === undefined) return 0.2;
        const absWeight = Math.abs(d.weight);
        const strength = maxWeight > 0 ? absWeight / maxWeight : 0;
        return 0.2 + strength * 0.6; // Range: 0.2 to 0.8
      })
      .attr('class', 'network-link')
      .style('transition', 'all 0.3s ease');

    // Add interactive tooltips to links
    linkElements
      .on('mouseenter', function(event, d) {
        if (d.weight !== undefined) {
          d3.select(this)
            .attr('stroke-opacity', 0.9)
            .attr('stroke-width', 4);

          // Show tooltip
          const tooltip = d3.select('body').append('div')
            .attr('class', 'network-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(15, 23, 42, 0.95)')
            .style('color', '#f1f5f9')
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('border', '1px solid rgba(0, 217, 255, 0.3)')
            .html(`Weight: <strong>${d.weight.toFixed(4)}</strong>`);

          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        }
      })
      .on('mousemove', function(event) {
        d3.select('.network-tooltip')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('stroke-opacity', () => {
            if (d.weight === undefined) return 0.2;
            const absWeight = Math.abs(d.weight);
            const strength = maxWeight > 0 ? absWeight / maxWeight : 0;
            return 0.2 + strength * 0.6;
          })
          .attr('stroke-width', () => {
            if (d.weight === undefined) return 0.5;
            const absWeight = Math.abs(d.weight);
            const strength = maxWeight > 0 ? absWeight / maxWeight : 0;
            return 0.5 + strength * 2.5;
          });

        d3.selectAll('.network-tooltip').remove();
      });

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

  /**
   * Disposes of all resources and removes DOM elements.
   * Call this when the diagram is no longer needed.
   */
  dispose(): void {
    this.clear();
  }
}
