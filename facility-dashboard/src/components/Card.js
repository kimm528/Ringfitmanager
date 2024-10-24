// Card.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaEllipsisV } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import Modal from './Modal';
import {
  MdDirectionsWalk,
  MdLocalFireDepartment,
  MdLocationOn,
  MdHotel,
} from 'react-icons/md';
import '../App.css'; // 경로 수정: '../App.css'로 변경
import ReactSlider from 'react-slider';
import { calculateUserStatus } from './calculateUserStatus'; // 함수 임포트

const Card = ({ user, toggleFavorite, updateUser, deleteUser, availableRings, users }) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRingModal, setShowRingModal] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender);
  const [editedAge, setEditedAge] = useState(user.age);

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

  // 산소포화도 임계값 상수로 정의
  const OXYGEN_WARNING_THRESHOLD = 95;
  const OXYGEN_DANGER_THRESHOLD = 90;

  // 위험/경고 수준 상태 추가 (심박수 임계값만 포함)
  const [thresholds, setThresholds] = useState({
    heartRateWarningLow: user.thresholds?.heartRateWarningLow || 80,
    heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 120,
    heartRateDangerLow: user.thresholds?.heartRateDangerLow || 70,
    heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 140,
  });

  // 수면 점수 계산 함수
  const calculateSleepScore = useCallback(
    (totalSleepDuration, deepSleepDuration, awakeDuration, shallowSleepDuration) => {
      if (totalSleepDuration === 0) {
        return 0;
      }

      // 각 기간이 0인 경우 기본값 설정
      deepSleepDuration = deepSleepDuration || 0;
      awakeDuration = awakeDuration || 0;
      shallowSleepDuration = shallowSleepDuration || 0;

      const totalSleepScore = (totalSleepDuration / 480.0) * 50;
      const deepSleepScore = (deepSleepDuration / totalSleepDuration) * 30;
      const awakePenalty = (awakeDuration / totalSleepDuration) * -20;
      const shallowSleepPenalty = (shallowSleepDuration / totalSleepDuration) * -10;

      let sleepScore = totalSleepScore + deepSleepScore + awakePenalty + shallowSleepPenalty;

      sleepScore = Math.max(0, Math.min(100, sleepScore));

      return Math.round(sleepScore);
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
      const avgOxygen = Math.round((latestMinOxygen + latestMaxOxygen) / 2); // 소수점 제거
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

  // 위험 수준에 따른 색상 설정 함수 (동적 임계값 사용)
  const getHeartRateColor = useCallback((value) => {
    if (value === 0) return '#cccccc'; // 값이 0이면 회색
    if (value >= thresholds.heartRateDangerHigh || value <= thresholds.heartRateDangerLow)
      return '#f44336'; // 위험 (빨간색)
    if (value >= thresholds.heartRateWarningHigh || value <= thresholds.heartRateWarningLow)
      return '#ff9800'; // 주의 (주황색)
    return '#4caf50'; // 정상 (초록색)
  }, [thresholds]);

  const getOxygenColor = useCallback((value) => {
    if (value === 0) return '#cccccc';
    if (value < OXYGEN_DANGER_THRESHOLD) return '#f44336'; // 위험
    if (value < OXYGEN_WARNING_THRESHOLD) return '#ff9800'; // 주의
    return '#4caf50'; // 정상
  }, []);

  const getStressColor = useCallback((value) => {
    if (value === 0) return '#cccccc';
    if (value >= 66) return '#f44336'; // 높음
    if (value >= 33) return '#ff9800'; // 보통
    return '#4caf50'; // 낮음
  }, []);

  const COLORS = useMemo(() => ({
    danger: '#f44336', // 빨간색
    warning: '#ff9800', // 주황색
    normal: '#4caf50', // 초록색
  }), []);

  // 심박수 구간 계산 함수 추가
  const calculateHeartRateSegments = useCallback((value) => {
    const segments = {
      dangerLow: 0,
      warningLow: 0,
      normal: 0,
      warningHigh: 0,
      dangerHigh: 0,
    };

    if (value <= thresholds.heartRateDangerLow) {
      segments.dangerLow = value;
    } else if (value <= thresholds.heartRateWarningLow) {
      segments.dangerLow = thresholds.heartRateDangerLow;
      segments.warningLow = value - thresholds.heartRateDangerLow;
    } else if (value <= thresholds.heartRateWarningHigh) {
      segments.dangerLow = thresholds.heartRateDangerLow;
      segments.warningLow = thresholds.heartRateWarningLow - thresholds.heartRateDangerLow;
      segments.normal = value - thresholds.heartRateWarningLow;
    } else if (value <= thresholds.heartRateDangerHigh) {
      segments.dangerLow = thresholds.heartRateDangerLow;
      segments.warningLow = thresholds.heartRateWarningLow - thresholds.heartRateDangerLow;
      segments.normal = thresholds.heartRateWarningHigh - thresholds.heartRateWarningLow;
      segments.warningHigh = value - thresholds.heartRateWarningHigh;
    } else {
      segments.dangerLow = thresholds.heartRateDangerLow;
      segments.warningLow = thresholds.heartRateWarningLow - thresholds.heartRateDangerLow;
      segments.normal = thresholds.heartRateWarningHigh - thresholds.heartRateWarningLow;
      segments.warningHigh = thresholds.heartRateDangerHigh - thresholds.heartRateWarningHigh;
      segments.dangerHigh = value - thresholds.heartRateDangerHigh;
    }

    return segments;
  }, [thresholds]);

  // 데이터 준비 (메모이제이션)
  const heartRateSegments = useMemo(() => calculateHeartRateSegments(bpm), [bpm, calculateHeartRateSegments]);

  const barChartData = useMemo(() => [
    {
      name: '심박수',
      dangerLow: heartRateSegments.dangerLow,
      warningLow: heartRateSegments.warningLow,
      normal: heartRateSegments.normal,
      warningHigh: heartRateSegments.warningHigh,
      dangerHigh: heartRateSegments.dangerHigh,
      bpmValue: bpm, // 심박수 값
      oxygenValue: 0,
      stressValue: 0,
    },
    {
      name: '산소포화도',
      dangerLow: 0,
      warningLow: 0,
      normal: 0,
      warningHigh: 0,
      dangerHigh: 0,
      bpmValue: 0,
      oxygenValue: oxygen,
      stressValue: 0,
    },
    {
      name: '스트레스',
      dangerLow: 0,
      warningLow: 0,
      normal: 0,
      warningHigh: 0,
      dangerHigh: 0,
      bpmValue: 0,
      oxygenValue: 0,
      stressValue: stress,
    },
  ], [heartRateSegments, bpm, oxygen, stress]);

  // 카드 상태 계산 (중복 제거)
  const status = useMemo(() => {
    return calculateUserStatus({
      ...user,
      data: { ...user.data, bpm: processedData.bpm, oxygen: processedData.oxygen },
      thresholds,
    });
  }, [user, processedData.bpm, processedData.oxygen, thresholds]);

  // Open Threshold Modal
  const openThresholdModal = useCallback(
    (e) => {
      e.stopPropagation(); // 이벤트 전파 중단
      setThresholds({
        heartRateWarningLow: user.thresholds?.heartRateWarningLow || 80,
        heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 120,
        heartRateDangerLow: user.thresholds?.heartRateDangerLow || 70,
        heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 140,
      });
      setShowThresholdModal(true);
      setMenuOpen(false);
    },
    [user]  
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
    if (!showThresholdModal && !showEditModal && !showDeleteModal && !showRingModal) {
      navigate(`/users/${user.id}`);
    }
  }, [navigate, user.id, showThresholdModal, showEditModal, showDeleteModal, showRingModal]);

  const toggleMenu = useCallback(
    (e) => {
      e.stopPropagation();
      setMenuOpen((prev) => !prev);
    },
    []
  );

  // Click Outside to Close Menu or Prevent Navigation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (
        (showEditModal || showThresholdModal || showDeleteModal || showRingModal) &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        event.stopPropagation();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuRef, modalRef, showEditModal, showThresholdModal, showDeleteModal, showRingModal]);

   // Open Edit Modal
  const openEditModal = useCallback(
    (e) => {
      e.stopPropagation();
      setEditedName(user.name);
      setEditedGender(user.gender);
      setEditedAge(user.age);
      setShowEditModal(true);
      setMenuOpen(false);
    },
    [user]
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
  }, [user, editedName, editedGender, editedAge, updateUser]);

  const renderCustomLabel = useCallback((props) => {
    const { x, y, width, value } = props;
    if (value !== 0 && value != null) {
      return (
        <text
          x={x + width / 2}
          y={y - 5}
          fill="#000"
          textAnchor="middle"
          fontSize={16}
          style={{ pointerEvents: 'none' }} // 마우스 이벤트 방지
        >
          {value}
        </text>
      );
    }
    return null;
  }, []);

  return (
    <div
      className={`card p-4 rounded-lg shadow-md bg-white relative cursor-pointer ${
        status === 'warning' ? 'border-4 border-yellow-500' : ''
      } ${
        status === 'danger' ? 'border-4 border-red-500 animate-blink' : ''
      }`}
      style={{ width: '350px', margin: '10px', fontFamily: 'Nanum Gothic, sans-serif', minHeight: '400px' }}
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
              onClick={openThresholdModal}
            >
              위험도 수정
            </button>
            <button
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openEditModal}
            >
              정보 수정
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

      <div className="card-header mb-4">
        <h2 className="font-bold text-lg">
          {user.name} ({user.gender === 0 ? '남성' : '여성'}, {user.age})
        </h2>
      </div>

      <div className="card-body">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={barChartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            barCategoryGap={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 200]} ticks={[0, 50, 100, 150, 200]} />

            {/* 심박수 */}
            <Bar dataKey="dangerLow" stackId="a" fill={COLORS.danger} isAnimationActive={false} />
            <Bar dataKey="warningLow" stackId="a" fill={COLORS.warning} isAnimationActive={false} />
            <Bar dataKey="normal" stackId="a" fill={COLORS.normal} isAnimationActive={false} />
            <Bar dataKey="warningHigh" stackId="a" fill={COLORS.warning} isAnimationActive={false} />
            <Bar dataKey="dangerHigh" stackId="a" fill={COLORS.danger} isAnimationActive={false}>
              <LabelList dataKey="bpmValue" content={renderCustomLabel} />
            </Bar>

            {/* 산소포화도 */}
            <Bar dataKey="oxygenValue" fill={getOxygenColor(oxygen)} stackId="a" isAnimationActive={false}>
              <LabelList dataKey="oxygenValue" content={renderCustomLabel} />
            </Bar>

            {/* 스트레스 */}
            <Bar dataKey="stressValue" fill={getStressColor(stress)} stackId="a" isAnimationActive={false}>
              <LabelList dataKey="stressValue" content={renderCustomLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
       
      {/* Footer with Steps, Calories, Distance, Sleep Score */}
      <div className="card-footer mt-4 grid grid-cols-4 gap-2 text-center text-sm p-2 bg-gray-100 rounded-md">
        {[
          {
            icon: <MdDirectionsWalk size={24} color="#3b82f6" />,
            label: '걸음수',
            value: steps,
          },
          {
            icon: <MdLocalFireDepartment size={24} color="#ff5722" />,
            label: '칼로리',
            value: `${(calories / 1000).toFixed(0)} kcal`,
          },
          {
            icon: <MdLocationOn size={24} color="#4caf50" />,
            label: '이동거리',
            value: `${distance.toFixed(2)} km`,
          },
          {
            icon: <MdHotel size={24} color="#9c27b0" />,
            label: '수면점수',
            value: `${sleep}점`,
          },
        ].map((item, index) => (
          <div key={index}>
            <div className="flex flex-col items-center">
              {item.icon}
              <p>{item.label}</p>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold Setting Modal */}
      {showThresholdModal && (
        <Modal onClose={() => setShowThresholdModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">위험도 수정</h2>
          <div className="mb-6">
            <h3 className="font-semibold mb-8">심박수 임계값</h3>
            
            {/* 다중 핸들 슬라이더 */}
            <div className="relative mb-6">
              <ReactSlider
                className="horizontal-slider"
                min={30}
                max={200}
                value={[
                  thresholds.heartRateDangerLow,
                  thresholds.heartRateWarningLow,
                  thresholds.heartRateWarningHigh,
                  thresholds.heartRateDangerHigh,
                ]}
                onChange={(values) => {
                  setThresholds({
                    ...thresholds,
                    heartRateDangerLow: values[0],
                    heartRateWarningLow: values[1],
                    heartRateWarningHigh: values[2],
                    heartRateDangerHigh: values[3],
                  });
                }}
                withTracks={true}
                pearling={true}
                minDistance={1}
                renderThumb={(props, state) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '25px',
                      width: '25px',
                      backgroundColor:
                        state.index === 0 || state.index === 3
                          ? '#f44336' // 위험 수준 핸들 - 빨간색
                          : '#ff9800', // 경고 수준 핸들 - 주황색
                      borderRadius: '50%',
                      cursor: 'pointer',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      position: 'absolute',
                    }}
                  >
                    {/* 핸들 레이블 추가 */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#000',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                    </span>
                  </div>
                )}
                renderTrack={(props, state) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '10px',
                      backgroundColor: (() => {
                        switch (state.index) {
                          case 0:
                            return '#f44336'; // 위험 구간 (하한선 이하) - 빨간색
                          case 1:
                            return '#ff9800'; // 경고 구간 (하한선과 상한선 사이) - 주황색
                          case 2:
                            return '#4caf50'; // 정상 구간 - 초록색
                          case 3:
                            return '#ff9800'; // 경고 구간 (상한선과 위험 상한선 사이) - 주황색
                          case 4:
                            return '#f44336'; // 위험 구간 (상한선 이상) - 빨간색
                          default:
                            return '#ddd'; // 기본 색상
                        }
                      })(),
                    }}
                  />
                )}
              />
            </div>
            {/* 현재 값 표시 영역 개선 */}
            <div className="grid grid-cols-4 gap-4 mt-6 text-sm">
              <div className="text-center">
                <div
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ backgroundColor: '#f44336' }}
                ></div>
                <p>위험 (하한)</p>
                <p>{thresholds.heartRateDangerLow} bpm</p>
              </div>
              <div className="text-center">
                <div
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ backgroundColor: '#ff9800' }}
                ></div>
                <p>경고 (하한)</p>
                <p>{thresholds.heartRateWarningLow} bpm</p>
              </div>
              <div className="text-center">
                <div
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ backgroundColor: '#ff9800' }}
                ></div>
                <p>경고 (상한)</p>
                <p>{thresholds.heartRateWarningHigh} bpm</p>
              </div>
              <div className="text-center">
                <div
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ backgroundColor: '#f44336' }}
                ></div>
                <p>위험 (상한)</p>
                <p>{thresholds.heartRateDangerHigh} bpm</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                // 임계값을 업데이트한 사용자 객체 생성
                const updatedUser = {
                  ...user,
                  thresholds: { ...thresholds },
                };
                // 사용자 업데이트 함수 호출 (서버로 전송)
                updateUser(updatedUser, true); // sendToServer를 true로 설정하여 서버로 전송
                setShowThresholdModal(false);
              }}
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
                availableRings
                  // 이미 다른 사용자에게 할당된 링은 제외
                  .filter(
                    (ring) =>
                      !users.some((otherUser) => otherUser.macAddr === ring.MacAddr)
                  )
                  .map((ring) => (
                    <li key={ring.MacAddr} className="flex justify-between items-center mb-2">
                      <span>{ring.Name || "Unknown Ring"}</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
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

// 컴포넌트 최적화: React.memo로 감싸기
export default React.memo(Card);
