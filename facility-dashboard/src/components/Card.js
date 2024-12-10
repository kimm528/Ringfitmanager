// src/components/Card.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaEllipsisV, FaExchangeAlt } from 'react-icons/fa';
import {
  BarChart,
  ReferenceArea,
  Bar,
  Cell,
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
import '../App.css';
import ReactSlider from 'react-slider';
import { calculateUserStatus, calculateSleepScore } from './CalculateUserStatus';
import { PiSirenFill } from 'react-icons/pi';


const Card = ({
  user,
  toggleFavorite,
  updateUser,
  deleteUser,
  availableRings,
  users,
  disconnectInterval,
}) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRingModal, setShowRingModal] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender);
  const [editedAge, setEditedAge] = useState(user.age);
  const [isRingConnected, setIsRingConnected] = useState(false);

  // **새로 추가된 상태**
  const [showRingDisconnectModal, setShowRingDisconnectModal] = useState(false);

  const menuRef = useRef(null);
  const modalRef = useRef(null);

  const OXYGEN_WARNING_THRESHOLD = 95;
  const OXYGEN_DANGER_THRESHOLD = 90;

  const [thresholds, setThresholds] = useState({
    heartRateWarningLow: user.thresholds?.heartRateWarningLow || 60,
    heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 100,
    heartRateDangerLow: user.thresholds?.heartRateDangerLow || 50,
    heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 110,
  });

  const sleepScore = useMemo(() => {
    const sleepData = user.data?.sleepData || {};
    const {
      totalSleepDuration = 0,
      deepSleepDuration = 0,
      awakeDuration = 0,
      shallowSleepDuration = 0,
    } = sleepData;

    return calculateSleepScore(
      totalSleepDuration,
      deepSleepDuration,
      awakeDuration,
      shallowSleepDuration
    );
  }, [user.data]);

  useEffect(() => {
    setThresholds({
      heartRateWarningLow: user.thresholds?.heartRateWarningLow || 60,
      heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 100,
      heartRateDangerLow: user.thresholds?.heartRateDangerLow || 50,
      heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 110,
    });
  }, [user.thresholds]);

  const parseConnectedTime = useCallback((connectedTimeStr) => {
    // connectedTimeStr은 "YYMMDDhhmmss" 형식
    if (!connectedTimeStr || connectedTimeStr.length !== 12) {
      return null;
    }
    const year = parseInt(connectedTimeStr.slice(0, 2), 10) + 2000; // 2000년대 가정
    const month = parseInt(connectedTimeStr.slice(2, 4), 10) - 1; // 월은 0부터 시작
    const day = parseInt(connectedTimeStr.slice(4, 6), 10);
    const hour = parseInt(connectedTimeStr.slice(6, 8), 10);
    const minute = parseInt(connectedTimeStr.slice(8, 10), 10);
    const second = parseInt(connectedTimeStr.slice(10, 12), 10);

    const date = new Date(year, month, day, hour, minute, second);

    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }, []);

  useEffect(() => {
    const checkRingConnection = () => {
      if (user.ring && user.ring.ConnectedTime) {
        const connectedTime = parseConnectedTime(user.ring.ConnectedTime);
        if (connectedTime) {
          const currentTime = Date.now();
          const timeDiff = currentTime - connectedTime.getTime();
          if (timeDiff > disconnectInterval * 60 * 1000) {
            setIsRingConnected(false);
          } else {
            setIsRingConnected(true);
          }
        } else {
          setIsRingConnected(false);
        }
      } else {
        setIsRingConnected(false);
      }
    };

    checkRingConnection();

    const checkInterval = Math.max((disconnectInterval * 60 * 1000) / 5, 300 * 1000);

    const intervalId = setInterval(checkRingConnection, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [user.ring, disconnectInterval, parseConnectedTime]);

  // 데이터에서 마지막 0이 아닌 값을 추출하는 함수
  const getLastNonZero = useCallback((arr) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== 0) {
        return arr[i];
      }
    }
    return 0;
  }, []);

  // 시간대별 데이터에서 마지막 0이 아닌 값 추출
  const lastSteps = useMemo(() => getLastNonZero(user.data?.hourlyData?.steps || []), [user.data, getLastNonZero]);
  const lastCalories = useMemo(() => getLastNonZero(user.data?.hourlyData?.calories || []), [user.data, getLastNonZero]);
  const lastDistance = useMemo(() => getLastNonZero(user.data?.hourlyData?.distance || []), [user.data, getLastNonZero]);

  // 기존 총합 데이터를 제거하고, 마지막 값을 사용
  const processedSteps = lastSteps;
  const processedCalories = lastCalories;
  const processedDistance = lastDistance;

  const { bpm, oxygen, stress, sleep } = user.data || {
    bpm: 0,
    oxygen: 0,
    stress: 0,
    sleep: 0,
  };

  const STATUS_COLORS = {
    normal: '#4caf50', // 초록색
    warning: '#ff9800', // 노란색
    danger: '#f44336', // 빨간색
  };

  // 심박수 상태 계산 함수
  const getHeartRateStatus = useCallback(
    (value) => {
      if (value === 0) return 'normal';
      if (value >= thresholds.heartRateDangerHigh || value <= thresholds.heartRateDangerLow)
        return 'danger';
      if (value >= thresholds.heartRateWarningHigh || value <= thresholds.heartRateWarningLow)
        return 'warning';
      return 'normal';
    },
    [thresholds]
  );

  // 산소포화도 상태 계산 함수
  const getOxygenStatus = useCallback((value) => {
    if (value === 0) return 'normal';
    if (value < OXYGEN_DANGER_THRESHOLD) return 'danger';
    if (value < OXYGEN_WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }, []);

  // 스트레스 지수 상태 계산 함수
  const getStressStatus = useCallback((value) => {
    if (value === 0) return 'normal';
    if (value >= 66) return 'danger';
    if (value >= 33) return 'warning';
    return 'normal';
  }, []);

  const barChartData = [
    {
      name: '심박수',
      xValue: 1,
      value: bpm,
      status: getHeartRateStatus(bpm),
      dangerLow: thresholds.heartRateDangerLow,
      warningLow: thresholds.heartRateWarningLow,
      warningHigh: thresholds.heartRateWarningHigh,
      dangerHigh: thresholds.heartRateDangerHigh,
    },
    {
      name: '산소포화도',
      xValue: 2,
      value: oxygen,
      status: getOxygenStatus(oxygen),
      dangerLow: OXYGEN_DANGER_THRESHOLD,
      warningLow: OXYGEN_WARNING_THRESHOLD,
      warningHigh: 100,
      dangerHigh: 100,
    },
    {
      name: '스트레스',
      xValue: 3,
      value: stress,
      status: getStressStatus(stress),
      dangerLow: 66,
      warningLow: 33,
      warningHigh: 0,
      dangerHigh: 0,
    },
  ];

  const status = useMemo(() => {
    return calculateUserStatus({
      ...user,
      data: { ...user.data },
      thresholds,
    });
  }, [user, thresholds]);

  const openThresholdModal = useCallback(
    (e) => {
      e.stopPropagation();
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

  const openEditModalHandler = useCallback(
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

  const openDeleteModalHandler = useCallback(
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
    updateUser(updatedUser, true);
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
          style={{ pointerEvents: 'none' }}
        >
          {value}
        </text>
      );
    }
    return null;
  }, []);

  // **새로 추가된 링 변경 핸들러**
  const handleRingChangeClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (user.ring && user.ring.MacAddr) {
        // 링이 연결된 사용자일 경우 링 해제 확인 모달 표시
        setShowRingDisconnectModal(true);
      } else {
        // 링이 연결되지 않은 사용자일 경우 DeviceManagement 페이지로 이동하면서 사용자 전달
        navigate('/devices', { state: { selectedUser: user } });
      }
    },
    [user, navigate]
  );

  return (
    <div
      className={`card p-4 rounded-lg shadow-md bg-white relative cursor-pointer ${
        status === 'warning' ? 'border-4 border-yellow-500' : ''
      } ${
        // 'animate-blink' 클래스 제거하여 카드가 더 이상 깜빡이지 않도록 함
        status === 'danger' ? 'border-4 border-red-500' : ''
      }`}
      style={{
        width: '350px',
        margin: '10px',
        fontFamily: 'Nanum Gothic, sans-serif',
        minHeight: '400px',
      }}
      onClick={navigateToUserDetail}
    >
      <div className="absolute top-2 right-2 flex items-center" ref={menuRef}>
        {/* 위험 상태일 때 알람 아이콘 추가 */}
        {status === 'danger' && (
          <PiSirenFill
            className="text-red-500 animate-blink mr-2" // animate-blink 클래스만 아이콘에 적용
            size={22}
            aria-label="위험 상태 알람"
          />
        )}

        {/* 즐겨찾기 버튼 */}
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

        {/* 링 변경 버튼 추가 */}
        <button
          style={{
            padding: '5px',
            marginRight: '5px',
            borderRadius: '80%',
          }}
          onClick={handleRingChangeClick}
          aria-label="링 변경"
        >
          <FaExchangeAlt
            className={`mr-1 ${user.ring && user.ring.MacAddr ? 'text-blue-500' : 'text-gray-400'}`}
            size={20}
          />
        </button>

        {/* 메뉴 버튼 */}
        <button onClick={toggleMenu} aria-label="메뉴 열기">
          <FaEllipsisV size={20} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 mt-12 translate-y-2 py-2 w-48 bg-white border rounded shadow-lg z-50"
          >
            <button
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openThresholdModal}
            >
              심박수 위험도 수정
            </button>
            <button
              className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openEditModalHandler}
            >
              사용자 정보 수정
            </button>
            <button
              className="block px-4 py-2 text-red-600 hover:bg-gray-200 hover:shadow-inner w-full text-left"
              onClick={openDeleteModalHandler}
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
        <p className="text-sm text-gray-600">
          {user.ring ? `연결된 링: ${user.ring.Name || '없음'}` : '링 없음'}
        </p>
      </div>

      <div className="card-body">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={barChartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis
              dataKey="xValue"
              type="number"
              xAxisId="x"
              ticks={[1, 2, 3]} // 틱 위치 지정
              tickFormatter={(value) => {
                const entry = barChartData.find((item) => item.xValue === value);
                return entry ? entry.name : '';
              }}
              domain={[0.5, 3.5]}
              allowDuplicatedCategory={false}
            />
            <YAxis domain={[0, 180]} ticks={[0, 30, 60, 90, 120, 150, 180]} />

            {/* ReferenceArea에 마진 적용 */}
            {barChartData.map((entry, index) => (
              <React.Fragment key={`reference-${index}`}>
                {(() => {
                  const margin = 0.2; // 마진 값 (0보다 크고 0.5보다 작은 값)
                  return (
                    <>
                      {/* 심박수와 산소포화도 그래프 */}
                      {entry.name !== '스트레스' && (
                        <>
                          {/* 위험 하한 영역 */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={0}
                            y2={entry.dangerLow}
                            xAxisId="x"
                            fill="#f44336"
                            fillOpacity={0.2}
                          />
                          {/* 경고 하한 영역 */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={entry.dangerLow}
                            y2={entry.warningLow}
                            xAxisId="x"
                            fill="#ff9800"
                            fillOpacity={0.2}
                          />
                          {/* 정상 영역 */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={entry.warningLow}
                            y2={entry.warningHigh || entry.warningLow}
                            xAxisId="x"
                            fill="#4caf50"
                            fillOpacity={0.2}
                          />
                          {/* 경고 상한 영역 */}
                          {entry.warningHigh && (
                            <ReferenceArea
                              x1={entry.xValue - 0.5 + margin}
                              x2={entry.xValue + 0.5 - margin}
                              y1={entry.warningHigh}
                              y2={entry.dangerHigh || entry.warningHigh}
                              xAxisId="x"
                              fill="#ff9800"
                              fillOpacity={0.2}
                            />
                          )}
                          {/* 위험 상한 영역 */}
                          {entry.dangerHigh && (
                            <ReferenceArea
                              x1={entry.xValue - 0.5 + margin}
                              x2={entry.xValue + 0.5 - margin}
                              y1={entry.dangerHigh}
                              y2={180} // Y축 최대값에 맞게 조정
                              xAxisId="x"
                              fill="#f44336"
                              fillOpacity={0.2}
                            />
                          )}
                        </>
                      )}

                      {/* 스트레스 그래프 */}
                      {entry.name === '스트레스' && (
                        <>
                          {/* 정상 영역 (0 ~ 33) */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={0}
                            y2={entry.warningLow}
                            xAxisId="x"
                            fill="#4caf50"
                            fillOpacity={0.2}
                          />
                          {/* 경고 영역 (34 ~ 66) */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={34}
                            y2={66}
                            xAxisId="x"
                            fill="#ff9800"
                            fillOpacity={0.2}
                          />
                          {/* 위험 영역 (67 ~ 100) */}
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={67}
                            y2={180}
                            xAxisId="x"
                            fill="#f44336"
                            fillOpacity={0.2}
                          />
                        </>
                      )}
                    </>
                  );
                })()}
              </React.Fragment>
            ))}

            {/* 실제 값 표시를 위한 Bar */}
            <Bar dataKey="value" isAnimationActive={false} xAxisId="x" barSize={30}>
              {barChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
              ))}
              <LabelList dataKey="value" content={renderCustomLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with Last Non-Zero Steps, Calories, Distance, Sleep Score */}
      <div className="card-footer mt-4 grid grid-cols-4 gap-2 text-center text-sm p-2 bg-gray-100 rounded-md">
        {[
          {
            icon: <MdDirectionsWalk size={24} color="#3b82f6" />,
            label: '걸음수',
            value: `${processedSteps}보`,
          },
          {
            icon: <MdLocalFireDepartment size={24} color="#ff5722" />,
            label: '칼로리',
            value: `${(processedCalories / 1000).toFixed(0)} kcal`,
          },
          {
            icon: <MdLocationOn size={24} color="#4caf50" />,
            label: '이동거리',
            value: `${(processedDistance / 1000).toFixed(2)} km`, // 거리 단위를 km로 변환
          },
          {
            icon: <MdHotel size={24} color="#9c27b0" />,
            label: '수면점수',
            value: `${sleepScore}점`,
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
                          ? '#f44336'
                          : '#ff9800',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      position: 'absolute',
                    }}
                  ></div>
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
                            return '#f44336';
                          case 1:
                            return '#ff9800';
                          case 2:
                            return '#4caf50';
                          case 3:
                            return '#ff9800';
                          case 4:
                            return '#f44336';
                          default:
                            return '#ddd';
                        }
                      })(),
                    }}
                  />
                )}
              />
            </div>
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
                const updatedUser = {
                  ...user,
                  thresholds: { ...thresholds },
                };
                updateUser(updatedUser, true);
                setShowThresholdModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              저장
            </button>
          </div>
        </Modal>
      )}

      {showRingDisconnectModal && (
        <Modal onClose={() => setShowRingDisconnectModal(false)} ref={modalRef}>
          <div onClick={(e) => e.stopPropagation()}> {/* 이벤트 전파 중지 */}
            <h2 className="text-xl font-semibold mb-4">링 해제</h2>
            <p>링을 해제하시겠습니까?</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowRingDisconnectModal(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded-md mr-2"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const updatedUser = {
                    ...user,
                    ring: null,
                    macAddr: '',
                  };
                  updateUser(updatedUser, true);
                  setShowRingDisconnectModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                확인
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} ref={modalRef}>
          <h2 className="text-xl font-semibold mb-4">사용자 정보 수정</h2>

          {/* Name Edit */}
          <div className="mb-4">
            <label className="block">이름</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Gender Edit */}
          <div className="mb-4">
            <label className="block">성별</label>
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
            <label className="block">나이</label>
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
          isRingConnected ? (
            <>
              <span className="text-green-500 font-semibold">링 연결됨</span>
              <span className="text-gray-700 font-medium">
                배터리: {user.ring.BatteryLevel || 'N/A'}%
              </span>
            </>
          ) : (
            <span className="text-red-500 font-semibold blink">링 확인요망</span>
          )
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
                  const updatedUser = {
                    ...user,
                    ring: null,
                    macAddr: '',
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
                  updateUser(updatedUser, true);
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
                  .filter((ring) => !users.some((otherUser) => otherUser.macAddr === ring.MacAddr))
                  .map((ring) => (
                    <li key={ring.MacAddr} className="flex justify-between items-center mb-2">
                      <span>{ring.Name || 'Unknown Ring'}</span>
                      <button
                        onClick={() => {
                          const updatedUser = {
                            ...user,
                            ring: ring,
                            macAddr: ring.MacAddr,
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
                          updateUser(updatedUser, true);
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

export default Card;
