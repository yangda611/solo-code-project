import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Renderer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.pixelPass = null;
    
    this.init();
  }
  
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, CONFIG.PLAYER.height, 0);
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = false;
    
    this.clock = new THREE.Clock();
    
    const container = document.getElementById('game-container');
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'game-canvas';
    
    this.setupLighting();
    this.setupEventListeners();
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = false;
    this.scene.add(directionalLight);
    
    const pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 30);
    pointLight1.position.set(0, 5, 0);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff0000, 0.3, 20);
    pointLight2.position.set(-20, 3, -20);
    this.scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x0000ff, 0.3, 20);
    pointLight3.position.set(20, 3, 20);
    this.scene.add(pointLight3);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  createPixelTexture(color, size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const baseColor = new THREE.Color(color);
    const r = Math.floor(baseColor.r * 255);
    const g = Math.floor(baseColor.g * 255);
    const b = Math.floor(baseColor.b * 255);
    
    for (let x = 0; x < size; x += 8) {
      for (let y = 0; y < size; y += 8) {
        const variation = Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + variation))}, ${Math.max(0, Math.min(255, g + variation))}, ${Math.max(0, Math.min(255, b + variation))})`;
        ctx.fillRect(x, y, 8, 8);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  createLowPolyGeometry(type, size = 1) {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(size, size, size);
      case 'sphere':
        return new THREE.SphereGeometry(size / 2, 8, 6);
      case 'cylinder':
        return new THREE.CylinderGeometry(size / 2, size / 2, size, 8, 1);
      case 'cone':
        return new THREE.ConeGeometry(size / 2, size, 8, 1);
      default:
        return new THREE.BoxGeometry(size, size, size);
    }
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  getDeltaTime() {
    return this.clock.getDelta();
  }
  
  getElapsedTime() {
    return this.clock.getElapsedTime();
  }
  
  dispose() {
    this.renderer.dispose();
  }
}
