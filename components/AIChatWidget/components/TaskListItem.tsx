import React from 'react';

// 任务列表项组件
const TaskListItem: React.FC<{ children: React.ReactNode; checked?: boolean }> = ({ children, checked }) => (
  <li style={{ margin: '6px 0', listStyle: 'none', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
    <input
      type="checkbox"
      checked={checked}
      readOnly
      style={{ marginTop: '4px', accentColor: '#FF6B6B' }}
    />
    <span style={{ textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.6 : 1 }}>{children}</span>
  </li>
);

export default TaskListItem;
