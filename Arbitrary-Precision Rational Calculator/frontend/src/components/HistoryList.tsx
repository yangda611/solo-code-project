import { component$ } from '@builder.io/qwik';
import type { HistoryRecord } from '../types';

interface HistoryListProps {
  history: HistoryRecord[];
}

export const HistoryList = component$<HistoryListProps>(({ history }) => {
  if (history.length === 0) {
    return (
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>暂无计算历史</p>
        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          开始计算后，结果将显示在这里
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="history-list">
      {history.map((record, index) => (
        <div 
          key={record.id} 
          class="history-item"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div class="input">
            {record.type === 'calculation' ? '🔢' : '➕'} {record.input}
          </div>
          <div class="result">{record.result}</div>
          <div class="time">{formatDate(record.createdAt)}</div>
        </div>
      ))}
    </div>
  );
});
