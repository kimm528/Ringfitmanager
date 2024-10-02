// Card.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaEllipsisV } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Modal from './Modal';

const Card = ({ user, toggleFavorite, updateUser, deleteUser, availableRings, assignRingToUser }) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignRingModal, setShowAssignRingModal] = useState(false);

  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender);
  const [editedAge, setEditedAge] = useState(user.age);
  const [editedProfileImage, setEditedProfileImage] = useState(user.profileImage);

  const [processedData, setProcessedData] = useState({
    bpm: 0,
    oxygen: 0,
    stress: 0,
    sleep: 0,
    steps: 0,
    calories: 0,
    distance: 0,
  });

  const menuRef = useRef(null);
  const modalRef = useRef(null);

  // Open Goal Modal with event propagation stopped
  const openGoalModal = useCallback((e) => {
    e.stopPropagation(); // 이벤트 전파 중단
    setShowGoalModal(true);
    setMenuOpen(false);
  }, []);

  // Decode Heart Rate Array
  const decodeHeartRate = useCallback((base64Str) => {
    try {
      const binaryStr = atob(base64Str);
      const heartRates = [];
      for (let i = 0; i < binaryStr.length; i++) {
        heartRates.push(binaryStr.charCodeAt(i));
      }
      return heartRates;
    } catch (error) {
      console.error('Failed to decode heart rate array:', error);
      return [];
    }
  }, []);

  // Get Last Non-Zero Value
  const getLastNonZero = useCallback((arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== 0) {
        return arr[i];
      }
    }
    return 0;
  }, []);

  // Calculate Average
  const calculateAverage = useCallback((arr) => {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return (sum / arr.length).toFixed(2);
  }, []);

  // Process Ring Data and Assign Automatically
  useEffect(() => {
    let intervalId;

    const processRingData = () => {
      if (user.ring) {
        const latestHeartRate = getLastNonZero(user.ring.HeartRateArr);
        const latestMinOxygen = getLastNonZero(user.ring.MinBloodOxygenArr);
        const latestMaxOxygen = getLastNonZero(user.ring.MaxBloodOxygenArr);
        const avgOxygen = ((latestMinOxygen + latestMaxOxygen) / 2).toFixed(2);
        const { Sport } = user.ring;
        const latestSteps = getLastNonZero(Sport.TotalStepsArr);
        const latestCalories = getLastNonZero(Sport.CalorieArr);
        const latestDistance = getLastNonZero(Sport.WalkDistanceArr) / 1000; // km 단위로 변환

        setProcessedData({
          bpm: latestHeartRate,
          oxygen: avgOxygen,
          stress: user.data?.stress || 0,
          sleep: user.data?.sleep || 0,
          steps: latestSteps,
          calories: latestCalories,
          distance: latestDistance,
        });

        const shouldUpdateUser =
          latestHeartRate !== user.data?.bpm ||
          avgOxygen !== user.data?.oxygen ||
          latestSteps !== user.data?.steps ||
          latestCalories !== user.data?.calories ||
          latestDistance !== user.data?.distance;

        if (shouldUpdateUser) {
          const updatedUser = {
            ...user,
            data: {
              ...(user.data || {}),
              bpm: Number(latestHeartRate),
              oxygen: Number(avgOxygen),
              steps: latestSteps,
              calories: latestCalories,
              distance: latestDistance,
            },
          };
          updateUser(updatedUser);
        }
      } else {
        const assignedRing = availableRings.find(
          (ring) => ring.MacAddr === user.macAddr
        );

        if (assignedRing) {
          assignRingToUser(user.id, assignedRing);
        }

        setProcessedData({
          bpm: Number(user.data?.bpm) || 0,
          oxygen: Number(user.data?.oxygen?.toFixed(1)) || 0,
          stress: Number(user.data?.stress) || 0,
          sleep: Number(user.data?.sleep) || 0,
          steps: Number(user.data?.steps) || 0,
          calories: Number(user.data?.calories) || 0,
          distance: Number(user.data?.distance) || 0,
        });
      }
    };

    processRingData();
    intervalId = setInterval(processRingData, 10000); // Every 10 seconds

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, availableRings, updateUser, assignRingToUser, getLastNonZero]);

  // Extract Variables from Processed Data
  const { bpm, oxygen, stress, sleep, steps, calories, distance } = processedData;

  const navigateToUserDetail = useCallback(() => {
    if (!showGoalModal && !showEditModal && !showDeleteModal && !showAssignRingModal) {
      navigate(`/users/${user.id}`);
    }
  }, [navigate, user, showGoalModal, showEditModal, showDeleteModal, showAssignRingModal]);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  // Goal Modal Handlers
  const [tempStepsGoal, setTempStepsGoal] = useState(user.stepTarget || 10000);
  const [tempCaloriesGoal, setTempCaloriesGoal] = useState(user.kcalTarget || 2000);
  const [tempDistanceGoal, setTempDistanceGoal] = useState(user.kmTarget || 5);

  const handleSaveGoals = useCallback(() => {
    const updatedUser = {
      ...user,
      stepTarget: tempStepsGoal,
      kcalTarget: tempCaloriesGoal,
      kmTarget: tempDistanceGoal,
    };
    console.log('Updated Goals:', updatedUser);
    updateUser(updatedUser);
    setShowGoalModal(false);
  }, [user, tempStepsGoal, tempCaloriesGoal, tempDistanceGoal, updateUser]);

  // Click Outside to Close Menu or Prevent Navigation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (showEditModal || showGoalModal || showDeleteModal || showAssignRingModal) {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          event.stopPropagation();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditModal, showGoalModal, showDeleteModal, showAssignRingModal]);

  // Reset Edited Fields when User Changes
  useEffect(() => {
    setEditedName(user.name);
    setEditedGender(user.gender);
    setEditedAge(user.age);
    setEditedProfileImage(user.profileImage);
  }, [user]);

  // Open Edit Modal
  const openEditModal = useCallback((e) => {
    e.stopPropagation();
    setShowEditModal(true);
    setMenuOpen(false);
  }, []);

  // Delete Modal Handlers
  const openDeleteModal = useCallback((e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setMenuOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deleteUser(user.id);
    setShowDeleteModal(false);
  }, [deleteUser, user.id]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Save Edited User Info
  const handleSaveUserInfo = useCallback(() => {
    const updatedUser = {
      ...user,
      name: editedName,
      gender: editedGender,
      age: editedAge,
      profileImage: editedProfileImage,
    };
    console.log('Updated User Info:', updatedUser);
    updateUser(updatedUser);
    setShowEditModal(false);
  }, [user, editedName, editedGender, editedAge, editedProfileImage, updateUser]);

  // Assign Ring Modal Handlers
  const openAssignRingModal = useCallback((e) => {
    e.stopPropagation();
    setShowAssignRingModal(true);
    setMenuOpen(false);
  }, []);

  const closeAssignRingModal = useCallback(() => {
    setShowAssignRingModal(false);
  }, []);

  const handleAssignRing = useCallback((ring) => {
    assignRingToUser(user.id, ring);
    closeAssignRingModal();
  }, [assignRingToUser, user.id, closeAssignRingModal]);

  // Get Available Rings excluding the current one
  const getAvailableRings = useCallback(() => {
    return availableRings.filter(ring => ring.MacAddr !== user.macAddr);
  }, [availableRings, user.macAddr]);

  // Calculate Achievement Percentage
  const safeDivide = useCallback((numerator, denominator) =>
    denominator === 0 ? 0 : (numerator / denominator) * 100, []
  );

  const stepsPercentage = Math.min(safeDivide(steps, user.stepTarget || 10000), 100);
  const caloriesPercentage = Math.min(safeDivide(calories / 1000, user.kcalTarget || 2000), 100);
  const distancePercentage = Math.min(safeDivide(distance / 1000, user.kmTarget || 5), 100);

  const achievementPercentage = (stepsPercentage + caloriesPercentage + distancePercentage) / 3;

  // Render Progress Bar
  const renderProgressBar = useCallback((value, color, trailColor, size) => (
    <CircularProgressbar
      value={value}
      strokeWidth={10}
      styles={buildStyles({
        pathColor: color,
        trailColor: trailColor,
      })}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  ), []);

  return (
    <div
      className="card p-4 rounded-lg shadow-md bg-white relative cursor-pointer"
      style={{ width: '350px', margin: '10px', fontFamily: 'Nanum Gothic, sans-serif' }}
      onClick={navigateToUserDetail}
    >
      <div className="absolute top-2 right-2 flex items-center" ref={menuRef}>
        <button
          style={{
            padding: '5px',
            marginRight: '5px',
            borderRadius: '80%',
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(user.id);
          }}
        >
          <FaStar
            className={`mr-3 ${user.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
            size={25}
          />
        </button>
        <button onClick={toggleMenu}>
          <FaEllipsisV size={20} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 py-2 w-48 bg-white border rounded shadow-lg z-10">
            <button
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openGoalModal}
            >
              목표 설정
            </button>
            <button
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openEditModal}
            >
              수정
            </button>
            <button
              className="block px-4 py-2 text-red-600 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openDeleteModal}
            >
              삭제
            </button>
            <button
              className="block px-4 py-2 text-blue-600 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openAssignRingModal}
            >
              링 선택
            </button>
          </div>
        )}
      </div>

      <div className="card-header flex items-center mb-4">
        <img
          src={user.profileImage}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="ml-3">
          <h2 className="font-bold text-lg">
            {user.name} ({user.gender}, {user.age})
          </h2>
        </div>
      </div>

      <div className="card-body flex justify-between items-center">
        <div
          className="multi-circular-progress"
          style={{ width: '120px', height: '120px', position: 'relative' }}
        >
          {renderProgressBar(stepsPercentage, '#3b82f6', '#e0f2fe', 120)}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '80%',
            }}
          >
            {renderProgressBar(caloriesPercentage, '#a78bfa', '#ede9fe', 100)}
          </div>
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
            }}
          >
            {renderProgressBar(distancePercentage, '#34d399', '#d1fae5', 80)}
          </div>
          <div
            className="score-text"
            style={{
              position: 'absolute',
              top: '40%',
              left: '35%',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {achievementPercentage.toFixed(1)}%
          </div>
        </div>

        <div className="card-info text-right ml-4">
          {[
            { label: '걸음수', value: steps, color: 'text-blue-500' },
            { label: '칼로리', value: `${calories.toFixed(2) / 1000} kcal`, color: 'text-orange-500' }, // 이미 kcalTarget을 적용함
            { label: '이동거리', value: `${distance.toFixed(2)} km`, color: 'text-green-500' },
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
            <span role="img" aria-label={item.label}>
              {item.emoji}
            </span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Ring Connection Status */}
      <div className="ring-status mt-4 flex items-center justify-center gap-4">
        {user.ring ? (
          (() => {
            const now = new Date();
            const lastDataTime = new Date(user.ring.lastDataTime);
            const diffInMinutes = (now - lastDataTime) / (1000 * 60);

            if (diffInMinutes > 5) {
              return <span className="text-yellow-500 font-semibold">연결 해제</span>;
            } else {
              return (
                <>
                  <span className="text-green-500 font-semibold">링 연결됨</span>
                  <span className="text-gray-700 font-medium">배터리: {user.ring.BatteryLevel}%</span>
                </>
              );
            }
          })()
        ) : (
          <span className="text-red-500 font-semibold">링 미연결</span>
        )}
      </div>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <Modal onClose={() => setShowGoalModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">목표 설정</h2>
          <div className="my-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              걸음수 목표
            </label>
            <input
              type="number"
              value={tempStepsGoal}
              onChange={(e) => setTempStepsGoal(Number(e.target.value))}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="my-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              칼로리 목표 (kcal)
            </label>
            <input
              type="number"
              value={tempCaloriesGoal}
              onChange={(e) => setTempCaloriesGoal(Number(e.target.value))}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="my-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              이동 거리 목표 (km)
            </label>
            <input
              type="number"
              value={tempDistanceGoal}
              onChange={(e) => setTempDistanceGoal(Number(e.target.value))}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowGoalModal(false)}
              className="mr-4 px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              취소
            </button>
            <button
              onClick={handleSaveGoals}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              저장
            </button>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">사용자 정보 수정</h2>

          {/* Profile Image Change */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              프로필 이미지
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setEditedProfileImage(URL.createObjectURL(file));
                }
              }}
              className="block w-full text-sm text-gray-700"
            />
            {editedProfileImage && (
              <img
                src={editedProfileImage}
                alt="프로필 미리보기"
                className="mt-2 w-24 h-24 rounded-full object-cover"
              />
            )}
          </div>

          {/* Name Edit */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">이름</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Gender Edit */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">성별</label>
            <select
              value={editedGender}
              onChange={(e) => setEditedGender(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="남">남성</option>
              <option value="여">여성</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* Age Edit */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">나이</label>
            <input
              type="number"
              value={editedAge}
              onChange={(e) => setEditedAge(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowEditModal(false)}
              className="mr-4 px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              취소
            </button>
            <button
              onClick={handleSaveUserInfo}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              저장
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">삭제 하시겠습니까?</h2>
          <div className="flex justify-end">
            <button
              onClick={handleCancelDelete}
              className="mr-4 px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              취소
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              확인
            </button>
          </div>
        </Modal>
      )}

      {/* Assign Ring Modal */}
      {showAssignRingModal && (
        <Modal onClose={closeAssignRingModal} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">링 선택</h2>
          {getAvailableRings().length > 0 ? (
            <div className="ring-list overflow-y-auto" style={{ maxHeight: '300px' }}>
              <ul>
                {getAvailableRings().map((ring) => (
                  <li
                    key={ring.MacAddr}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => handleAssignRing(ring)}
                  >
                    <div>
                      <p><strong>{ring.Name}</strong></p>
                    </div>
                    <div>
                      <span className="text-green-500">할당</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>할당 가능한 링이 없습니다.</p>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={closeAssignRingModal}
              className="px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              닫기
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Card;
