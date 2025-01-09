// 변화량 표시 그래프 위

import React, { useRef, useState, useEffect } from 'react';

const BarCellRenderer = ({ value, thresholds, showValue, max, isOxygen, isHeartRate }) => {
  const cellRef = useRef(null);
  const [barWidth, setBarWidth] = useState(100);

  useEffect(() => {
    const updateBarWidth = () => {
      if (cellRef.current) {
        const cellWidth = cellRef.current.offsetWidth;
        const newBarWidth = cellWidth - 70;
        setBarWidth(Math.max(100, newBarWidth));
      }
    };

    updateBarWidth();
    window.addEventListener('resize', updateBarWidth);

    const observer = new ResizeObserver(updateBarWidth);
    if (cellRef.current) {
      observer.observe(cellRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateBarWidth);
      if (cellRef.current) {
        observer.unobserve(cellRef.current);
      }
    };
  }, []);

  let segments = [];

  if (isOxygen) {
    // 산소포화도일 경우
    if (value < 90) {
      segments.push({ percentage: (value / max) * 100, color: '#FE6E42' });
    } else {
      segments.push({ percentage: (value / max) * 100, color: '#9DE008' });
    }
  } else if (isHeartRate) {
    // 심박수는 danger 기준으로 체크 (미만/초과)
    if (value < thresholds.danger?.low || value > thresholds.danger?.high) {
      segments.push({ percentage: (value / max) * 100, color: '#FE6E42' });
    } else {
      segments.push({ percentage: (value / max) * 100, color: '#9DE008' });
    }
  } else {
    // 기존 로직 유지 (다른 지표들)
    if (value < thresholds.low) {
      segments.push({ percentage: (value / max) * 100, color: '#FE6E42' });
    } else if (value <= thresholds.high) {
      segments.push({ percentage: (value / max) * 100, color: '#9DE008' });
    } else {
      const normalPercentage = (thresholds.high / max) * 100;
      const excessPercentage = ((value - thresholds.high) / max) * 100;
      segments.push({ percentage: normalPercentage, color: '#9DE008' });
      segments.push({ percentage: excessPercentage, color: '#FE6E42' });
    }
  }

  // deviation 계산 로직
  const deviation = value === 0 ? null : (
    isOxygen 
      ? (value < 90 ? value - 90 : null)  // 산소포화도
      : (isHeartRate                       // 심박수는 danger 기준으로
          ? (value <= thresholds.danger?.low 
              ? value - (thresholds.danger.low + 1)  // 하한값+1 기준
              : value >= thresholds.danger?.high 
                ? value - (thresholds.danger.high - 1)  // 상한값-1 기준
                : null)
          : (value < thresholds.low        // 다른 지표들은 기존대로
              ? value - thresholds.low 
              : value > thresholds.high 
                ? value - thresholds.high 
                : null))
  );

  const getTriangle = () => {
    if (!deviation) return null;
    return deviation > 0 ? '▲' : '▼';
  };

  return (
    <div 
      ref={cellRef}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: '100%',
        width: '100%',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
        {deviation && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#FE6E42',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            {getTriangle()} {Math.abs(deviation).toFixed(1)}
          </div>
        )}
        
        <div
          style={{
            height: '10px',
            width: `${barWidth}px`,
            backgroundColor: '#e0e0e0',
            borderRadius: '2px',
            marginRight: '5px',
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {segments.map((segment, index) => (
            <div
              key={index}
              style={{
                height: '100%',
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              }}
            ></div>
          ))}
        </div>
        {showValue && (
          <div style={{ 
            fontSize: '16px', 
            whiteSpace: 'nowrap',
            minWidth: '50px',
            marginLeft: '5px',
          }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarCellRenderer;
