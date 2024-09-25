import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ReactDOM from 'react-dom';

const Modal = ({ children, onClose, modalRef }) => {
  return ReactDOM.createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={modalBackdropStyle}
    >
      <div
        className="modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={modalContentStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// 모달의 스타일
const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90vw',
  zIndex: 1001,
};

const Card = ({ user, toggleFavorite, updateUser, deleteUser }) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender);
  const [editedAge, setEditedAge] = useState(user.age);
  const [editedProfileImage, setEditedProfileImage] = useState(user.profileImage);

  const menuRef = useRef(null);
  const modalRef = useRef(null);

  // 사용자 데이터에서 목표를 가져오거나 기본값 설정
  const {
    stepsGoal = 10000,
    caloriesGoal = 2000,
    distanceGoal = 5,
  } = user.goals || {};

  // 목표 설정 모달에서 사용할 임시 상태
  const [tempStepsGoal, setTempStepsGoal] = useState(stepsGoal);
  const [tempCaloriesGoal, setTempCaloriesGoal] = useState(caloriesGoal);
  const [tempDistanceGoal, setTempDistanceGoal] = useState(distanceGoal);

  // 사용자 데이터에서 가져오기, 기본값 설정
  const {
    bpm = 0,
    oxygen = 0,
    stress = 0,
    sleep = 0,
    steps = 0,
    calories = 0,
    distance = 0,
  } = user.data || {};

  // 목표 달성율 계산
  const safeDivide = (numerator, denominator) =>
    denominator === 0 ? 0 : (numerator / denominator) * 100;

  const stepsPercentage = Math.min(safeDivide(steps, stepsGoal), 100);
  const caloriesPercentage = Math.min(safeDivide(calories, caloriesGoal), 100);
  const distancePercentage = Math.min(safeDivide(distance, distanceGoal), 100);

  const achievementPercentage = (stepsPercentage + caloriesPercentage + distancePercentage) / 3;

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

  const navigateToUserDetail = () => {
    if (!showGoalModal && !showEditModal && !showDeleteModal) {
      navigate(`/users/${user.id}`);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  // 목표 설정 모달 열기
  const openGoalModal = (e) => {
    e.stopPropagation();
    // 현재 목표를 임시 상태에 설정
    setTempStepsGoal(stepsGoal);
    setTempCaloriesGoal(caloriesGoal);
    setTempDistanceGoal(distanceGoal);
    setShowGoalModal(true);
    setMenuOpen(false);
  };

  // 목표 저장 함수
  const handleSaveGoals = () => {
    const updatedUser = {
      ...user,
      goals: {
        stepsGoal: tempStepsGoal,
        caloriesGoal: tempCaloriesGoal,
        distanceGoal: tempDistanceGoal,
      },
    };

    // 목표 달성율 재계산
    const newStepsPercentage = safeDivide(steps, tempStepsGoal);
    const newCaloriesPercentage = safeDivide(calories, tempCaloriesGoal);
    const newDistancePercentage = safeDivide(distance, tempDistanceGoal);
    const achievementPercentage =
      (newStepsPercentage + newCaloriesPercentage + newDistancePercentage) / 3;

    updatedUser.achievementPercentage = achievementPercentage;

    updateUser(updatedUser);
    setShowGoalModal(false);
  };

  // 바깥 클릭 시 메뉴 닫기 및 페이지 이동 막기
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 메뉴 바깥을 클릭하면 메뉴 닫기
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      // 모달이 열려 있을 때, 모달 외부를 클릭해도 navigate가 호출되지 않도록 함
      if (showEditModal || showGoalModal || showDeleteModal) {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          event.stopPropagation();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, modalRef, showEditModal, showGoalModal, showDeleteModal]);

  // 수정 모달 열기 함수 정의
  const openEditModal = (e) => {
    e.stopPropagation();
    setEditedName(user.name);
    setEditedGender(user.gender);
    setEditedAge(user.age);
    setEditedProfileImage(user.profileImage);
    setShowEditModal(true);
    setMenuOpen(false); // 메뉴 닫기
  };

  // 삭제 확인 모달 열기 함수 정의
  const openDeleteModal = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setMenuOpen(false); // 메뉴 닫기
  };

  // 삭제 확인 모달에서 '확인' 버튼 클릭 시 호출될 함수
  const handleConfirmDelete = () => {
    deleteUser(user.id); // 현재는 상태에서 사용자 제거
    setShowDeleteModal(false); // 모달 닫기
  };

  // 삭제 확인 모달에서 '취소' 버튼 클릭 시 호출될 함수
  const handleCancelDelete = () => {
    setShowDeleteModal(false); // 모달 닫기
  };

  // 수정된 사용자 정보 저장 함수 정의
  const handleSaveUserInfo = () => {
    const updatedUser = {
      ...user,
      name: editedName,
      gender: editedGender,
      age: editedAge,
      profileImage: editedProfileImage,
    };

    updateUser(updatedUser); // 부모 컴포넌트의 상태 업데이트
    setShowEditModal(false); // 모달 닫기
  };

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
          <span style={{ fontSize: '38px' }}>⋮</span>
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
            { label: '칼로리', value: `${calories} Kcal`, color: 'text-purple-500' },
            { label: '이동거리', value: `${distance} Km`, color: 'text-green-500' },
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

      {/* 목표 설정 모달 */}
      {showGoalModal && (
        <Modal onClose={() => setShowGoalModal(false)} modalRef={modalRef}>
          <h2 className="text-xl font-semibold mb-4">목표 설정</h2>
          {/* 목표 설정 모달 내용 */}
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
              칼로리 목표
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

      {/* 사용자 정보 수정 모달 */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} modalRef={modalRef}>
          <h2 className="text-xl font-semibold mb-4">사용자 정보 수정</h2>

          {/* 프로필 이미지 변경 */}
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
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditedProfileImage(reader.result);
                  };
                  reader.readAsDataURL(file);
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

          {/* 이름 수정 */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">이름</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 성별 수정 */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">성별</label>
            <select
              value={editedGender}
              onChange={(e) => setEditedGender(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="남성">남성</option>
              <option value="여성">여성</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 나이 수정 */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">나이</label>
            <input
              type="number"
              value={editedAge}
              onChange={(e) => setEditedAge(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 저장 버튼 */}
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

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)} modalRef={modalRef}>
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
