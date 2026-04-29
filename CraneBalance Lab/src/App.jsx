import { Layout } from 'antd';
import './App.css';
import Scene from './components/3d/Scene';
import ControlPanel from './components/ui/ControlPanel';

const { Sider, Content } = Layout;

function App() {
  return (
    <Layout className="app-layout">
      <Content className="scene-container">
        <Scene />
      </Content>
      <Sider
        width={380}
        className="control-panel-sider"
        theme="light"
      >
        <ControlPanel />
      </Sider>
    </Layout>
  );
}

export default App;
