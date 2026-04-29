import { Progress, Row, Col, Typography } from 'antd';
import { useMemo } from 'react';

const { Text } = Typography;

const getGradientColors = (level) => {
  switch (level) {
    case 'safe':
      return { from: '#52c41a', to: '#73d13d' };
    case 'warning':
      return { from: '#faad14', to: '#ffc53d' };
    case 'danger':
      return { from: '#fa8c16', to: '#ffa940' };
    case 'critical':
      return { from: '#ff4d4f', to: '#ff7875' };
    default:
      return { from: '#52c41a', to: '#73d13d' };
  }
};

const getStatusText = (level) => {
  switch (level) {
    case 'safe': return '吊装状态安全，可以正常作业';
    case 'warning': return '存在一定风险，建议谨慎操作';
    case 'danger': return '风险较高，建议停止作业并检查参数';
    case 'critical': return '严重危险！立即停止作业，存在倾覆风险';
    default: return '未知状态';
  }
};

function getStabilityColor(score) {
  if (score > 70) return '#52c41a';
  if (score > 40) return '#faad14';
  return '#ff4d4f';
}

export default function RiskIndicator({ riskPercentage, stabilityScore, riskLevel }) {
  const colors = useMemo(() => getGradientColors(riskLevel), [riskLevel]);
  const statusText = useMemo(() => getStatusText(riskLevel), [riskLevel]);
  const stabilityColor = useMemo(() => getStabilityColor(stabilityScore), [stabilityScore]);
  
  const riskStrokeColor = useMemo(() => ({
    '0%': colors.from,
    '100%': colors.to
  }), [colors.from, colors.to]);

  const stabilityStrokeColor = useMemo(() => ({
    '0%': stabilityColor,
    '100%': stabilityColor
  }), [stabilityColor]);

  return (
    <div>
      <Row gutter={[16, 8]} align="middle">
        <Col flex="none">
          <Progress
            type="circle"
            percent={riskPercentage}
            size={60}
            strokeColor={riskStrokeColor}
            format={(percent) => (
              <span style={{ fontSize: '12px', color: colors.from }}>
                {percent}%
              </span>
            )}
          />
        </Col>
        <Col flex="auto">
          <div style={{ marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '13px' }}>风险指数</Text>
          </div>
          <Progress
            percent={riskPercentage}
            showInfo={false}
            strokeColor={riskStrokeColor}
            strokeLinecap="round"
          />
        </Col>
      </Row>
      
      <Row gutter={[16, 8]} align="middle" style={{ marginTop: '8px' }}>
        <Col flex="none">
          <Progress
            type="circle"
            percent={stabilityScore}
            size={60}
            strokeColor={stabilityStrokeColor}
            format={(percent) => (
              <span style={{ fontSize: '12px', color: stabilityColor }}>
                {percent}分
              </span>
            )}
          />
        </Col>
        <Col flex="auto">
          <div style={{ marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '13px' }}>稳定性评分</Text>
          </div>
          <Progress
            percent={stabilityScore}
            showInfo={false}
            strokeColor={stabilityStrokeColor}
            strokeLinecap="round"
          />
        </Col>
      </Row>
      
      <div style={{ marginTop: '8px', padding: '8px', borderRadius: '4px', backgroundColor: `${colors.from}15` }}>
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '12px', 
            color: colors.from,
            fontStyle: 'italic'
          }}
        >
          {statusText}
        </Text>
      </div>
    </div>
  );
}
