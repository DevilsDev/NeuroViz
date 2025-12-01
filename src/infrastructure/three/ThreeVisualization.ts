/**
 * 3D Decision Boundary Visualization using Three.js
 * Shows the decision boundary as a 3D surface where height = confidence
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Prediction3D {
  x: number;
  y: number;
  confidence: number;
  predictedClass: number;
}

export interface Point3D {
  x: number;
  y: number;
  label: number;
}

/**
 * Three.js-based 3D visualization of decision boundaries.
 */
export class ThreeVisualization {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private surfaceMesh: THREE.Mesh | null = null;
  private pointsGroup: THREE.Group;
  private animationId: number | null = null;
  private isDisposed = false;

  // Colour palette for classes
  private classColours = [
    0x3b82f6, // Blue
    0xef4444, // Red
    0x22c55e, // Green
    0xf59e0b, // Amber
    0x8b5cf6, // Purple
    0x06b6d4, // Cyan
    0xec4899, // Pink
    0x84cc16, // Lime
    0xf97316, // Orange
    0x6366f1, // Indigo
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Points group
    this.pointsGroup = new THREE.Group();
    this.scene.add(this.pointsGroup);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(2, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(1.2);
    this.scene.add(axesHelper);

    // Handle resize
    window.addEventListener('resize', this.handleResize);

    // Start animation loop
    this.animate();
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = (): void => {
    if (this.isDisposed) return;
    
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Renders the decision boundary surface.
   * @param predictions - Grid of predictions with confidence values
   * @param gridSize - Number of points per axis
   */
  renderSurface(predictions: Prediction3D[], gridSize: number): void {
    // Remove existing surface
    if (this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceMesh.geometry.dispose();
      if (this.surfaceMesh.material instanceof THREE.Material) {
        this.surfaceMesh.material.dispose();
      }
    }

    if (predictions.length === 0) return;

    // Create geometry
    const geometry = new THREE.PlaneGeometry(2, 2, gridSize - 1, gridSize - 1);
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    if (!positions) return;

    // Update vertex positions and colours based on predictions
    for (let i = 0; i < positions.count; i++) {
      const prediction = predictions[i];
      if (!prediction) continue;

      // Map x, y from [-1, 1] to grid position
      const x = (prediction.x + 1) - 1; // Normalize to [-1, 1]
      const y = (prediction.y + 1) - 1;
      const z = prediction.confidence * 0.5; // Height based on confidence

      positions.setXYZ(i, x, z, y); // Note: Three.js uses Y as up

      // Colour based on predicted class
      const colour = new THREE.Color(this.classColours[prediction.predictedClass % this.classColours.length]);
      // Adjust brightness based on confidence
      colour.multiplyScalar(0.5 + prediction.confidence * 0.5);
      colors.push(colour.r, colour.g, colour.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Create material with vertex colours
    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      transparent: true,
      opacity: 0.85,
    });

    this.surfaceMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.surfaceMesh);
  }

  /**
   * Renders data points as spheres.
   * @param points - Array of data points
   */
  renderPoints(points: Point3D[]): void {
    // Clear existing points
    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0];
      if (!child) break;
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      this.pointsGroup.remove(child);
    }

    // Create spheres for each point
    const sphereGeometry = new THREE.SphereGeometry(0.03, 16, 16);

    for (const point of points) {
      const colour = this.classColours[point.label % this.classColours.length];
      const material = new THREE.MeshPhongMaterial({ color: colour });
      const sphere = new THREE.Mesh(sphereGeometry, material);

      // Position: x and z on the plane, y slightly above
      sphere.position.set(
        (point.x + 1) - 1, // Normalize x
        0.05, // Slightly above the surface
        (point.y + 1) - 1  // Normalize y (z in Three.js)
      );

      this.pointsGroup.add(sphere);
    }
  }

  /**
   * Updates point heights based on predictions.
   * @param predictions - Map of point index to confidence
   */
  updatePointHeights(confidences: number[]): void {
    this.pointsGroup.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        const confidence = confidences[index] ?? 0.5;
        child.position.y = 0.05 + confidence * 0.5;
      }
    });
  }

  /**
   * Resets the camera to default position.
   */
  resetCamera(): void {
    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }

  /**
   * Sets the camera to a top-down view.
   */
  setTopView(): void {
    this.camera.position.set(0, 3, 0);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Sets the camera to a side view.
   */
  setSideView(): void {
    this.camera.position.set(3, 0.5, 0);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Clears the visualization.
   */
  clear(): void {
    if (this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceMesh.geometry.dispose();
      if (this.surfaceMesh.material instanceof THREE.Material) {
        this.surfaceMesh.material.dispose();
      }
      this.surfaceMesh = null;
    }

    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0];
      if (!child) break;
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      this.pointsGroup.remove(child);
    }
  }

  /**
   * Disposes of all resources.
   */
  dispose(): void {
    this.isDisposed = true;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.handleResize);

    this.clear();
    this.controls.dispose();
    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
