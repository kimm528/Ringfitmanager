import React from 'react';

const BarCellRenderer = ({ value, max, thresholds, showValue, riskLevel, type }) => {
  const { low, high } = thresholds;
  let backgroundColor = 'lightgray';

  if(type == 'heartRate')
  {
    if(riskLevel == 'High')
        {
           backgroundColor = 'red';
        }
        else if(riskLevel == 'Low')
        {
           backgroundColor = 'orange';
        }
  }
  else if(type == 'oxygenSaturation')
  {
    if (value < low) {
        backgroundColor = 'red';
        } else if (value >= low && value <= high) {
        backgroundColor = 'orange';
        }
  }
  else if(type == 'stressLevel')
  {
    if (value >= low && value <= high) {
        backgroundColor = 'orange';
        } else if (value > high) {
        backgroundColor = 'red';
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