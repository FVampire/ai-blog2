'use client';

import React, { useEffect, useState } from 'react';

import { DEFAULT_SKILLS, type SkillItem } from '../lib/skills';

const SkillsList: React.FC = () => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSkills(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch skills:', err);
        setSkills(DEFAULT_SKILLS);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="section-title">Skills</h2>
        <p style={{ color: '#6C757D', textAlign: 'center', fontSize: '14px' }}>加载中...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="card">
        <h2 className="section-title">Skills</h2>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
          <li>No skills available.</li>
        </ul>
      </div>
    );
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="card">
      <h2 className="section-title">Skills</h2>
      <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#495057', lineHeight: '1.8' }}>
        {Object.entries(groupedSkills).map(([category, names]) => (
          <li key={category} style={{ marginBottom: '10px' }}>
            {category}: {names.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SkillsList;
