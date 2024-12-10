// src/components/BarCellRenderer.js

import React from 'react';

const BarCellRenderer = ({ value, max, thresholds, showValue, riskLevel, type }) => {
  const { low, high } = thresholds;
  let backgroundColor = '#9DE008'; // 기본 색상 (초록)

  if(type === 'heartRate') {
    if(riskLevel === 'High') {
      backgroundColor = '#FE6E42'; // 빨강
    }
    else if(riskLevel === 'Low') {
      backgroundColor = '#FFCC01'; // 노랑
    }
  }
  else if(type === 'oxygenSaturation') {
    if (value < low) {
      backgroundColor = '#FE6E42'; // 빨강
    } else if (value >= low && value <= high) {
      backgroundColor = '#FFCC01'; // 노랑
    }
  }
  else if(type === 'stressLevel') {
    if (value >= low && value <= high) {
      backgroundColor = '#FFCC01'; // 노랑
    } else if (value > high) {
      backgroundColor = '#FE6E42'; // 빨강
    }
  }
  else if(type === 'temperature') {
    if (value < low) {
      backgroundColor = '#FFCC01'; // 낮은 체온: 노랑
    } else if (value > high) {
      backgroundColor = '#FE6E42'; // 높은 체온: 빨강
    } else {
      backgroundColor = '#9DE008'; // 정상 체온: 초록
    }
  }

  const barWidth = Math.min((value / max) * 100, 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      {/* Bar */}
      <div
        style={{
          height: '10px',
          width: `${barWidth}%`,
          backgroundColor,
          borderRadius: '2px',
          marginRight: '5px',
        }}
      ></div>
      {/* Show value */}
      {showValue && <span style={{ fontSize: '16px' }}>{value}</span>}
    </div>
  );
};

export default BarCellRenderer;
