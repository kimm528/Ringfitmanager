import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaEllipsisV } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Modal from './Modal';

const Card = ({ user, toggleFavorite, updateUser, deleteUser, availableRings }) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRingModal, setShowRingModal] = useState(false); // 링 관리 모달 상태 추가

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

  // 수면 점수 계산 함수
  const calculateSleepScore = useCallback(
    (totalSleepDuration, deepSleepDuration, awakeDuration, shallowSleepDuration) => {
      if (
        totalSleepDuration !== 0 &&
        deepSleepDuration !== 0 &&
        awakeDuration !== 0 &&
        shallowSleepDuration !== 0
      ) {
        const totalSleepScore = (totalSleepDuration / 480.0) * 50;
        const deepSleepScore = (deepSleepDuration / totalSleepDuration) * 30;
        const awakePenalty = (awakeDuration / totalSleepDuration) * -20;
        const shallowSleepPenalty = (shallowSleepDuration / totalSleepDuration) * -10;

        let sleepScore = totalSleepScore + deepSleepScore + awakePenalty + shallowSleepPenalty;

        sleepScore = Math.max(0, Math.min(100, sleepScore));

        return Math.round(sleepScore);
      } else {
        return 0;
      }
    },
    []
  );

  // Get Last Non-Zero Value
  const getLastNonZero = useCallback((arr) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== 0) {
        return arr[i];
      }
    }
    return 0;
  }, []);

  // Process Ring Data
  useEffect(() => {
    if (user.ring) {
      const {
        HeartRateArr = [],
        MinBloodOxygenArr = [],
        MaxBloodOxygenArr = [],
        Sport = {},
        PressureArr = [],
        Sleep = {},
      } = user.ring;
      const latestHeartRate = getLastNonZero(HeartRateArr);
      const latestMinOxygen = getLastNonZero(MinBloodOxygenArr);
      const latestMaxOxygen = getLastNonZero(MaxBloodOxygenArr);
      const avgOxygen = ((latestMinOxygen + latestMaxOxygen) / 2).toFixed(2);
      const latestStress = getLastNonZero(PressureArr);

      const { TotalStepsArr = [], CalorieArr = [], WalkDistanceArr = [] } = Sport;
      const latestSteps = getLastNonZero(TotalStepsArr);
      const latestCalories = getLastNonZero(CalorieArr);
      const latestDistance = getLastNonZero(WalkDistanceArr) / 1000; // km 단위로 변환

      // 수면 데이터 추출 및 단위 변환 (필요한 경우)
      const {
        TotalSleepDuration = 0,
        DeepSleepDuration = 0,
        ShallowSleepDuration = 0,
        AwakeDuration = 0,
      } = Sleep;

      // 수면 시간이 초 단위라면 분 단위로 변환
      const totalSleepMinutes = TotalSleepDuration / 60;
      const deepSleepMinutes = DeepSleepDuration / 60;
      const shallowSleepMinutes = ShallowSleepDuration / 60;
      const awakeMinutes = AwakeDuration / 60;

      // 수면 점수 계산
      const sleepScore = calculateSleepScore(
        totalSleepMinutes,
        deepSleepMinutes,
        awakeMinutes,
        shallowSleepMinutes
      );

      setProcessedData({
        bpm: latestHeartRate || 0,
        oxygen: avgOxygen || 0,
        stress: latestStress || 0,
        sleep: sleepScore || 0,
        steps: latestSteps || 0,
        calories: latestCalories || 0,
        distance: latestDistance || 0,
      });

      // 사용자 데이터 업데이트 (필요한 경우)
      const shouldUpdateUser =
        latestHeartRate !== user.data?.bpm ||
        avgOxygen !== user.data?.oxygen ||
        latestSteps !== user.data?.steps ||
        latestCalories !== user.data?.calories ||
        latestDistance !== user.data?.distance ||
        latestStress !== user.data?.stress ||
        sleepScore !== user.data?.sleep;

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
            stress: latestStress,
            sleep: sleepScore,
          },
        };
        updateUser(updatedUser, false);
      }
    } else {
      // 링 데이터가 없을 경우 기본값 사용
      setProcessedData({
        bpm: user.data?.bpm || 0,
        oxygen: user.data?.oxygen || 0,
        stress: user.data?.stress || 0,
        sleep: user.data?.sleep || 0,
        steps: user.data?.steps || 0,
        calories: user.data?.calories || 0,
        distance: user.data?.distance || 0,
      });
    }
  }, [user, getLastNonZero, updateUser, calculateSleepScore]);

  // Extract Variables from Processed Data
  const { bpm, oxygen, stress, sleep, steps, calories, distance } = processedData;

  // Open Goal Modal
  const openGoalModal = useCallback(
    (e) => {
      e.stopPropagation(); // 이벤트 전파 중단
      setShowGoalModal(true);
      setMenuOpen(false);
    },
    []
  );

  // Open Ring Management Modal
  const openRingModal = useCallback(
    (e) => {
      e.stopPropagation();
      setShowRingModal(true);
      setMenuOpen(false);
    },
    []
  );

  const navigateToUserDetail = useCallback(() => {
    if (!showGoalModal && !showEditModal && !showDeleteModal && !showRingModal) {
      navigate(`/users/${user.id}`);
    }
  }, [navigate, user.id, showGoalModal, showEditModal, showDeleteModal, showRingModal]);

  const toggleMenu = useCallback(
    (e) => {
      e.stopPropagation();
      setMenuOpen((prev) => !prev);
    },
    []
  );

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
      // 필요한 다른 필드들도 포함
      name: user.name,
      gender: user.gender,
      age: user.age,
      profileImage: user.profileImage,
      address: user.address,
      macAddr: user.macAddr,
      albumPath: user.albumPath,
      lifeLogs: user.lifeLogs,
    };
    console.log('Updated Goals:', updatedUser);
    updateUser(updatedUser, true); // 서버로 요청 보내기 위해 sendToServer를 true로 설정
    setShowGoalModal(false);
  }, [user, tempStepsGoal, tempCaloriesGoal, tempDistanceGoal, updateUser]);
  
  // Click Outside to Close Menu or Prevent Navigation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (showEditModal || showGoalModal || showDeleteModal || showRingModal) {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          event.stopPropagation();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditModal, showGoalModal, showDeleteModal, showRingModal]);

  // Reset Edited Fields when User Changes
  useEffect(() => {
    setEditedName(user.name);
    setEditedGender(user.gender);
    setEditedAge(user.age);
    setEditedProfileImage(user.profileImage);
  }, [user]);

  // Open Edit Modal
  const openEditModal = useCallback(
    (e) => {
      e.stopPropagation();
      setShowEditModal(true);
      setMenuOpen(false);
    },
    []
  );

  // Delete Modal Handlers
  const openDeleteModal = useCallback(
    (e) => {
      e.stopPropagation();
      setShowDeleteModal(true);
      setMenuOpen(false);
    },
    []
  );

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
      address: user.address,
      stepTarget: user.stepTarget,
      kcalTarget: user.kcalTarget,
      kmTarget: user.kmTarget,
      macAddr: user.macAddr,
      albumPath: user.albumPath,
      lifeLogs: user.lifeLogs,
    };
    console.log('Updated User Info:', updatedUser);
    updateUser(updatedUser, true); // 서버로 요청 보내기 위해 sendToServer를 true로 설정
    setShowEditModal(false);
  }, [user, editedName, editedGender, editedAge, editedProfileImage, updateUser]);

  // Calculate Achievement Percentage
  const safeDivide = useCallback(
    (numerator, denominator) => (denominator === 0 ? 0 : (numerator / denominator) * 100),
    []
  );

  const stepsPercentage = Math.min(safeDivide(steps, user.stepTarget || 10000), 100);
  const caloriesPercentage = Math.min(
    safeDivide(calories / 1000, user.kcalTarget || 2000),
    100
  );
  const distancePercentage = Math.min(safeDivide(distance, user.kmTarget || 5), 100);

  const achievementPercentage = (stepsPercentage + caloriesPercentage + distancePercentage) / 3;

  // Render Progress Bar
  const renderProgressBar = useCallback(
    (value, color, trailColor, size) => (
      <CircularProgressbar
        value={value}
        strokeWidth={10}
        styles={buildStyles({
          pathColor: color,
          trailColor: trailColor,
        })}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    ),
    []
  );

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
            className={`mr-1 ${user.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
            size={20}
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
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openRingModal}
            >
              링 관리
            </button>
            <button
              className="block px-4 py-2 text-red-600 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openDeleteModal}
            >
              삭제
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
  {user.name} ({user.gender === 0 ? '남성' : '여성'}, {user.age})
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
            {
              label: '칼로리',
              value: `${(calories / 1000).toFixed(2)} kcal`,
              color: 'text-orange-500',
            },
            {
              label: '이동거리',
              value: `${distance.toFixed(2)} km`,
              color: 'text-green-500',
            },
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
          <>
            <span className="text-green-500 font-semibold">링 연결됨</span>
            <span className="text-gray-700 font-medium">
              배터리: {user.ring.BatteryLevel}%
            </span>
          </>
        ) : (
          <span className="text-red-500 font-semibold">링 미연결</span>
        )}
      </div>

       {/* Ring Management Modal */}
       {showRingModal && (
        <Modal onClose={() => setShowRingModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">링 관리</h2>
          {user.ring ? (
            <div className="mb-4">
              <p>현재 연결된 링: {user.ring.Name || 'Unknown Ring'}</p>
              <button
                onClick={() => {
                  // 링 연결 해제
                  const updatedUser = {
                    ...user,
                    ring: null,
                    macAddr: '', // macAddr를 빈 문자열로 설정
                    // 필요한 다른 필드들도 포함
                    name: user.name,
                    gender: user.gender,
                    age: user.age,
                    profileImage: user.profileImage,
                    address: user.address,
                    stepTarget: user.stepTarget,
                    kcalTarget: user.kcalTarget,
                    kmTarget: user.kmTarget,
                    albumPath: user.albumPath,
                    lifeLogs: user.lifeLogs,
                  };
                  updateUser(updatedUser, true); // 서버로 전송
                  setShowRingModal(false);
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <p>현재 연결된 링이 없습니다.</p>
          )}

<div className="mt-4">
            <h3 className="text-lg font-medium mb-2">링 목록</h3>
            <ul>
              {availableRings.length > 0 ? (
                availableRings.map((ring) => (
                  <li key={ring.MacAddr} className="flex justify-between items-center mb-2">
                    <span>{ring.Name}</span>
                    <button
                      onClick={() => {
                        // 링 연결
                        const updatedUser = {
                          ...user,
                          ring: ring,
                          macAddr: ring.MacAddr, // 선택한 링의 MacAddr로 설정
                          // 필요한 다른 필드들도 포함
                          name: user.name,
                          gender: user.gender,
                          age: user.age,
                          profileImage: user.profileImage,
                          address: user.address,
                          stepTarget: user.stepTarget,
                          kcalTarget: user.kcalTarget,
                          kmTarget: user.kmTarget,
                          albumPath: user.albumPath,
                          lifeLogs: user.lifeLogs,
                        };
                        updateUser(updatedUser, true); // 서버로 전송
                        setShowRingModal(false);
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded-md"
                    >
                      연결
                    </button>
                  </li>
                ))
              ) : (
                <p>사용 가능한 링이 없습니다.</p>
              )}
            </ul>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowRingModal(false)}
              className="px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              닫기
            </button>
          </div>
        </Modal>
      )}

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
              onChange={(e) => setEditedGender(Number(e.target.value))}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>남성</option>
              <option value={1}>여성</option>
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
    </div>
  );
};

export default Card;
