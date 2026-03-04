import React from 'react';

const SkillsList: React.FC = () => {
  return (
    <div className="card">
      <h2 className="section-title">Skills</h2>
      <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
        <li style={{ marginBottom: '10px' }}>Frontend: React, Next.js, TypeScript, CSS</li>
        <li style={{ marginBottom: '10px' }}>Backend: Node.js, Express, Python</li>
        <li style={{ marginBottom: '10px' }}>Database: PostgreSQL, MongoDB</li>
        <li style={{ marginBottom: '10px' }}>Cloud: AWS, Docker, Kubernetes</li>
        <li>UI/UX Design</li>
      </ul>
    </div>
  );
};

export default SkillsList;
