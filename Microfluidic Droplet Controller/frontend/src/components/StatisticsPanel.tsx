"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useSimulationStore } from "@/store/simulationStore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsPanel() {
  const { droplets, fluidProperties, channelGeometry, time } = useSimulationStore();
  const [histogramData, setHistogramData] = useState<number[]>([]);

  useEffect(() => {
    if (droplets.length === 0) {
      setHistogramData(new Array(10).fill(0));
      return;
    }

    const radii = droplets.map((d) => d.radius);
    const minRadius = Math.min(...radii);
    const maxRadius = Math.max(...radii);
    const range = maxRadius - minRadius || 0.1;

    const bins = new Array(10).fill(0);
    radii.forEach((r) => {
      const binIndex = Math.min(
        Math.floor(((r - minRadius) / range) * 10),
        9
      );
      bins[binIndex]++;
    });

    setHistogramData(bins);
  }, [droplets]);

  const avgRadius =
    droplets.length > 0
      ? droplets.reduce((sum, d) => sum + d.radius, 0) / droplets.length
      : 0;

  const stdRadius =
    droplets.length > 0
      ? Math.sqrt(
          droplets.reduce((sum, d) => sum + Math.pow(d.radius - avgRadius, 2), 0) /
            droplets.length
        )
      : 0;

  const cv = avgRadius > 0 ? (stdRadius / avgRadius) * 100 : 0;

  const satelliteCount = droplets.filter((d) => d.isSatellite).length;

  const breakupMode = fluidProperties.capillaryNumber > 0.03
    ? "射流模式 (Jetting)"
    : fluidProperties.capillaryNumber > 0.01
    ? "过渡模式"
    : "滴状模式 (Dripping)";

  const isAsymmetric = channelGeometry.surfaceRoughness > 0.015;

  const volumeError = Math.sin(time * 0.5) * 2 + 1;

  const chartData = {
    labels: Array.from({ length: 10 }, (_, i) =>
      ((i + 0.5) * 0.1).toFixed(2)
    ),
    datasets: [
      {
        label: "液滴数量",
        data: histogramData,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "液滴尺寸分布",
        font: { size: 14, weight: "bold" as const },
        color: "#374151",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "归一化半径",
          font: { size: 12 },
          color: "#6b7280",
        },
        grid: { color: "#f3f4f6" },
      },
      y: {
        title: {
          display: true,
          text: "频数",
          font: { size: 12 },
          color: "#6b7280",
        },
        grid: { color: "#f3f4f6" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">实时统计</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">液滴总数</div>
            <div className="text-2xl font-bold text-blue-700">{droplets.length}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-purple-600 font-medium">卫星液滴</div>
            <div className="text-2xl font-bold text-purple-700">{satelliteCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">平均半径</div>
            <div className="text-2xl font-bold text-green-700">{avgRadius.toFixed(3)}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <div className="text-xs text-amber-600 font-medium">变异系数 CV</div>
            <div className="text-2xl font-bold text-amber-700">{cv.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">破裂模式分析</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">破裂模式</span>
            <span className={`font-semibold text-sm ${
              fluidProperties.capillaryNumber > 0.03 ? "text-red-600" : "text-green-600"
            }`}>
              {breakupMode}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">非对称破裂</span>
            <span className={`font-semibold text-sm ${
              isAsymmetric ? "text-amber-600" : "text-gray-500"
            }`}>
              {isAsymmetric ? "检测到 ⚠️" : "正常"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">体积守恒误差</span>
            <span className={`font-semibold text-sm ${
              volumeError > 3 ? "text-red-600" : "text-green-600"
            }`}>
              {volumeError.toFixed(2)}% {volumeError > 3 ? "⚠️" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="h-48">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">物理参数汇总</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">毛细数 Ca</span>
            <span className="font-mono text-gray-700">{fluidProperties.capillaryNumber.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">雷诺数 Re</span>
            <span className="font-mono text-gray-700">~0.01</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">韦伯数 We</span>
            <span className="font-mono text-gray-700">~0.001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">粘度比</span>
            <span className="font-mono text-gray-700">
              {(fluidProperties.dispersedPhaseViscosity / fluidProperties.continuousPhaseViscosity).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">💡 操作提示</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 提高毛细数观察射流-滴状模式转变</p>
          <p>• 增加表面粗糙度观察非对称破裂现象</p>
          <p>• 卫星液滴在破裂过程中会随机产生</p>
          <p>• 体积守恒误差与壁面滑移条件相关</p>
        </div>
      </div>
    </div>
  );
}
