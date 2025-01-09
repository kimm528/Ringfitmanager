import React from 'react';

const AssignUsers = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>사용자 할당 페이지</h2>
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p>여기는 AssignUsers 컴포넌트입니다.</p>
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          테스트 버튼
        </button>
      </div>
    </div>
  );
};

export default AssignUsers;
