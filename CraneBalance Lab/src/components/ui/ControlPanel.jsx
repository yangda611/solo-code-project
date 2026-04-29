import { Card, Slider, Row, Col, Statistic, Divider, Tag, Space, Typography } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useCraneStore } from '../../store/craneStore';
import PresetButtons from './PresetButtons';
import RiskIndicator from './RiskIndicator';

const { Title, Text } = Typography;

const paramConfig = {
  towerHeight: {
    label: '塔吊高度',
    min: 15,
    max: 60,
    step: 1,
    unit: 'm',
    marks: { 15: '15', 30: '30', 45: '45', 60: '60' }
  },
  armLength: {
    label: '吊臂长度',
    min: 10,
    max: 50,
    step: 1,
    unit: 'm',
    marks: { 10: '10', 25: '25', 40: '40', 50: '50' }
  },
  counterweight: {
    label: '配重重量',
    min: 2,
    max: 20,
    step: 0.5,
    unit: 't',
    marks: { 2: '2', 8: '8', 14: '14', 20: '20' }
  },
  cargoWeight: {
    label: '货物重量',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 't',
    marks: { 0: '0', 4: '4', 8: '8', 12: '12' }
  },
  windLevel: {
    label: '风力等级',
    min: 0,
    max: 12,
    step: 1,
    unit: '级',
    marks: { 0: '0', 4: '4', 8: '8', 12: '12' }
  },
  rotationAngle: {
    label: '旋转角度',
    min: 0,
    max: 360,
    step: 5,
    unit: '°',
    marks: { 0: '0°', 90: '90°', 180: '180°', 270: '270°', 360: '360°' }
  }
};

