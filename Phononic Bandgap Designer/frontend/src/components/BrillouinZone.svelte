<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import type { SimulationResult } from '../types';

    export let simulationResult: SimulationResult | null;
    export let animationProgress: number;

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;
    let pathGroup: THREE.Group;
    let kPointMesh: THREE.Mesh;
    let time = 0;
    let localProgress = 0;

    function createBrillouinZone() {
        if (pathGroup) {
            scene.remove(pathGroup);
        }

        pathGroup = new THREE.Group();

        const zoneMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });

        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.8
        });

        const zoneGeometry = new THREE.BoxGeometry(2, 2, 2);
        const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        pathGroup.add(zone);

        const edges = new THREE.EdgesGeometry(zoneGeometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        pathGroup.add(line);

        if (simulationResult) {
            const highSymmetryPoints = simulationResult.highSymmetryPath;
            
            const pointMaterial = new THREE.MeshPhongMaterial({
                color: 0xf107a3,
                emissive: 0xf107a3,
                emissiveIntensity: 0.5
            });

            highSymmetryPoints.forEach((point, index) => {
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08, 16, 16),
                    pointMaterial
                );
                
                const pos = point.coordinates;
                sphere.position.set(
                    (pos[0] - 0.5) * 2,
                    (pos[1] - 0.5) * 2,
                    (pos[2] || 0.5 - 0.5) * 2
                );
                pathGroup.add(sphere);

                const label = createTextSprite(point.name);
                label.position.copy(sphere.position);
                label.position.y += 0.15;
                pathGroup.add(label);
            });

            const pathMaterial = new THREE.LineBasicMaterial({
                color: 0x7b2ff7,
                linewidth: 3
            });

            const pathPoints: THREE.Vector3[] = [];
            highSymmetryPoints.forEach((point) => {
                const pos = point.coordinates;
                pathPoints.push(new THREE.Vector3(
                    (pos[0] - 0.5) * 2,
                    (pos[1] - 0.5) * 2,
                    (pos[2] || 0.5 - 0.5) * 2
                ));
            });

            const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
            const pathLine = new THREE.Line(pathGeometry, pathMaterial);
            pathGroup.add(pathLine);

            const kPointMaterial = new THREE.MeshPhongMaterial({
                color: 0x4ade80,
                emissive: 0x4ade80,
                emissiveIntensity: 0.8
            });
            kPointMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 20, 20),
                kPointMaterial
            );
            pathGroup.add(kPointMesh);
        }

        scene.add(pathGroup);
    }

    function createTextSprite(text: string): THREE.Sprite {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#ffffff';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillText(text, 32, 22);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.5, 0.25, 1);
        return sprite;
    }

    function animateKPoint() {
        if (!kPointMesh || !simulationResult) return;

        const progress = Math.min(localProgress, animationProgress);
        const highSymmetryPoints = simulationResult.highSymmetryPath;
        const totalSegments = highSymmetryPoints.length - 1;
        const currentSegment = Math.floor(progress * totalSegments);
        const segmentProgress = (progress * totalSegments) % 1;

        if (currentSegment < totalSegments) {
            const start = highSymmetryPoints[currentSegment].coordinates;
            const end = highSymmetryPoints[currentSegment + 1].coordinates;

            kPointMesh.position.set(
                ((start[0] + (end[0] - start[0]) * segmentProgress) - 0.5) * 2,
                ((start[1] + (end[1] - start[1]) * segmentProgress) - 0.5) * 2,
                (((start[2] || 0) + ((end[2] || 0) - (start[2] || 0)) * segmentProgress) - 0.5) * 2
            );

            const pulseScale = 1 + Math.sin(time * 4) * 0.2;
            kPointMesh.scale.setScalar(pulseScale);
        }

        localProgress += 0.005;
        if (localProgress > 1) {
            localProgress = 0;
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.016;

        if (pathGroup) {
            pathGroup.rotation.y += 0.002;
        }

        animateKPoint();
        controls.update();
        renderer.render(scene, camera);
    }

    $: if (simulationResult && scene) {
        localProgress = 0;
        createBrillouinZone();
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
        camera.position.set(2.5, 2.5, 2.5);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        createBrillouinZone();
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

<div bind:this={container} class="brillouin-container"></div>

<style>
    .brillouin-container {
        width: 100%;
        height: 100%;
        position: relative;
    }
</style>
