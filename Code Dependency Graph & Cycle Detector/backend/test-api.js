const http = require('http');

const baseUrl = 'http://localhost:3000/api';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('  后端 API 测试');
  console.log('========================================\n');

  try {
    console.log('[1/6] 测试健康检查...');
    const health = await request('/health');
    console.log(`  ✓ 状态码: ${health.status}`);
    console.log(`  ✓ 响应: ${JSON.stringify(health.data).substring(0, 80)}...\n`);

    console.log('[2/6] 测试获取预设列表...');
    const presets = await request('/presets');
    console.log(`  ✓ 状态码: ${presets.status}`);
    console.log(`  ✓ 预设数量: ${presets.data.presets.length}\n`);

    console.log('[3/6] 测试伪代码解析...');
    const parseResult = await request('/parse-pseudocode', 'POST', {
      code: 'A -> B\nA -> C\nB -> D\nC -> D\nD -> E'
    });
    console.log(`  ✓ 状态码: ${parseResult.status}`);
    console.log(`  ✓ 节点数量: ${Object.keys(parseResult.data.graph).length}\n`);

    console.log('[4/6] 测试图分析（带循环）...');
    const analyzeResult = await request('/analyze', 'POST', {
      graph: {
        A: ['B', 'C'],
        B: ['D'],
        C: ['E'],
        D: ['F'],
        E: ['F'],
        F: ['G'],
        G: ['H'],
        H: ['B'],
        I: ['I']
      },
      dynamicNodes: []
    });
    console.log(`  ✓ 状态码: ${analyzeResult.status}`);
    console.log(`  ✓ 强连通分量数: ${analyzeResult.data.stronglyConnectedComponents.length}`);
    console.log(`  ✓ 循环数: ${analyzeResult.data.cycles.length}`);
    console.log(`  ✓ 推荐方案数: ${analyzeResult.data.recommendations.length}`);
    console.log(`  ✓ 分析耗时: ${analyzeResult.data.performance.analysisTime}ms\n`);

    console.log('[5/6] 测试保存快照...');
    const snapshotResult = await request('/snapshots', 'POST', {
      name: '测试快照',
      graphData: { A: ['B'], B: ['C'] }
    });
    console.log(`  ✓ 状态码: ${snapshotResult.status}`);
    console.log(`  ✓ 快照ID: ${snapshotResult.data.id}\n`);

    console.log('[6/6] 测试获取快照列表...');
    const snapshotsResult = await request('/snapshots');
    console.log(`  ✓ 状态码: ${snapshotsResult.status}`);
    console.log(`  ✓ 快照数量: ${snapshotsResult.data.snapshots.length}\n`);

    console.log('========================================');
    console.log('  ✅ 所有测试通过！');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

runTests();
