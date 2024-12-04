import React from 'react';

const BarCellRenderer = ({ value, max, thresholds, showValue, riskLevel, type }) => {
  const { low, high } = thresholds;
  let backgroundColor = '#9DE008';

  if(type == 'heartRate')
  {
    if(riskLevel == 'High')
        {
           backgroundColor = '#FE6E42';
        }
        else if(riskLevel == 'Low')
        {
           backgroundColor = '#FFCC01';
        }
  }
  else if(type == 'oxygenSaturation')
  {
    if (value < low) {
        backgroundColor = '#FE6E42';
        } else if (value >= low && value <= high) {
        backgroundColor = '#FFCC01';
        }
  }
  else if(type == 'stressLevel')
  {
    if (value >= low && value <= high) {
        backgroundColor = '#FFCC01';
        } else if (value > high) {
        backgroundColor = '#FE6E42';
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