export default function ControlPanel() {
  const towerHeight = useCraneStore((state) => state.towerHeight);
  const armLength = useCraneStore((state) => state.armLength);
  const counterweight = useCraneStore((state) => state.counterweight);
  const cargoWeight = useCraneStore((state) => state.cargoWeight);
  const windLevel = useCraneStore((state) => state.windLevel);
  const rotationAngle = useCraneStore((state) => state.rotationAngle);
  const physics = useCraneStore((state) => state.physics);
  const currentPreset = useCraneStore((state) => state.currentPreset);
  
  const setTowerHeight = useCraneStore((state) => state.setTowerHeight);
  const setArmLength = useCraneStore((state) => state.setArmLength);
  const setCounterweight = useCraneStore((state) => state.setCounterweight);
  const setCargoWeight = useCraneStore((state) => state.setCargoWeight);
  const setWindLevel = useCraneStore((state) => state.setWindLevel);
  const setRotationAngle = useCraneStore((state) => state.setRotationAngle);
  const getPresets = useCraneStore((state) => state.getPresets);
  
  const presets = getPresets();
  
  const getRiskIcon = (level) => {
    switch (level) {
      case 'safe': return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14', fontSize: '24px' }} />;
      case 'danger': return <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: '24px' }} />;
      case 'critical': return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />;
      default: return null;
    }
  };
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'safe': return '#52c41a';
      case 'warning': return '#faad14';
      case 'danger': return '#fa8c16';
      case 'critical': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };
  
  const getRiskText = (level) => {
    switch (level) {
      case 'safe': return '安全';
      case 'warning': return '警告';
      case 'danger': return '危险';
      case 'critical': return '临界';
      default: return '未知';
    }
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
        塔吊吊装模拟平台
      </Title>
      
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="none">
            {getRiskIcon(physics?.riskLevel)}
          </Col>
          <Col flex="auto">
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <Text strong>状态：</Text>
                <Tag color={getRiskColor(physics?.riskLevel)} style={{ fontSize: '14px', padding: '2px 12px' }}>
                  {getRiskText(physics?.riskLevel)}
                </Tag>
                {currentPreset && presets[currentPreset] && (
                  <Tag color="blue">{presets[currentPreset].name}</Tag>
                )}
              </Space>
              <RiskIndicator 
                riskPercentage={physics?.riskPercentage ?? 0}
                stabilityScore={physics?.stabilityScore ?? 100}
                riskLevel={physics?.riskLevel ?? 'safe'}
              />
            </Space>
          </Col>
        </Row>
      </Card>
      
      <PresetButtons />
      
      <Card 
        size="small" 
        title={<Text strong>参数调节</Text>}
        style={{ marginBottom: '16px' }}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.towerHeight.label}</Text>
              <Tag color="blue">{towerHeight}{paramConfig.towerHeight.unit}</Tag>
            </Row>
            <Slider
              min={paramConfig.towerHeight.min}
              max={paramConfig.towerHeight.max}
              step={paramConfig.towerHeight.step}
              value={towerHeight}
              onChange={setTowerHeight}
              marks={paramConfig.towerHeight.marks}
            />
          </div>
          
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.armLength.label}</Text>
              <Tag color="blue">{armLength}{paramConfig.armLength.unit}</Tag>
            </Row>
            <Slider
              min={paramConfig.armLength.min}
              max={paramConfig.armLength.max}
              step={paramConfig.armLength.step}
              value={armLength}
              onChange={setArmLength}
              marks={paramConfig.armLength.marks}
            />
          </div>
          
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.counterweight.label}</Text>
              <Tag color={counterweight < 5 ? 'red' : 'green'}>{counterweight}{paramConfig.counterweight.unit}</Tag>
            </Row>
            <Slider
              min={paramConfig.counterweight.min}
              max={paramConfig.counterweight.max}
              step={paramConfig.counterweight.step}
              value={counterweight}
              onChange={setCounterweight}
              marks={paramConfig.counterweight.marks}
            />
          </div>
          
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.cargoWeight.label}</Text>
              <Tag color={cargoWeight > 6 ? 'red' : cargoWeight > 4 ? 'orange' : 'green'}>
                {cargoWeight}{paramConfig.cargoWeight.unit}
              </Tag>
            </Row>
            <Slider
              min={paramConfig.cargoWeight.min}
              max={paramConfig.cargoWeight.max}
              step={paramConfig.cargoWeight.step}
              value={cargoWeight}
              onChange={setCargoWeight}
              marks={paramConfig.cargoWeight.marks}
            />
          </div>
          
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.windLevel.label}</Text>
              <Tag color={windLevel > 6 ? 'red' : windLevel > 4 ? 'orange' : 'green'}>
                {windLevel}{paramConfig.windLevel.unit}
              </Tag>
            </Row>
            <Slider
              min={paramConfig.windLevel.min}
              max={paramConfig.windLevel.max}
              step={paramConfig.windLevel.step}
              value={windLevel}
              onChange={setWindLevel}
              marks={paramConfig.windLevel.marks}
            />
          </div>
          
          <div>
            <Row justify="space-between" style={{ marginBottom: '8px' }}>
              <Text>{paramConfig.rotationAngle.label}</Text>
              <Tag color="blue">{rotationAngle}{paramConfig.rotationAngle.unit}</Tag>
            </Row>
            <Slider
              min={paramConfig.rotationAngle.min}
              max={paramConfig.rotationAngle.max}
              step={paramConfig.rotationAngle.step}
              value={rotationAngle}
              onChange={setRotationAngle}
              marks={paramConfig.rotationAngle.marks}
            />
          </div>
        </Space>
      </Card>
      
      <Card 
        size="small" 
        title={<Text strong>实时物理数据</Text>}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="重心偏移"
              value={physics?.centerOffsetDistance?.toFixed(2) || 0}
              suffix="m"
              styles={{ content: { color: physics?.stabilityRatio > 0.7 ? '#ff4d4f' : '#1890ff' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="稳定性系数"
              value={physics?.stabilityRatio?.toFixed(3) || 0}
              styles={{ content: { color: physics?.stabilityRatio > 0.7 ? '#ff4d4f' : '#52c41a' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="货物力矩"
              value={physics?.cargoTorque?.toFixed(1) || 0}
              suffix="t·m"
              styles={{ content: { color: '#1890ff' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="配重力矩"
              value={physics?.counterweightTorque?.toFixed(1) || 0}
              suffix="t·m"
              styles={{ content: { color: '#52c41a' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="净力矩"
              value={physics?.netTorque?.toFixed(1) || 0}
              suffix="t·m"
              styles={{ content: { color: Math.abs(physics?.netTorque || 0) > 20 ? '#ff4d4f' : '#faad14' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="风力影响"
              value={physics?.windInfluence?.toFixed(3) || 0}
              styles={{ content: { color: physics?.windInfluence > 0.3 ? '#ff4d4f' : '#1890ff' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="综合风险"
              value={physics?.combinedRisk?.toFixed(3) || 0}
              styles={{ content: { color: physics?.combinedRisk > 0.7 ? '#ff4d4f' : physics?.combinedRisk > 0.4 ? '#faad14' : '#52c41a' } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="预倾斜角度"
              value={physics?.tiltAngle?.toFixed(2) || 0}
              suffix="°"
              styles={{ content: { color: physics?.tiltAngle > 5 ? '#ff4d4f' : '#1890ff' } }}
            />
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              风险等级说明：
              <Tag color="green" style={{ marginLeft: '8px' }}>安全 (0-40%)</Tag>
              <Tag color="gold" style={{ marginLeft: '4px' }}>警告 (40-70%)</Tag>
              <Tag color="orange" style={{ marginLeft: '4px' }}>危险 (70-90%)</Tag>
              <Tag color="red" style={{ marginLeft: '4px' }}>临界 (90-100%)</Tag>
            </Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
