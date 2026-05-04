const db = require('../config/database');

function seedPresets() {
  const presets = [
    {
      name: '健康生态缸',
      description: '各项参数正常，鱼群健康活跃的理想状态'
    },
    {
      name: '氧气不足缸',
      description: '氧气含量偏低，鱼群表现出缺氧症状'
    },
    {
      name: '藻类爆发缸',
      description: '藻类过度生长，水质浑浊，光照异常'
    },
    {
      name: '过滤器停机缸',
      description: '过滤器故障，水质开始恶化，产生报警'
    }
  ];

  const insertPreset = db.prepare(`
    INSERT OR IGNORE INTO presets (name, description) VALUES (?, ?)
  `);

  const getPresetId = db.prepare(`SELECT id FROM presets WHERE name = ?`);

  presets.forEach(preset => {
    insertPreset.run(preset.name, preset.description);
  });

  const healthyPresetId = getPresetId.get('健康生态缸')?.id;
  const lowOxygenPresetId = getPresetId.get('氧气不足缸')?.id;
  const algaePresetId = getPresetId.get('藻类爆发缸')?.id;
  const filterDownPresetId = getPresetId.get('过滤器停机缸')?.id;

  seedFish(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedCorals(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedDevices(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedWaterParameters(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedLightingSchedule(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedFeedingSchedule(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);
  seedAlerts(healthyPresetId, lowOxygenPresetId, algaePresetId, filterDownPresetId);

  db.exec(`INSERT OR IGNORE INTO current_state (id, active_preset_id) VALUES (1, ${healthyPresetId})`);

  console.log('Presets seeded successfully');
}

function seedFish(healthyId, lowOxygenId, algaeId, filterDownId) {
  const fishData = [
    { preset_id: healthyId, species: '小丑鱼', name: 'Nemo', quantity: 5, health_status: 'healthy', behavior: 'active' },
    { preset_id: healthyId, species: '蓝倒吊', name: 'Dory', quantity: 3, health_status: 'healthy', behavior: 'active' },
    { preset_id: healthyId, species: '神仙鱼', name: 'Angel', quantity: 2, health_status: 'healthy', behavior: 'calm' },
    { preset_id: lowOxygenId, species: '小丑鱼', name: 'Nemo', quantity: 5, health_status: 'stressed', behavior: 'gasping' },
    { preset_id: lowOxygenId, species: '蓝倒吊', name: 'Dory', quantity: 3, health_status: 'stressed', behavior: 'gasping' },
    { preset_id: algaeId, species: '小丑鱼', name: 'Nemo', quantity: 4, health_status: 'healthy', behavior: 'hiding' },
    { preset_id: algaeId, species: '蓝倒吊', name: 'Dory', quantity: 2, health_status: 'stressed', behavior: 'lethargic' },
    { preset_id: filterDownId, species: '小丑鱼', name: 'Nemo', quantity: 5, health_status: 'stressed', behavior: 'agitated' },
    { preset_id: filterDownId, species: '蓝倒吊', name: 'Dory', quantity: 3, health_status: 'stressed', behavior: 'agitated' },
    { preset_id: filterDownId, species: '神仙鱼', name: 'Angel', quantity: 2, health_status: 'sick', behavior: 'lethargic' }
  ];

  const insertFish = db.prepare(`
    INSERT OR IGNORE INTO fish (preset_id, species, name, quantity, health_status, behavior)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  fishData.forEach(fish => {
    insertFish.run(fish.preset_id, fish.species, fish.name, fish.quantity, fish.health_status, fish.behavior);
  });
}

function seedCorals(healthyId, lowOxygenId, algaeId, filterDownId) {
  const coralData = [
    { preset_id: healthyId, species: '鹿角珊瑚', name: 'Acropora', health_status: 'healthy', position: 'center' },
    { preset_id: healthyId, species: '脑珊瑚', name: 'Brain', health_status: 'healthy', position: 'left' },
    { preset_id: healthyId, species: '蘑菇珊瑚', name: 'Mushroom', health_status: 'healthy', position: 'right' },
    { preset_id: lowOxygenId, species: '鹿角珊瑚', name: 'Acropora', health_status: 'stressed', position: 'center' },
    { preset_id: lowOxygenId, species: '脑珊瑚', name: 'Brain', health_status: 'healthy', position: 'left' },
    { preset_id: algaeId, species: '鹿角珊瑚', name: 'Acropora', health_status: 'dying', position: 'center' },
    { preset_id: algaeId, species: '脑珊瑚', name: 'Brain', health_status: 'stressed', position: 'left' },
    { preset_id: filterDownId, species: '鹿角珊瑚', name: 'Acropora', health_status: 'stressed', position: 'center' },
    { preset_id: filterDownId, species: '脑珊瑚', name: 'Brain', health_status: 'stressed', position: 'left' }
  ];

  const insertCoral = db.prepare(`
    INSERT OR IGNORE INTO corals (preset_id, species, name, health_status, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  coralData.forEach(coral => {
    insertCoral.run(coral.preset_id, coral.species, coral.name, coral.health_status, coral.position);
  });
}

function seedDevices(healthyId, lowOxygenId, algaeId, filterDownId) {
  const deviceData = [
    { preset_id: healthyId, type: 'filter', name: '主过滤器', status: 'running', power: 100 },
    { preset_id: healthyId, type: 'air_pump', name: '氧气泵', status: 'running', power: 80 },
    { preset_id: healthyId, type: 'heater', name: '加热棒', status: 'running', power: 50 },
    { preset_id: healthyId, type: 'light', name: '主灯光', status: 'running', power: 100 },
    { preset_id: lowOxygenId, type: 'filter', name: '主过滤器', status: 'running', power: 100 },
    { preset_id: lowOxygenId, type: 'air_pump', name: '氧气泵', status: 'malfunction', power: 20 },
    { preset_id: lowOxygenId, type: 'heater', name: '加热棒', status: 'running', power: 50 },
    { preset_id: lowOxygenId, type: 'light', name: '主灯光', status: 'running', power: 100 },
    { preset_id: algaeId, type: 'filter', name: '主过滤器', status: 'running', power: 60 },
    { preset_id: algaeId, type: 'air_pump', name: '氧气泵', status: 'running', power: 80 },
    { preset_id: algaeId, type: 'heater', name: '加热棒', status: 'running', power: 70 },
    { preset_id: algaeId, type: 'light', name: '主灯光', status: 'running', power: 100 },
    { preset_id: filterDownId, type: 'filter', name: '主过滤器', status: 'stopped', power: 0 },
    { preset_id: filterDownId, type: 'air_pump', name: '氧气泵', status: 'running', power: 80 },
    { preset_id: filterDownId, type: 'heater', name: '加热棒', status: 'running', power: 50 },
    { preset_id: filterDownId, type: 'light', name: '主灯光', status: 'running', power: 100 }
  ];

  const insertDevice = db.prepare(`
    INSERT OR IGNORE INTO devices (preset_id, type, name, status, power)
    VALUES (?, ?, ?, ?, ?)
  `);

  deviceData.forEach(device => {
    insertDevice.run(device.preset_id, device.type, device.name, device.status, device.power);
  });
}

function seedWaterParameters(healthyId, lowOxygenId, algaeId, filterDownId) {
  const waterData = [
    { preset_id: healthyId, temperature: 25.5, ph: 8.1, ammonia: 0.01, nitrite: 0.02, nitrate: 15, oxygen: 8.5, salinity: 1.025, clarity: 95, algae_level: 5 },
    { preset_id: lowOxygenId, temperature: 26.0, ph: 7.8, ammonia: 0.05, nitrite: 0.1, nitrate: 25, oxygen: 3.5, salinity: 1.024, clarity: 80, algae_level: 10 },
    { preset_id: algaeId, temperature: 27.0, ph: 8.3, ammonia: 0.02, nitrite: 0.05, nitrate: 40, oxygen: 6.0, salinity: 1.026, clarity: 40, algae_level: 85 },
    { preset_id: filterDownId, temperature: 25.8, ph: 7.5, ammonia: 0.3, nitrite: 0.4, nitrate: 60, oxygen: 5.0, salinity: 1.023, clarity: 50, algae_level: 30 }
  ];

  const insertWater = db.prepare(`
    INSERT OR IGNORE INTO water_parameters (preset_id, temperature, ph, ammonia, nitrite, nitrate, oxygen, salinity, clarity, algae_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  waterData.forEach(data => {
    insertWater.run(data.preset_id, data.temperature, data.ph, data.ammonia, data.nitrite, data.nitrate, data.oxygen, data.salinity, data.clarity, data.algae_level);
  });
}

function seedLightingSchedule(healthyId, lowOxygenId, algaeId, filterDownId) {
  const lightingData = [
    { preset_id: healthyId, name: '白天模式', start_time: '08:00', end_time: '20:00', intensity: 100, color_temperature: 6500, is_active: 1 },
    { preset_id: healthyId, name: '月光模式', start_time: '20:00', end_time: '08:00', intensity: 10, color_temperature: 3000, is_active: 0 },
    { preset_id: lowOxygenId, name: '白天模式', start_time: '08:00', end_time: '20:00', intensity: 100, color_temperature: 6500, is_active: 1 },
    { preset_id: algaeId, name: '白天模式', start_time: '06:00', end_time: '22:00', intensity: 100, color_temperature: 10000, is_active: 1 },
    { preset_id: filterDownId, name: '白天模式', start_time: '08:00', end_time: '20:00', intensity: 100, color_temperature: 6500, is_active: 1 }
  ];

  const insertLighting = db.prepare(`
    INSERT OR IGNORE INTO lighting_schedule (preset_id, name, start_time, end_time, intensity, color_temperature, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  lightingData.forEach(data => {
    insertLighting.run(data.preset_id, data.name, data.start_time, data.end_time, data.intensity, data.color_temperature, data.is_active);
  });
}

function seedFeedingSchedule(healthyId, lowOxygenId, algaeId, filterDownId) {
  const feedingData = [
    { preset_id: healthyId, name: '早餐', time: '09:00', amount: 1.0, food_type: 'flakes', is_active: 1 },
    { preset_id: healthyId, name: '晚餐', time: '18:00', amount: 1.5, food_type: 'pellets', is_active: 1 },
    { preset_id: lowOxygenId, name: '早餐', time: '09:00', amount: 0.5, food_type: 'flakes', is_active: 1 },
    { preset_id: algaeId, name: '早餐', time: '09:00', amount: 1.0, food_type: 'flakes', is_active: 1 },
    { preset_id: filterDownId, name: '早餐', time: '09:00', amount: 0.8, food_type: 'flakes', is_active: 1 }
  ];

  const insertFeeding = db.prepare(`
    INSERT OR IGNORE INTO feeding_schedule (preset_id, name, time, amount, food_type, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  feedingData.forEach(data => {
    insertFeeding.run(data.preset_id, data.name, data.time, data.amount, data.food_type, data.is_active);
  });
}

function seedAlerts(healthyId, lowOxygenId, algaeId, filterDownId) {
  const alertData = [
    { preset_id: lowOxygenId, type: 'oxygen', severity: 'critical', message: '氧气含量严重不足！当前氧气含量: 3.5 mg/L', is_resolved: 0 },
    { preset_id: lowOxygenId, type: 'device', severity: 'warning', message: '氧气泵运行异常，功率过低', is_resolved: 0 },
    { preset_id: algaeId, type: 'water', severity: 'warning', message: '硝酸盐含量过高: 40 ppm', is_resolved: 0 },
    { preset_id: algaeId, type: 'algae', severity: 'critical', message: '藻类爆发！藻类水平: 85%', is_resolved: 0 },
    { preset_id: filterDownId, type: 'device', severity: 'critical', message: '主过滤器已停机！', is_resolved: 0 },
    { preset_id: filterDownId, type: 'water', severity: 'critical', message: '氨氮含量过高: 0.3 ppm', is_resolved: 0 },
    { preset_id: filterDownId, type: 'water', severity: 'critical', message: '亚硝酸盐含量过高: 0.4 ppm', is_resolved: 0 }
  ];

  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO alerts (preset_id, type, severity, message, is_resolved)
    VALUES (?, ?, ?, ?, ?)
  `);

  alertData.forEach(alert => {
    insertAlert.run(alert.preset_id, alert.type, alert.severity, alert.message, alert.is_resolved);
  });
}

module.exports = { seedPresets };
