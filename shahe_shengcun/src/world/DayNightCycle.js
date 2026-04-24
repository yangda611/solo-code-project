import * as THREE from 'three';
import { DAY_LENGTH, NIGHT_START, NIGHT_END } from '../utils/Constants.js';

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.25;
    this.enabled = true;
    this.timeSpeed = 1.0;
    
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.3);
    this.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -64;
    this.sunLight.shadow.camera.right = 64;
    this.sunLight.shadow.camera.top = 64;
    this.sunLight.shadow.camera.bottom = -64;
    this.scene.add(this.sunLight);
    
    this.moonLight = new THREE.DirectionalLight(0x6060ff, 0.2);
    this.scene.add(this.moonLight);
    
    this.sunMesh = null;
    this.moonMesh = null;
    this.skyDome = null;
    
    this.createSkyDome();
    this.createCelestialBodies();
  }
  
  createSkyDome() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        uniform float time;
        varying vec3 vWorldPosition;
        
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float dayFactor = sin(time * 3.14159265 * 2.0) * 0.5 + 0.5;
          
          vec3 dayTop = vec3(0.0, 0.5, 1.0);
          vec3 dayBottom = vec3(0.8, 0.9, 1.0);
          
          vec3 nightTop = vec3(0.0, 0.0, 0.05);
          vec3 nightBottom = vec3(0.05, 0.05, 0.1);
          
          vec3 sunriseTop = vec3(1.0, 0.5, 0.3);
          vec3 sunriseBottom = vec3(1.0, 0.8, 0.6);
          
          vec3 topColor, bottomColor;
          
          float t = mod(time, 1.0);
          
          if (t < 0.25) {
            float blend = t / 0.25;
            topColor = mix(nightTop, sunriseTop, blend);
            bottomColor = mix(nightBottom, sunriseBottom, blend);
          } else if (t < 0.5) {
            float blend = (t - 0.25) / 0.25;
            topColor = mix(sunriseTop, dayTop, blend);
            bottomColor = mix(sunriseBottom, dayBottom, blend);
          } else if (t < 0.75) {
            float blend = (t - 0.5) / 0.25;
            topColor = mix(dayTop, sunriseTop, blend);
            bottomColor = mix(dayBottom, sunriseBottom, blend);
          } else {
            float blend = (t - 0.75) / 0.25;
            topColor = mix(sunriseTop, nightTop, blend);
            bottomColor = mix(sunriseBottom, nightBottom, blend);
          }
          
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    
    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyDome);
  }
  
  createCelestialBodies() {
    const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff44 });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunMesh);
    
    const moonGeometry = new THREE.SphereGeometry(10, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xccccff });
    this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    this.scene.add(this.moonMesh);
  }
  
  setTime(time) {
    this.time = time % 1.0;
  }
  
  getTime() {
    return this.time;
  }
  
  getTimeOfDay() {
    if (this.time >= 0.2 && this.time < 0.35) {
      return 'sunrise';
    } else if (this.time >= 0.35 && this.time < 0.7) {
      return 'day';
    } else if (this.time >= 0.7 && this.time < 0.8) {
      return 'sunset';
    } else {
      return 'night';
    }
  }
  
  update(deltaTime, playerPosition) {
    if (this.enabled) {
      this.time += (deltaTime / DAY_LENGTH) * this.timeSpeed;
      this.time = this.time % 1.0;
    }
    
    const angle = this.time * Math.PI * 2 - Math.PI / 2;
    const sunDistance = 400;
    const moonDistance = 400;
    
    const sunX = Math.cos(angle) * sunDistance;
    const sunY = Math.sin(angle) * sunDistance;
    this.sunMesh.position.set(
      playerPosition.x + sunX,
      sunY,
      playerPosition.z + sunDistance * 0.5
    );
    
    const moonAngle = angle + Math.PI;
    const moonX = Math.cos(moonAngle) * moonDistance;
    const moonY = Math.sin(moonAngle) * moonDistance;
    this.moonMesh.position.set(
      playerPosition.x + moonX,
      moonY,
      playerPosition.z - moonDistance * 0.5
    );
    
    this.sunLight.position.set(
      playerPosition.x + sunX * 0.1,
      Math.max(sunY * 0.1, 5),
      playerPosition.z + sunDistance * 0.05
    );
    this.sunLight.target.position.copy(playerPosition);
    
    this.moonLight.position.set(
      playerPosition.x + moonX * 0.1,
      Math.max(moonY * 0.1, 5),
      playerPosition.z - moonDistance * 0.05
    );
    
    const timeOfDay = this.getTimeOfDay();
    
    if (timeOfDay === 'night') {
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = 0.3;
      this.ambientLight.intensity = 0.1;
    } else if (timeOfDay === 'sunrise' || timeOfDay === 'sunset') {
      this.sunLight.intensity = 0.6;
      this.moonLight.intensity = 0.1;
      this.ambientLight.intensity = 0.2;
      
      const sunriseColor = new THREE.Color(0xffa566);
      this.sunLight.color = sunriseColor;
    } else {
      this.sunLight.intensity = 1.0;
      this.moonLight.intensity = 0.0;
      this.ambientLight.intensity = 0.4;
      
      const dayColor = new THREE.Color(0xffffff);
      this.sunLight.color = dayColor;
    }
    
    this.skyDome.material.uniforms.time.value = this.time;
    this.skyDome.position.copy(playerPosition);
    
    const sunVisible = sunY > -50;
    const moonVisible = moonY > -50;
    
    this.sunMesh.visible = sunVisible;
    this.moonMesh.visible = moonVisible;
  }
  
  getLightFactor() {
    const timeOfDay = this.getTimeOfDay();
    if (timeOfDay === 'night') return 0.2;
    if (timeOfDay === 'sunrise' || timeOfDay === 'sunset') return 0.6;
    return 1.0;
  }
}
