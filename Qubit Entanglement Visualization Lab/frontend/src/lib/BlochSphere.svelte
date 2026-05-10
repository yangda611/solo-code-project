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
    let qubitSpheres: THREE.Mesh[] = [];
    let stateVectors: THREE.ArrowHelper[] = [];
    let entanglementLines: THREE.Line[] = [];
    let collapseRipples: THREE.Mesh[] = [];
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;
    let isDragging = false;
    let selectedQubit: THREE.Mesh | null = null;
    let time = 0;

    function createBlochSphere() {
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x1a2a4a,
            transparent: true,
            opacity: 0.3,
            wireframe: false,
            side: THREE.DoubleSide
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        const wireGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const wireSphere = new THREE.Mesh(wireGeometry, wireMaterial);
        scene.add(wireSphere);

        const axesMaterial = new THREE.LineBasicMaterial({ color: 0x6688cc, transparent: true, opacity: 0.6 });
        
        const xPoints = [new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)];
        const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints);
        scene.add(new THREE.Line(xGeometry, axesMaterial));

        const yPoints = [new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)];
        const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints);
        scene.add(new THREE.Line(yGeometry, axesMaterial));

        const zPoints = [new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 0, 2)];
        const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints);
        scene.add(new THREE.Line(zGeometry, axesMaterial));
    }

    function updateQubitVisualization() {
        qubitSpheres.forEach(s => scene.remove(s));
        stateVectors.forEach(v => scene.remove(v));
        entanglementLines.forEach(l => scene.remove(l));
        
        qubitSpheres = [];
        stateVectors = [];
        entanglementLines = [];

        if (!circuit) return;

        const qubitCount = circuit.qubitCount;
        const radius = 1.5;

        circuit.topology.forEach((qubit, index) => {
            const angle = (index / qubitCount) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const geometry = new THREE.SphereGeometry(0.15, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0x44aaff,
                emissive: 0x2266aa,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, 0);
            sphere.userData = { qubitIndex: index };
            scene.add(sphere);
            qubitSpheres.push(sphere);

            const dir = new THREE.Vector3(0, 0, 1);
            const origin = new THREE.Vector3(x, y, 0);
            const vector = new THREE.ArrowHelper(dir, origin, 1.3, 0xff6644, 0.2, 0.1);
            vector.userData = { qubitIndex: index };
            scene.add(vector);
            stateVectors.push(vector);
        });

        for (let i = 0; i < qubitCount; i++) {
            for (let j = i + 1; j < qubitCount; j++) {
                const entangled = simulationResult && 
                    simulationResult.entropyTrajectory.length > 0 &&
                    simulationResult.entropyTrajectory[simulationResult.entropyTrajectory.length - 1].entropy > 0.3;
                
                if (entangled) {
                    const angle1 = (i / qubitCount) * Math.PI * 2 - Math.PI / 2;
                    const angle2 = (j / qubitCount) * Math.PI * 2 - Math.PI / 2;
                    
                    const points = [
                        new THREE.Vector3(
                            Math.cos(angle1) * radius,
                            Math.sin(angle1) * radius,
                            0
                        ),
                        new THREE.Vector3(
                            Math.cos(angle2) * radius,
                            Math.sin(angle2) * radius,
                            0
                        )
                    ];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xff88ff,
                        transparent: true,
                        opacity: 0.7
                    });
                    const line = new THREE.Line(geometry, material);
                    line.userData = { qubit1: i, qubit2: j };
                    scene.add(line);
                    entanglementLines.push(line);
                }
            }
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.02;

        qubitSpheres.forEach((sphere, index) => {
            const pulse = Math.sin(time * 2 + index) * 0.1 + 1;
            sphere.scale.setScalar(pulse);
            (sphere.material as THREE.MeshPhongMaterial).emissiveIntensity = 
                0.3 + Math.sin(time * 3 + index) * 0.2;
        });

        stateVectors.forEach((vector, index) => {
            if (simulationResult) {
                const entropy = simulationResult.entropyTrajectory.length > 0 
                    ? simulationResult.entropyTrajectory[
                        Math.min(
                            Math.floor(time * 20), 
                            simulationResult.entropyTrajectory.length - 1
                        )
                    ].entropy 
                    : 0;
                
                const rotationAngle = time * (0.5 + entropy * 2) + index;
                
                vector.setDirection(new THREE.Vector3(
                    Math.sin(rotationAngle) * Math.cos(time + index),
                    Math.sin(rotationAngle) * Math.sin(time + index),
                    Math.cos(rotationAngle) * 0.5 + 0.5
                ).normalize());
            }
        });

        entanglementLines.forEach((line) => {
            const material = line.material as THREE.LineBasicMaterial;
            material.opacity = 0.4 + Math.sin(time * 4) * 0.3;
        });

        collapseRipples.forEach((ripple, index) => {
            const scale = ripple.scale.x + 0.05;
            ripple.scale.set(scale, scale, scale);
            const mat = ripple.material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, mat.opacity - 0.02);
            
            if (mat.opacity <= 0) {
                scene.remove(ripple);
                collapseRipples.splice(index, 1);
            }
        });

        controls.update();
        renderer.render(scene, camera);
    }

    function triggerCollapseAnimation() {
        collapseRipples.forEach(r => scene.remove(r));
        collapseRipples = [];

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const geometry = new THREE.RingGeometry(0.1, 0.15, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x44ff88,
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide
                });
                const ripple = new THREE.Mesh(geometry, material);
                ripple.rotation.x = Math.PI / 2;
                ripple.position.set(0, 0, 0);
                scene.add(ripple);
                collapseRipples.push(ripple);
            }, i * 100);
        }
    }

    function onMouseDown(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(qubitSpheres);
        
        if (intersects.length > 0) {
            isDragging = true;
            selectedQubit = intersects[0].object as THREE.Mesh;
            controls.enabled = false;
        }
    }

    function onMouseMove(event: MouseEvent) {
        if (!isDragging || !selectedQubit) return;
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
            const qubitIndex = selectedQubit.userData.qubitIndex;
            const qubitCount = circuit?.qubitCount || 1;
            const radius = 1.5;
            
            const angle = (qubitIndex / qubitCount) * Math.PI * 2 - Math.PI / 2;
            const baseX = Math.cos(angle) * radius;
            const baseY = Math.sin(angle) * radius;
            
            const offsetX = (intersection.x - baseX) * 0.5;
            const offsetY = (intersection.y - baseY) * 0.5;
            
            selectedQubit.position.x = baseX + offsetX;
            selectedQubit.position.y = baseY + offsetY;
            
            if (stateVectors[qubitIndex]) {
                stateVectors[qubitIndex].position.set(
                    selectedQubit.position.x,
                    selectedQubit.position.y,
                    0
                );
            }
        }
    }

    function onMouseUp() {
        isDragging = false;
        selectedQubit = null;
        controls.enabled = true;
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

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        const ambientLight = new THREE.AmbientLight(0x444466, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x88aaff, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xff88aa, 0.5, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        createBlochSphere();
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    });

    beforeUpdate(() => {
        if (circuit) {
            updateQubitVisualization();
        }
    });

    $: if (simulationResult) {
        updateQubitVisualization();
        triggerCollapseAnimation();
    }

    onDestroy(() => {
        cancelAnimationFrame(animationId);
        renderer?.dispose();
        renderer?.domElement?.removeEventListener('mousedown', onMouseDown);
        renderer?.domElement?.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        container?.removeChild(renderer?.domElement);
    });
</script>

<div bind:this={container} class="bloch-container"></div>

<style>
    .bloch-container {
        width: 100%;
        height: 100%;
        min-height: 300px;
        flex: 1;
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: grab;
    }
    .bloch-container:active {
        cursor: grabbing;
    }
</style>
