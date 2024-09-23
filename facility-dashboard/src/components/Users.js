import React from 'react';
import { useNavigate } from 'react-router-dom';

const Users = ({ users }) => {
  const navigate = useNavigate();

  // 유저 클릭 시 해당 유저의 상세 페이지로 이동
  const handleCardClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div 
            key={user.id}
            className="card p-4 rounded-lg shadow-md bg-white cursor-pointer"
            onClick={() => handleCardClick(user.id)} // 카드 클릭 시 handleCardClick 호출
          >
            <img src={user.profileImage} alt="Profile" className="w-16 h-16 rounded-full mb-4" />
            <h2 className="font-bold text-lg">{user.name}</h2>
            <p>{user.gender}, {user.age}세</p>
            <p>{user.steps} 걸음</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
