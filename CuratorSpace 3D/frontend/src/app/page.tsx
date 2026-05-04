'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryScene } from '@/components/three/GalleryScene';
import { useAppStore } from '@/store';
import type { Gallery } from '@/store/types';

export default function Home() {
  const {
    currentGalleryId,
    galleries,
    exhibits,
    layout,
    lights,
    tourPaths,
    presets,
    selectedItemId,
    isPlayingTour,
    activeAnimation,
    isLoading,
    error,
    loadGalleries,
    loadExhibits,
    loadPresets,
    loadPreset,
    setCurrentGallery,
    setSelectedItem,
    setPlayingTour,
    createVersion,
  } = useAppStore();

  const [showPresets, setShowPresets] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentGallery = galleries.find((g) => g.id === currentGalleryId);

  useEffect(() => {
    loadGalleries();
    loadExhibits();
    loadPresets();
  }, [loadGalleries, loadExhibits, loadPresets]);

  const handleLoadPreset = async (type: string) => {
    await loadPreset(type);
    setShowPresets(false);
  };

  const handleCreateVersion = async () => {
    if (!versionName.trim() || !currentGalleryId) return;
    await createVersion(versionName.trim(), '');
    setVersionName('');
    setShowVersions(false);
  };

  const presetGalleryFallback: Gallery = {
    id: 'default',
    name: '默认展厅',
    description: '等待加载中...',
    width: 20,
    depth: 20,
    height: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <main className="w-full h-full flex">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#16213e] to-[#1a1a2e] flex items-center justify-between px-6 z-50 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            🎨 CuratorSpace 3D
          </motion.div>
          
          {currentGallery && (
            <motion.div
              className="flex items-center gap-2 ml-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-gray-400">当前展厅:</span>
              <span className="text-white font-semibold">{currentGallery.name}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPresets(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            📦 加载预设
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVersions(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            📋 版本管理
          </motion.button>

          {currentGalleryId && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPlayingTour(!isPlayingTour)}
              className={`px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity ${
                isPlayingTour
                  ? 'bg-gradient-to-r from-[#FF4B1F] to-[#FF6B6B]'
                  : 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe]'
              }`}
            >
              {isPlayingTour ? '⏸ 停止导览' : '▶ 开始导览'}
            </motion.button>
          )}
        </div>
      </div>

      <div className="absolute top-16 left-0 bottom-0 w-64 bg-[#16213e] border-r border-gray-700 z-40 overflow-hidden">
        <div className="p-4 h-full overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-[#667eea]">展厅列表</h3>
            <div className="space-y-2">
              {galleries.length === 0 ? (
                <p className="text-gray-400 text-sm">暂无展厅，请加载预设</p>
              ) : (
                galleries.map((gallery) => (
                <motion.button
                  key={gallery.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setCurrentGallery(gallery.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    currentGalleryId === gallery.id
                      ? 'bg-[#667eea] text-white'
                      : 'bg-transparent text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{gallery.name}</div>
                  <div className="text-xs opacity-70">
                    {gallery.width}m × {gallery.depth}m × {gallery.height}m
                  </div>
                </motion.button>
              )))}
            </div>
          </div>

          {currentGalleryId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-[#764ba2]">展品列表</h3>
              <div className="space-y-2">
                {exhibits.length === 0 ? (
                  <p className="text-gray-400 text-sm">暂无展品</p>
                ) : (
                  exhibits.map((exhibit) => (
                    <motion.div
                      key={exhibit.id}
                      whileHover={{ x: 4 }}
                      className="px-3 py-2 bg-gray-800 rounded-lg cursor-grab"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('exhibitId', exhibit.id);
                      }}
                    >
                      <div className="font-medium text-sm">{exhibit.name}</div>
                      <div className="text-xs text-gray-400">
                        {exhibit.type === 'sculpture' && '🗿 雕塑'}
                        {exhibit.type === 'painting' && '🖼 画作'}
                        {exhibit.type === 'display_case' && '🏪 展柜'}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedItemId && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-[#f093fb]">选中展品</h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-gray-800 rounded-lg"
              >
                <p className="text-sm text-gray-300">已选中展品</p>
                <p className="text-xs text-gray-500 mt-1">ID: {selectedItemId}</p>
              </motion.div>
            </div>
          )}

          {activeAnimation !== 'none' && (
            <div className="fixed bottom-4 left-4 right-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-center"
              >
                <p className="text-sm font-medium">
                  {activeAnimation === 'drag' && '🎯 展品摆放动画中...'}
                  {activeAnimation === 'light' && '💡 灯光动画中...'}
                  {activeAnimation === 'flythrough' && '🚀 参观路线飞行动画中...'}
                  {activeAnimation === 'highlight' && '🔴 遮挡区域高亮中...'}
                  {activeAnimation === 'transition' && '✨ 展厅切换动画中...'}
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-16 left-64 right-0 bottom-0">
        {currentGallery ? (
          <GalleryScene
            gallery={currentGallery}
            layout={layout}
            lights={lights}
            tourPaths={tourPaths}
            exhibits={exhibits}
            activeAnimation={activeAnimation}
            isPlayingTour={isPlayingTour}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItem}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold mb-2">欢迎来到 CuratorSpace 3D</h2>
            <p className="text-gray-400 mb-6">点击上方"加载预设"按钮开始体验虚拟博物馆</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPresets(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white font-medium text-lg hover:opacity-90 transition-opacity"
            >
              📦 加载预设展厅
            </motion.button>
          </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPresets(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16213e] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                选择预设展厅
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLoadPreset(preset.type)}
                    className="p-4 bg-gray-800 rounded-lg text-left hover:bg-gray-700 transition-colors border border-gray-700"
                  >
                    <div className="text-lg font-semibold text-white mb-2">
                      {preset.type === 'modern' && '🎨 现代艺术展厅'}
                      {preset.type === 'ancient' && '🏛️ 古代文物展厅'}
                      {preset.type === 'overexposed' && '💡 灯光过曝展厅'}
                      {preset.type === 'obstructed' && '🚧 动线遮挡展厅'}
                    </div>
                    <div className="text-sm text-gray-400">{preset.description}</div>
                    <div className="mt-3 text-xs text-[#667eea]">点击加载 → 进入 3D 预览</div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPresets(false)}
                className="mt-6 w-full py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors"
              >
                取消
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVersions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowVersions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16213e] rounded-xl p-6 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-[#f093fb] to-[#f5576c] bg-clip-text text-transparent">
                版本管理
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  创建新版本
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="输入版本名称..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f093fb]"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateVersion}
                    disabled={!versionName.trim() || !currentGalleryId}
                    className="px-4 py-2 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    保存
                  </motion.button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVersions(false)}
                className="w-full py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors"
              >
                关闭
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg z-50"
        >
          {error}
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full"
          />
        </motion.div>
      )}
    </main>
  );
}
