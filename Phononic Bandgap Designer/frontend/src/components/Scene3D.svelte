<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import type { GeometryParams, MaterialParams } from '../types';

    export let geometryParams: GeometryParams;
    export let materialParams: MaterialParams;

    let container: HTMLDivElement;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let animationId: number;
    let latticeGroup: THREE.Group;
    let time = 0;

    function createLattice() {
        if (latticeGroup) {
            scene.remove(latticeGroup);
        }

        latticeGroup = new THREE.Group();
        const size = 4;

        const matrixMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        const scattererMaterial = new THREE.MeshPhongMaterial({
            color: 0x7b2ff7,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });

        const edgeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00d4ff, 
            transparent: true, 
            opacity: 0.5 
        });

        const scattererRadius = Math.sqrt(geometryParams.fillingFraction / Math.PI) * geometryParams.latticeConstant * 0.5;

        if (geometryParams.latticeType === 'square') {
            for (let i = -size; i <= size; i++) {
                for (let j = -size; j <= size; j++) {
                    const unitCell = new THREE.Group();
                    
                    const cellGeometry = new THREE.BoxGeometry(
                        geometryParams.latticeConstant,
                        geometryParams.latticeConstant,
                        0.1
                    );
                    const cell = new THREE.Mesh(cellGeometry, matrixMaterial);
                    unitCell.add(cell);

                    const edges = new THREE.EdgesGeometry(cellGeometry);
                    const line = new THREE.LineSegments(edges, edgeMaterial);
                    unitCell.add(line);

                    let scatterer: THREE.Mesh;
                    if (geometryParams.scattererShape === 'circle') {
                        scatterer = new THREE.Mesh(
                            new THREE.CylinderGeometry(scattererRadius, scattererRadius, 0.15, 32),
                            scattererMaterial
                        );
                        scatterer.rotation.x = Math.PI / 2;
                    } else {
                        scatterer = new THREE.Mesh(
                            new THREE.BoxGeometry(scattererRadius * 1.8, scattererRadius * 1.8, 0.15),
                            scattererMaterial
                        );
                    }
                    scatterer.position.z = 0.05;
                    unitCell.add(scatterer);

                    unitCell.position.set(
                        i * geometryParams.latticeConstant,
                        j * geometryParams.latticeConstant,
                        0
                    );
                    latticeGroup.add(unitCell);
                }
            }
        } else if (geometryParams.latticeType === 'hexagonal') {
            const dx = geometryParams.latticeConstant;
            const dy = geometryParams.latticeConstant * Math.sqrt(3) / 2;
            
            for (let i = -size; i <= size; i++) {
                for (let j = -size; j <= size; j++) {
                    const unitCell = new THREE.Group();
                    
                    const cellGeometry = new THREE.CylinderGeometry(
                        geometryParams.latticeConstant * 0.55,
                        geometryParams.latticeConstant * 0.55,
                        0.1,
                        6
                    );
                    const cell = new THREE.Mesh(cellGeometry, matrixMaterial);
                    unitCell.add(cell);

                    const edges = new THREE.EdgesGeometry(cellGeometry);
                    const line = new THREE.LineSegments(edges, edgeMaterial);
                    unitCell.add(line);

                    const scatterer = new THREE.Mesh(
                        new THREE.CylinderGeometry(scattererRadius, scattererRadius, 0.15, 32),
                        scattererMaterial
                    );
                    scatterer.rotation.x = Math.PI / 2;
                    scatterer.position.z = 0.05;
                    unitCell.add(scatterer);

                    const offsetX = (j % 2) * dx / 2;
                    unitCell.position.set(
                        i * dx + offsetX,
                        j * dy,
                        0
                    );
                    latticeGroup.add(unitCell);
                }
            }
        } else if (geometryParams.latticeType === 'diamond' || geometryParams.latticeType === 'cubic') {
            const diamondOffsets = geometryParams.latticeType === 'diamond' ? [
                [0, 0, 0],
                [0.5, 0.5, 0],
                [0.5, 0, 0.5],
                [0, 0.5, 0.5],
                [0.25, 0.25, 0.25],
                [0.75, 0.75, 0.25],
                [0.75, 0.25, 0.75],
                [0.25, 0.75, 0.75]
            ] : [[0, 0, 0]];

            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    for (let k = -2; k <= 2; k++) {
                        for (const offset of diamondOffsets) {
                            const unitCell = new THREE.Group();
                            
                            const cellGeometry = new THREE.BoxGeometry(
                                geometryParams.latticeConstant * 0.3,
                                geometryParams.latticeConstant * 0.3,
                                geometryParams.latticeConstant * 0.3
                            );
                            const cell = new THREE.Mesh(cellGeometry, matrixMaterial);
                            unitCell.add(cell);

                            const edges = new THREE.EdgesGeometry(cellGeometry);
                            const line = new THREE.LineSegments(edges, edgeMaterial);
                            unitCell.add(line);

                            let scatterer: THREE.Mesh;
                            if (geometryParams.scattererShape === 'sphere') {
                                scatterer = new THREE.Mesh(
                                    new THREE.SphereGeometry(scattererRadius * 0.8, 16, 16),
                                    scattererMaterial
                                );
                            } else {
                                scatterer = new THREE.Mesh(
                                    new THREE.BoxGeometry(scattererRadius * 1.4, scattererRadius * 1.4, scattererRadius * 1.4),
                                    scattererMaterial
                                );
                            }
                            unitCell.add(scatterer);

                            unitCell.position.set(
                                (i + offset[0]) * geometryParams.latticeConstant,
                                (j + offset[1]) * geometryParams.latticeConstant,
                                (k + offset[2]) * geometryParams.latticeConstant
                            );
                            latticeGroup.add(unitCell);
                        }
                    }
                }
            }
        }

        scene.add(latticeGroup);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time += 0.016;

        if (latticeGroup) {
            latticeGroup.children.forEach((child) => {
                const scale = 1 + Math.sin(time * 2) * 0.02;
                child.scale.setScalar(scale);
            });
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
        camera.position.set(6, 6, 6);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xf107a3, 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        const gridHelper = new THREE.GridHelper(10, 10, 0x444, 0x222);
        scene.add(gridHelper);

        createLattice();
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

    $: if (scene) {
        createLattice();
    }
</script>

<div bind:this={container} class="scene-container"></div>

<style>
    .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
    }
</style>
