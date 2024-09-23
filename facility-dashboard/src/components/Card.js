import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Card = ({ user, toggleFavorite }) => {
  const { bpm = 0, oxygen = 0, stress = 0, sleep = 0, steps = 0, calories = 0, distance = 0 } = user.data || {};

  const stepsPercentage = (steps / 10000) * 100;
  const caloriesPercentage = (calories / 2000) * 100;
  const distancePercentage = (distance / 5) * 100;

  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/users/${user.id}`);
  };

  const renderProgressBar = (value, color, trailColor, size) => (
    <CircularProgressbar
      value={value}
      strokeWidth={10}
      styles={buildStyles({
        pathColor: color,
        trailColor: trailColor,
      })}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );

  return (
    <div
      className="card p-4 rounded-lg shadow-md bg-white relative cursor-pointer"
      style={{ width: '350px', margin: '10px', fontFamily: 'Nanum Gothic, sans-serif' }}
      onClick={handleCardClick}
    >
      <div className="absolute top-2 right-2 flex items-center">
        <button onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(user.id);
        }}>
          <FaStar className={`mr-3 ${user.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`} size={25} />
        </button>
        <button onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '28px' }}>⋮</span>
        </button>
      </div>

      <div className="card-header flex items-center mb-4">
        <img src={user.profileImage} alt="Profile" className="w-12 h-12 rounded-full" />
        <div className="ml-3">
          <h2 className="font-bold text-lg">{user.name} ({user.gender}, {user.age})</h2>
        </div>
      </div>

      <div className="card-body flex justify-between items-center">
        <div className="multi-circular-progress" style={{ width: '120px', height: '120px', position: 'relative' }}>
          {renderProgressBar(stepsPercentage, '#3b82f6', '#e0f2fe', 120)}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%' }}>
            {renderProgressBar(caloriesPercentage, '#a78bfa', '#ede9fe', 100)}
          </div>
          <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%' }}>
            {renderProgressBar(distancePercentage, '#34d399', '#d1fae5', 80)}
          </div>
          <div className="score-text" style={{ position: 'absolute', top: '40%', left: '35%', fontSize: '14px', fontWeight: 'bold' }}>
            {stepsPercentage.toFixed(1)}%
          </div>
        </div>

        <div className="card-info text-right ml-4">
          {[
            { label: '걸음수', value: steps, color: 'text-blue-500' },
            { label: '칼로리', value: `${calories}Kcal`, color: 'text-purple-500' },
            { label: '이동거리', value: `${distance}Km`, color: 'text-green-500' },
          ].map((item, index) => (
            <div key={index} className="flex items-center mb-2 text-sm">
              <span className={item.color}>{item.label}</span>
              <span className="ml-2">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-footer mt-4 grid grid-cols-4 gap-2 text-center text-sm p-2 bg-gray-100 rounded-md">
        {[
          { emoji: '❤️', label: `${bpm} BPM` },
          { emoji: '💧', label: `${oxygen}%` },
          { emoji: '🛌', label: `${sleep}점` },
          { emoji: '😓', label: `${stress}점` },
        ].map((item, index) => (
          <div key={index}>
            <span role="img" aria-label={item.label}>{item.emoji}</span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;
