import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Grid3X3 } from "lucide-react";

export interface ToolpathData {
  movements: Array<{
    x: number;
    y: number;
    z: number;
    type: "rapid" | "feed" | "arc" | "helical";
    start?: { x: number; y: number; z: number };
    end?: { x: number; y: number; z: number };
    center?: { x: number; y: number; z: number };
    radius?: number;
    angle?: number;
  }>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  stats: {
    totalLines: number;
    totalRapid: number;
    totalFeed: number;
    totalArc: number;
    totalDistance: number;
  };
}

interface Viewer3DProps {
  toolpathData: ToolpathData | null;
  viewMode?: "3d" | "xy" | "xz" | "yz";
  showPaths?: boolean;
  showGrid?: boolean;
  animatePlayback?: boolean;
  playbackProgress?: number;
  onPlaybackProgress?: (progress: number) => void;
  lineWidth?: number;
}

export function Viewer3D({ 
  toolpathData, 
  viewMode = "3d",
  showPaths = true,
  showGrid: showGridProp = true,
  lineWidth = 2,
}: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    toolpathGroup: THREE.Group;
    gridHelper: THREE.GridHelper;
    axesHelper: THREE.AxesHelper;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showGrid, setShowGrid] = useState(showGridProp);
  const [showAxes, setShowAxes] = useState(true);

  const setViewPreset = useCallback((preset: "3d" | "xy" | "xz" | "yz") => {
    if (!sceneRef.current) return;
    const { camera, controls } = sceneRef.current;
    const { bounds } = toolpathData || { bounds: null };
    
    let targetPos = { x: 200, y: 200, z: 200 };
    
    if (bounds) {
      const centerX = (bounds.maxX + bounds.minX) / 2;
      const centerY = (bounds.maxY + bounds.minY) / 2;
      const centerZ = (bounds.maxZ + bounds.minZ) / 2;
      const rangeX = bounds.maxX - bounds.minX || 100;
      const rangeY = bounds.maxY - bounds.minY || 100;
      const rangeZ = bounds.maxZ - bounds.minZ || 100;
      const maxRange = Math.max(rangeX, rangeY, rangeZ);
      const distance = maxRange * 2;
      
      switch (preset) {
        case "xy":
          targetPos = { x: 0, y: 0, z: distance };
          break;
        case "xz":
          targetPos = { x: 0, y: distance, z: 0 };
          break;
        case "yz":
          targetPos = { x: distance, y: 0, z: 0 };
          break;
        case "3d":
        default:
          targetPos = { x: distance * 0.7, y: distance * 0.7, z: distance * 0.7 };
          break;
      }
      controls.target.set(-centerX, -centerZ, -centerY);
    }
    
    camera.position.set(targetPos.x, targetPos.z, targetPos.y);
    controls.update();
  }, [toolpathData]);

  useEffect(() => {
    setViewPreset(viewMode);
  }, [viewMode, setViewPreset]);

  const initScene = useCallback(() => {
    if (!containerRef.current || sceneRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = 2000;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x333333);
    scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // Toolpath group
    const toolpathGroup = new THREE.Group();
    scene.add(toolpathGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      toolpathGroup,
      gridHelper,
      axesHelper,
    };
    setIsInitialized(true);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
        if (containerRef.current) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current = null;
      }
    };
  }, [initScene]);

  useEffect(() => {
    if (!sceneRef.current || !toolpathData) return;

    const { toolpathGroup, scene } = sceneRef.current;

    // Clear existing toolpath
    while (toolpathGroup.children.length > 0) {
      const child = toolpathGroup.children[0];
      if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      toolpathGroup.remove(child);
    }

    if (toolpathData.movements.length === 0) return;

    // Colors
    const rapidColor = new THREE.Color(0x00ff88);
    const feedColor = new THREE.Color(0x00aaff);
    const arcColor = new THREE.Color(0xffaa00);
    const helicalColor = new THREE.Color(0xff00aa);

    // Group movements by type for batching
    const rapidPoints: THREE.Vector3[] = [];
    const feedPoints: THREE.Vector3[] = [];
    const arcSegments: Array<{ points: THREE.Vector3[]; color: THREE.Color }> = [];

    toolpathData.movements.forEach((move) => {
      if (move.type === "rapid") {
        rapidPoints.push(new THREE.Vector3(move.x, move.z, move.y));
      } else if (move.type === "feed") {
        feedPoints.push(new THREE.Vector3(move.x, move.z, move.y));
      } else if (move.type === "arc") {
        const { start, end, center } = move;
        if (start && end && center) {
          const arcPoints: THREE.Vector3[] = [];
          const segments = 32;
          const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
          const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
          const radius = move.radius || 0;

          let angleDiff = endAngle - startAngle;
          if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (angleDiff * i) / segments;
            arcPoints.push(
              new THREE.Vector3(
                center.x + radius * Math.cos(angle),
                (start.z + end.z) / 2,
                center.y + radius * Math.sin(angle)
              )
            );
          }
          arcSegments.push({ points: arcPoints, color: arcColor });
        }
      }
    });

    // Create rapid movement line
    if (rapidPoints.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(rapidPoints);
      const material = new THREE.LineBasicMaterial({
        color: rapidColor,
        linewidth: 1,
        opacity: 0.8,
        transparent: true,
      });
      const line = new THREE.Line(geometry, material);
      toolpathGroup.add(line);
    }

    // Create feed movement line
    if (feedPoints.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(feedPoints);
      const material = new THREE.LineBasicMaterial({
        color: feedColor,
        linewidth: 2,
        opacity: 1,
        transparent: true,
      });
      const line = new THREE.Line(geometry, material);
      toolpathGroup.add(line);
    }

    // Create arc segments
    arcSegments.forEach((segment) => {
      if (segment.points.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(segment.points);
        const material = new THREE.LineBasicMaterial({
          color: segment.color,
          linewidth: 2,
          opacity: 1,
          transparent: true,
        });
        const line = new THREE.Line(geometry, material);
        toolpathGroup.add(line);
      }
    });

    // Center view on toolpath
    const { bounds } = toolpathData;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    toolpathGroup.position.set(-centerX, -centerZ, -centerY);

    const rangeX = bounds.maxX - bounds.minX || 100;
    const rangeY = bounds.maxY - bounds.minY || 100;
    const rangeZ = bounds.maxZ - bounds.minZ || 100;
    const maxRange = Math.max(rangeX, rangeY, rangeZ);

    const { camera } = sceneRef.current;
    camera.position.set(maxRange * 1.5, maxRange * 1.5, maxRange * 1.5);
    camera.lookAt(0, 0, 0);
    sceneRef.current.controls.target.set(0, 0, 0);
    sceneRef.current.controls.update();

    // Adjust grid size
    const gridSize = Math.ceil(maxRange * 1.5);
    scene.remove(sceneRef.current.gridHelper);
    sceneRef.current.gridHelper = new THREE.GridHelper(gridSize, 50, 0x444444, 0x333333);
    scene.add(sceneRef.current.gridHelper);
  }, [toolpathData]);

  const resetView = () => {
    if (!sceneRef.current) return;
    const { camera, controls } = sceneRef.current;
    if (toolpathData) {
      const { bounds } = toolpathData;
      const rangeX = bounds.maxX - bounds.minX || 100;
      const rangeY = bounds.maxY - bounds.minY || 100;
      const rangeZ = bounds.maxZ - bounds.minZ || 100;
      const maxRange = Math.max(rangeX, rangeY, rangeZ);
      camera.position.set(maxRange * 1.5, maxRange * 1.5, maxRange * 1.5);
    } else {
      camera.position.set(200, 200, 200);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const zoomIn = () => {
    if (!sceneRef.current) return;
    const { camera, controls } = sceneRef.current;
    camera.position.multiplyScalar(0.8);
    controls.update();
  };

  const zoomOut = () => {
    if (!sceneRef.current) return;
    const { camera, controls } = sceneRef.current;
    camera.position.multiplyScalar(1.25);
    controls.update();
  };

  const fitToView = () => {
    if (!sceneRef.current || !toolpathData) return;
    const { bounds } = toolpathData;
    const rangeX = bounds.maxX - bounds.minX || 100;
    const rangeY = bounds.maxY - bounds.minY || 100;
    const rangeZ = bounds.maxZ - bounds.minZ || 100;
    const maxRange = Math.max(rangeX, rangeY, rangeZ);

    const { camera, controls } = sceneRef.current;
    const container = containerRef.current;
    if (!container) return;

    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxRange / 2) / Math.tan(fov / 2) * 1.5;

    camera.position.set(distance, distance * 1.2, distance);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const toggleGrid = () => {
    if (!sceneRef.current) return;
    const { scene, gridHelper } = sceneRef.current;
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    gridHelper.visible = newShowGrid;
  };

  const toggleAxes = () => {
    if (!sceneRef.current) return;
    const { axesHelper } = sceneRef.current;
    const newShowAxes = !showAxes;
    setShowAxes(newShowAxes);
    axesHelper.visible = newShowAxes;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={fitToView}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleGrid}
          className={`bg-background/80 backdrop-blur-sm hover:bg-background ${showGrid ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#00ff88] rounded" />
          <span className="text-xs text-muted-foreground">快速移动</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#00aaff] rounded" />
          <span className="text-xs text-muted-foreground">进给移动</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#ffaa00] rounded" />
          <span className="text-xs text-muted-foreground">圆弧移动</span>
        </div>
      </div>

      {/* Empty state */}
      {!toolpathData && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">上传 G-code 文件开始模拟</p>
          </div>
        </div>
      )}
    </div>
  );
}
