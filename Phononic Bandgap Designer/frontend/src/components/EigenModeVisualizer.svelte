<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import type { SimulationResult } from '../types';

    export let simulationResult: SimulationResult | null;
    export let selectedModeIndex: number;
    export let animationProgress: number;

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;
    let modeGroup: THREE.Group;
    let time = 0;
    let particles: THREE.Points;

    function createModeVisualization() {
        if (modeGroup) {
            scene.remove(modeGroup);
        }

        modeGroup = new THREE.Group();

        const gridSize = 20;
        const particleCount = gridSize * gridSize;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 3;
                const x = (i / gridSize - 0.5) * 4;
                const y = (j / gridSize - 0.5) * 4;
                const z = 0;

                positions[index] = x;
                positions[index + 1] = y;
                positions[index + 2] = z;

                originalPositions[index] = x;
                originalPositions[index + 1] = y;
                originalPositions[index + 2] = z;

                const color = new THREE.Color().setHSL(0.7 + (i + j) / (gridSize * 2) * 0.3, 0.8, 0.5);
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        (geometry as any).originalPositions = originalPositions;

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });

        particles = new THREE.Points(geometry, material);
        modeGroup.add(particles);

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wireframe = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4, gridSize - 1, gridSize - 1),
            wireframeMaterial
        );
        modeGroup.add(wireframe);

        scene.add(modeGroup);
    }

    function animateMode() {
        if (!particles || animationProgress < 0.5) return;

        const positions = particles.geometry.attributes.position.array as Float32Array;
        const originalPositions = (particles.geometry as any).originalPositions as Float32Array;
        const gridSize = 20;
        const modeFrequency = (selectedModeIndex % 4) + 1;
        const modeType = selectedModeIndex % 3;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 3;
                const x = originalPositions[index];
                const y = originalPositions[index + 1];

                let displacement = 0;
                if (modeType === 0) {
                    displacement = Math.sin(x * modeFrequency + time) * Math.cos(y * modeFrequency) * 0.3;
                } else if (modeType === 1) {
                    displacement = Math.cos(x * modeFrequency) * Math.sin(y * modeFrequency + time) * 0.3;
                } else {
                    displacement = Math.sin(x * modeFrequency + time) * Math.sin(y * modeFrequency + time * 0.7) * 0.25;
                }

                positions[index + 2] = displacement;

                const colorIntensity = (displacement + 0.3) / 0.6;
                const color = new THREE.Color().setHSL(0.7 + colorIntensity * 0.3, 0.8, 0.5);
                const colors = particles.geometry.attributes.color.array as Float32Array;
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.05;

        if (modeGroup) {
            modeGroup.rotation.x = Math.sin(time * 0.2) * 0.2;
            modeGroup.rotation.y = time * 0.1;
        }

        animateMode();
        controls.update();
        renderer.render(scene, camera);
    }

    $: if (simulationResult && scene) {
        createModeVisualization();
    }

    $: if (selectedModeIndex !== undefined && particles) {
        createModeVisualization();
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
        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xf107a3, 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        createModeVisualization();
        animate();

        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            renderer.dispose();
        };
    });
</script>

<div class="mode-container">
    <div bind:this={container} class="three-container"></div>
    <div class="mode-controls">
        <span class="mode-label">模态选择:</span>
        <div class="mode-buttons">
            {#each [0, 1, 2, 3, 4, 5, 6, 7] as mode}
                <button 
                    class:active={selectedModeIndex === mode}
                    on:click={() => selectedModeIndex = mode}
                >
                    {mode + 1}
                </button>
            {/each}
        </div>
    </div>
</div>

<style>
    .mode-container {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .three-container {
        flex: 1;
        position: relative;
    }

    .mode-controls {
        position: absolute;
        bottom: 15px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 15px;
        background: rgba(26, 26, 46, 0.9);
        padding: 10px 20px;
        border-radius: 25px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .mode-label {
        color: #00d4ff;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .mode-buttons {
        display: flex;
        gap: 5px;
    }

    .mode-buttons button {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .mode-buttons button:hover {
        background: rgba(123, 47, 247, 0.5);
        color: white;
    }

    .mode-buttons button.active {
        background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%);
        color: white;
        transform: scale(1.1);
    }
</style>
