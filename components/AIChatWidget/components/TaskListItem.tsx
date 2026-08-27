import React from 'react';

const TaskListItem: React.FC<{ children: React.ReactNode; checked?: boolean }> = ({ children, checked }) => (
  <li className={`ai-task-item ${checked ? 'checked' : ''}`}>
    <input type="checkbox" checked={!!checked} readOnly />
    <span>{children}</span>
  </li>
);

export default TaskListItem;
