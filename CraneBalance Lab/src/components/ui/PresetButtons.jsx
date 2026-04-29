import { Button, Card, Row, Col, Tooltip, Typography } from 'antd';
import { SafetyCertificateOutlined, WarningOutlined, ThunderboltOutlined, AlertOutlined } from '@ant-design/icons';
import { useCraneStore } from '../../store/craneStore';

const { Text } = Typography;

const presetConfig = {
  safe: {
    icon: <SafetyCertificateOutlined />,
    buttonType: 'primary',
    buttonColor: '#52c41a',
    tooltip: '所有参数在安全范围内，稳定性良好',
    description: '标准安全工况'
  },
  critical: {
    icon: <WarningOutlined />,
    buttonType: 'primary',
    buttonColor: '#ff4d4f',
    tooltip: '货物重量接近额定载荷，倾覆风险极高',
    description: '超重临界工况'
  },
  strongWind: {
    icon: <ThunderboltOutlined />,
    buttonType: 'primary',
    buttonColor: '#1890ff',
    tooltip: '强风作用下产生巨大侧向力矩',
    description: '强风侧向工况'
  },
  insufficient: {
    icon: <AlertOutlined />,
    buttonType: 'primary',
    buttonColor: '#fa8c16',
    tooltip: '配重不足以平衡货物重量',
    description: '配重不足工况'
  }
};

export default function PresetButtons() {
  const loadPreset = useCraneStore((state) => state.loadPreset);
  const currentPreset = useCraneStore((state) => state.currentPreset);
  const getPresets = useCraneStore((state) => state.getPresets);
  
  const presets = getPresets();
  
  const handlePresetClick = (key) => {
    loadPreset(key);
  };
  
  return (
    <Card 
      size="small" 
      title={<Text strong>预设事故场景</Text>}
      style={{ marginBottom: '16px' }}
    >
      <Row gutter={[8, 8]}>
        {Object.entries(presets).map(([key, preset]) => {
          const config = presetConfig[key] || presetConfig.safe;
          const isActive = currentPreset === key;
          
          return (
            <Col span={12} key={key}>
              <Tooltip title={config.tooltip}>
                <Button
                  type={config.buttonType}
                  icon={config.icon}
                  block
                  onClick={() => handlePresetClick(key)}
                  style={{
                    backgroundColor: isActive ? config.buttonColor : undefined,
                    borderColor: isActive ? config.buttonColor : undefined,
                    boxShadow: isActive ? `0 0 10px ${config.buttonColor}` : undefined,
                    height: 'auto',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                      {config.description}
                    </div>
                  </div>
                </Button>
              </Tooltip>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
