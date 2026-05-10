<script lang="ts">
    import { onMount, onDestroy, beforeUpdate } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import type { QuantumCircuit, EvolutionResult } from './types';

    export let circuit: QuantumCircuit | null;
    export let simulationResult: EvolutionResult | null;

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;
    let statePoints: THREE.Points | null = null;
    let axes: THREE.Group | null = null;
    let bars: THREE.Mesh[] = [];
    let time = 0;

    function createHilbertSpace() {
        axes = new THREE.Group();

        const axisMaterial = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 });
        
        const gridSize = 4;
        const spacing = 1.5;

        for (let i = -gridSize; i <= gridSize; i++) {
            const pointsX = [
                new THREE.Vector3(i * spacing, 0, -gridSize * spacing),
                new THREE.Vector3(i * spacing, 0, gridSize * spacing)
            ];
            const pointsZ = [
                new THREE.Vector3(-gridSize * spacing, 0, i * spacing),
                new THREE.Vector3(gridSize * spacing, 0, i * spacing)
            ];

            const geomX = new THREE.BufferGeometry().setFromPoints(pointsX);
            const geomZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
            
            axes!.add(new THREE.Line(geomX, axisMaterial));
            axes!.add(new THREE.Line(geomZ, axisMaterial));
        }

        scene.add(axes!);
    }

    function updateStateVisualization() {
        if (statePoints) {
            scene.remove(statePoints);
        }
        bars.forEach(b => scene.remove(b));
        bars = [];

        if (!simulationResult) return;

        const probabilities = simulationResult.measurementProbabilities;
        const positions: number[] = [];
        const colors: number[] = [];

        const gridSize = Math.ceil(Math.sqrt(probabilities.length));
        const spacing = 1.5;

        probabilities.forEach((prob, index) => {
            const x = (index % gridSize - gridSize / 2 + 0.5) * spacing;
            const z = (Math.floor(index / gridSize) - gridSize / 2 + 0.5) * spacing;
            const height = Math.sqrt(prob.probability) * 4;
            
            const barGeometry = new THREE.BoxGeometry(0.6, height, 0.6);
            const hue = 200 + prob.probability * 120;
            const barMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(hue / 360, 0.8, 0.5),
                transparent: true,
                opacity: 0.8,
                emissive: new THREE.Color().setHSL(hue / 360, 0.8, 0.3),
                emissiveIntensity: 0.3
            });
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set(x, height / 2, z);
            bar.userData = { 
                bitstring: prob.bitstring,
                probability: prob.probability,
                targetHeight: height
            };
            scene.add(bar);
            bars.push(bar);

            positions.push(x, height + 0.5, z);
            const intensity = Math.min(1, prob.probability * 2);
            colors.push(0.3 + intensity * 0.3, 0.4 + intensity * 0.3, 1.0);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });

        statePoints = new THREE.Points(geometry, material);
        scene.add(statePoints);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.02;

        bars.forEach((bar, index) => {
            const targetHeight = bar.userData.targetHeight || 0;
            const vibrate = Math.sin(time * 3 + index) * 0.05 * targetHeight;
            bar.scale.y = 1 + vibrate / targetHeight;
            (bar.material as THREE.MeshPhongMaterial).emissiveIntensity = 
                0.3 + Math.sin(time * 2 + index) * 0.1;
        });

        if (statePoints) {
            statePoints.rotation.y = Math.sin(time * 0.1) * 0.1;
        }

        if (axes) {
            axes.rotation.y = Math.sin(time * 0.05) * 0.02;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    onMount(() => {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);

        camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.set(8, 10, 12);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0x444466, 0.7);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x88aaff, 1, 100);
        pointLight.position.set(10, 15, 10);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xff88aa, 0.5, 100);
        pointLight2.position.set(-10, 15, -10);
        scene.add(pointLight2);

        createHilbertSpace();
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    });

    $: if (simulationResult) {
        updateStateVisualization();
    }

    onDestroy(() => {
        cancelAnimationFrame(animationId);
        renderer?.dispose();
        container?.removeChild(renderer?.domElement);
    });
</script>

<div bind:this={container} class="hilbert-container"></div>

<style>
    .hilbert-container {
        width: 100%;
        height: 100%;
        min-height: 300px;
        flex: 1;
        border-radius: 0.5rem;
        overflow: hidden;
    }
</style>
