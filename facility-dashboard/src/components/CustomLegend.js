// src/components/CustomLegend.js
import React from 'react';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';

const CustomLegend = ({ legendItems }) => {
  const handleIconClick = (dataKey) => {
    const legendItem = legendItems.find(item => item.dataKey === dataKey);
    if (legendItem && legendItem.setShow) {
      legendItem.setShow(!legendItem.show);
    }
  };

  return (
    <div className="flex justify-center mb-4">
      {legendItems.map((item) => (
        <label 
          key={item.dataKey} 
          className="flex items-center mr-4 cursor-pointer"
          onClick={() => handleIconClick(item.dataKey)}
        >
          {item.show ? <FaCheckCircle size={20} color={item.color} /> : <FaRegCircle size={20} color={item.color} />}
          <span style={{ color: item.color }} className="ml-2">{item.value}</span>
        </label>
      ))}
    </div>
  );
};

export default CustomLegend;
