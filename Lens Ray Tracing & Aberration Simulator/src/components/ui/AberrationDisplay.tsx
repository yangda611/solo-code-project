import { useOpticsStore } from '@/store/useOpticsStore';
import { Target, Droplets, Zap, CircleDot } from 'lucide-react';

export const AberrationDisplay = () => {
  const { aberrationData, rays } = useOpticsStore();
  
  const totalRays = rays.length;
  const reflectedRays = rays.filter(r => r.isTotallyReflected).length;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
      <h3 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">
        像差分析数据
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <AberrationCard
          icon={Target}
          label="球差"
          value={aberrationData.sphericalAberration.toFixed(3)}
          unit="mm"
          color="cyan"
          description="近轴与边缘焦点差"
        />
        
        <AberrationCard
          icon={Droplets}
          label="色差"
          value={aberrationData.chromaticAberration.toFixed(3)}
          unit="mm"
          color="purple"
          description="红蓝焦点分离"
        />
        
        <AberrationCard
          icon={Zap}
          label="彗差"
          value={aberrationData.coma.toFixed(3)}
          unit="mm"
          color="yellow"
          description="非对称像散"
        />
        
        <AberrationCard
          icon={CircleDot}
          label="全反射"
          value={`${reflectedRays}/${totalRays}`}
          unit=""
          color="red"
          description="逃逸光线数"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <h4 className="text-xs text-slate-400 mb-3 uppercase tracking-wider">
          焦点位置
        </h4>
        <div className="space-y-2 text-xs">
          {aberrationData.paraxialFocalPoint && (
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                近轴焦点
              </span>
              <span className="font-mono text-slate-300">
                Z = {aberrationData.paraxialFocalPoint.z.toFixed(2)}mm
              </span>
            </div>
          )}
          {aberrationData.marginalFocalPoint && (
            <div className="flex items-center justify-between">
              <span className="text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                边缘焦点
              </span>
              <span className="font-mono text-slate-300">
                Z = {aberrationData.marginalFocalPoint.z.toFixed(2)}mm
              </span>
            </div>
          )}
          {aberrationData.redFocalPoint && (
            <div className="flex items-center justify-between">
              <span className="text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                红光焦点
              </span>
              <span className="font-mono text-slate-300">
                Z = {aberrationData.redFocalPoint.z.toFixed(2)}mm
              </span>
            </div>
          )}
          {aberrationData.blueFocalPoint && (
            <div className="flex items-center justify-between">
              <span className="text-blue-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                蓝光焦点
              </span>
              <span className="font-mono text-slate-300">
                Z = {aberrationData.blueFocalPoint.z.toFixed(2)}mm
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <h4 className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
          图例说明
        </h4>
        <div className="space-y-1 text-[10px] text-slate-500">
          <p>• <span className="text-yellow-400">●</span> 物点 - 光线发射源</p>
          <p>• <span className="text-cyan-400">━━</span> 光线路径 - 随波长变色</p>
          <p>• <span className="text-cyan-400">◎</span> 近轴焦点 - 小角度光线聚焦</p>
          <p>• <span className="text-red-400">◎</span> 边缘焦点 - 大角度光线聚焦</p>
          <p>• <span className="text-red-400">✦</span> 全反射点 - 光线逃逸位置</p>
        </div>
      </div>
    </div>
  );
};

interface AberrationCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  color: string;
  description: string;
}

const AberrationCard = ({ icon: Icon, label, value, unit, color, description }: AberrationCardProps) => {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    yellow: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    red: 'text-red-400 border-red-500/30 bg-red-500/10'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color] || colorClasses.cyan}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] opacity-80">{label}</span>
      </div>
      <div className="font-mono text-lg">
        {value}
        <span className="text-xs opacity-60 ml-1">{unit}</span>
      </div>
      <div className="text-[9px] opacity-50 mt-1">{description}</div>
    </div>
  );
};
