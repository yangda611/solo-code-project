<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import type { SimulationResult, GeometryParams } from '../types';

    export let simulationResult: SimulationResult | null;
    export let geometryParams: GeometryParams;
    export let animationProgress: number;

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;
    let waveGroup: THREE.Group;
    let time = 0;
    let waveParticles: THREE.Points;
    let scattererMeshes: THREE.Mesh[] = [];

    function createWaveVisualization() {
        if (waveGroup) {
            scene.remove(waveGroup);
        }

        waveGroup = new THREE.Group();
        scattererMeshes = [];

        const gridSize = 40;
        const particleCount = gridSize * gridSize;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 3;
                const x = (i / gridSize - 0.5) * 8;
                const y = (j / gridSize - 0.5) * 8;
                const z = 0;

                positions[index] = x;
                positions[index + 1] = y;
                positions[index + 2] = z;

                originalPositions[index] = x;
                originalPositions[index + 1] = y;
                originalPositions[index + 2] = z;

                const color = new THREE.Color().setHSL(0.55, 0.8, 0.5);
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
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        waveParticles = new THREE.Points(geometry, material);
        waveGroup.add(waveParticles);

        const scattererMaterial = new THREE.MeshPhongMaterial({
            color: 0x7b2ff7,
            transparent: true,
            opacity: 0.6,
            shininess: 100
        });

        const scattererRadius = 0.4;
        for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
                const scatterer = new THREE.Mesh(
                    new THREE.CylinderGeometry(scattererRadius, scattererRadius, 0.2, 32),
                    scattererMaterial
                );
                scatterer.rotation.x = Math.PI / 2;
                scatterer.position.set(
                    i * 1.2,
                    j * 1.2,
                    0
                );
                waveGroup.add(scatterer);
                scattererMeshes.push(scatterer);
            }
        }

        const sourceGeometry = new THREE.SphereGeometry(0.3, 20, 20);
        const sourceMaterial = new THREE.MeshPhongMaterial({
            color: 0xf107a3,
            emissive: 0xf107a3,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const source = new THREE.Mesh(sourceGeometry, sourceMaterial);
        source.position.set(-4, 0, 0);
        waveGroup.add(source);

        const ringGeometry = new THREE.RingGeometry(0.1, 1.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xf107a3,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(-4, 0, 0.1);
        waveGroup.add(ring);

        scene.add(waveGroup);
    }

    function animateWave() {
        if (!waveParticles || animationProgress < 0.3) return;

        const positions = waveParticles.geometry.attributes.position.array as Float32Array;
        const originalPositions = (waveParticles.geometry as any).originalPositions as Float32Array;
        const gridSize = 40;
        const waveSpeed = 2;
        const waveDecay = 0.15;
        const sourceX = -4;
        const sourceY = 0;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 3;
                const x = originalPositions[index];
                const y = originalPositions[index + 1];

                const distance = Math.sqrt((x - sourceX) ** 2 + (y - sourceY) ** 2);
                const wavePhase = time * waveSpeed - distance;
                
                let amplitude = Math.sin(wavePhase) * Math.exp(-distance * waveDecay);
                
                const latticeX = Math.round(x / 1.2) * 1.2;
                const latticeY = Math.round(y / 1.2) * 1.2;
                const distToScatterer = Math.sqrt((x - latticeX) ** 2 + (y - latticeY) ** 2);
                if (distToScatterer < 0.5) {
                    amplitude *= 0.2;
                }

                positions[index + 2] = amplitude * 0.4;

                const intensity = Math.abs(amplitude);
                const hue = 0.55 - intensity * 0.25;
                const color = new THREE.Color().setHSL(hue, 0.8, 0.4 + intensity * 0.3);
                const colors = waveParticles.geometry.attributes.color.array as Float32Array;
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }
        }

        waveParticles.geometry.attributes.position.needsUpdate = true;
        waveParticles.geometry.attributes.color.needsUpdate = true;

        scattererMeshes.forEach((mesh, index) => {
            const distToSource = Math.sqrt((mesh.position.x + 4) ** 2 + mesh.position.y ** 2);
            const vibration = Math.sin(time * 3 - distToSource * 0.5) * 0.02;
            mesh.position.z = vibration;
            mesh.scale.setScalar(1 + vibration * 2);
        });
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.03;

        if (waveGroup) {
            waveGroup.rotation.x = Math.sin(time * 0.1) * 0.15;
            waveGroup.rotation.y = Math.sin(time * 0.15) * 0.1;
        }

        animateWave();
        controls.update();
        renderer.render(scene, camera);
    }

    $: if (simulationResult && scene) {
        createWaveVisualization();
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
        camera.position.set(0, 5, 8);

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

        createWaveVisualization();
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

<div class="wave-container">
    <div bind:this={container} class="three-container"></div>
    <div class="wave-legend">
        <div class="legend-item">
            <span class="legend-dot" style="background: #f107a3;"></span>
            <span class="legend-text">波源</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background: #7b2ff7;"></span>
            <span class="legend-text">散射体</span>
        </div>
        <div class="legend-item">
            <span class="legend-dot" style="background: #00d4ff;"></span>
            <span class="legend-text">弹性波传播</span>
        </div>
    </div>
</div>

<style>
    .wave-container {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .three-container {
        width: 100%;
        height: 100%;
    }

    .wave-legend {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(26, 26, 46, 0.9);
        padding: 15px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }

    .legend-item:last-child {
        margin-bottom: 0;
    }

    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .legend-text {
        font-size: 0.8rem;
        color: #ccc;
    }
</style>
