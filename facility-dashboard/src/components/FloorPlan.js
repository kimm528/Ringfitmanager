// src/components/FloorPlan.js

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { FaMobileAlt, FaSave, FaUpload, FaLock, FaLockOpen } from 'react-icons/fa'; // FaLock, FaLockOpen 추가
import Modal from './Modal'; // 모달 컴포넌트
import axios from 'axios'; // axios 임포트
import Tooltip from '@mui/material/Tooltip'; 
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom'; // 사용자 상세 페이지로 이동하기 위한 Link
import { calculateUserStatus } from './calculateUserStatus'; // calculateUserStatus 함수 임포트
import './FloorPlan.css'; // CSS 파일 임포트 (대소문자 정확히 일치)
import DeviceIcon from './DeviceIcon'; // 새로 만든 컴포넌트

const FloorPlan = ({
  ringData,
  users,
  floorPlanImage,
  devices,
  setDevices,
  setFloorPlanImage,
  siteId,
  updateKey,
  isLocked,      // isLocked 상태 전달
  setIsLocked,   // setIsLocked 함수 전달
}) => { // updateKey 추가

  const colors = [
    "#FFEB3B", // 밝은 노란색
    "#03A9F4", // 밝은 파란색
    "#4CAF50", // 밝은 녹색
    "#FF5722", // 밝은 주황색
    "#9C27B0", // 밝은 보라색
    "#E91E63", // 밝은 핑크색
    "#FFC107", // 밝은 황금색
    "#00BCD4", // 밝은 청록색
    "#FF4081"  // 밝은 자홍색
  ];
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const smartphoneListRef = useRef(null); // 스마트폰 리스트의 높이를 측정하기 위한 ref

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null); // 디바이스 선택 상태
  const [newName, setNewName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [smartphoneListHeight, setSmartphoneListHeight] = useState(80); // 초기 높이 설정

  const UPLOAD_API_URL = `https://fitlife.dotories.com/api/site/image`; // 배치도 업로드 API 엔드포인트
  const UPLOADING_DEVICE_API_URL = `https://fitlife.dotories.com/api/device/floorplan`; // 디바이스 데이터 업로드 API 엔드포인트

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 업로드할 파일 상태
  const [selectedFile, setSelectedFile] = useState(null); // 파일 선택 상태

  // 캔버스 크기 조정 함수
  const adjustCanvasSize = useCallback((img) => {
    const padding = 32;
    const availableHeight = window.innerHeight - padding * 2 - smartphoneListHeight;
    const availableWidth = window.innerWidth - padding * 2;

    const aspectRatio = img.width / img.height;

    let newHeight = availableHeight;
    let newWidth = newHeight * aspectRatio;

    if (newWidth > availableWidth) {
      newWidth = availableWidth;
      newHeight = newWidth / aspectRatio;
    }

    setCanvasSize({ width: newWidth, height: newHeight });

    // 캔버스 요소의 width와 height 속성 업데이트
    if (canvasRef.current) {
      canvasRef.current.width = newWidth;
      canvasRef.current.height = newHeight;
    }

    console.log(`Canvas Size Updated: Width=${newWidth}, Height=${newHeight}`);
  }, [smartphoneListHeight]);

  // 스마트폰 리스트의 높이 측정
  useLayoutEffect(() => {
    if (smartphoneListRef.current) {
      const height = smartphoneListRef.current.clientHeight;
      setSmartphoneListHeight(height);
      console.log(`Smartphone List Height: ${height}px`);
    }
  }, [devices.length]); // 디바이스 리스트가 변경될 때마다 높이 재측정

  // 스마트폰 리스트 높이가 변경되었을 때 캔버스 크기 조정
  useEffect(() => {
    if (floorPlanImage) {
      adjustCanvasSize(floorPlanImage);
    }
  }, [smartphoneListHeight, adjustCanvasSize, floorPlanImage]);

  // 창 크기 및 사이드바 토글 시 캔버스 크기 조정
  useLayoutEffect(() => {
    if (floorPlanImage) {
      adjustCanvasSize(floorPlanImage);
    }
  }, [adjustCanvasSize, isSidebarCollapsed, floorPlanImage]);

  // 창 크기 변경 이벤트 리스너
  useEffect(() => {
    const handleResize = () => {
      if (floorPlanImage) {
        adjustCanvasSize(floorPlanImage);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustCanvasSize, floorPlanImage]);

  // 캔버스에 이미지 그리기
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && floorPlanImage) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(floorPlanImage, 0, 0, canvas.width, canvas.height);
        console.log('Canvas Image Drawn');
      }
    }
  }, [canvasSize, floorPlanImage]);

  // 디바이스 이름 변경 핸들러
  const handleChangeName = (device) => {
    setSelectedDevice(device);
    setNewName(device.DeviceName);
    setIsNameModalOpen(true);
  };

  // 이름 업데이트 함수
  const handleNameUpdate = () => {
    if (!newName.trim()) {
      // 메시지 설정 부분 제거
      return;
    }

    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.DeviceId === selectedDevice.DeviceId ? { ...device, DeviceName: newName.trim() } : device
      )
    );
    setIsNameModalOpen(false);
    setSelectedDevice(null);
    setNewName('');
    // 메시지 설정 부분 제거
    console.log(`Device Name Updated: ${selectedDevice.DeviceName} to ${newName.trim()}`);
  };

  // 디바이스 위치 업데이트 함수
  const updateDevicePosition = (id, xPercent, yPercent) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.DeviceId === id ? { ...device, CoordinateX: xPercent, CoordinateY: yPercent } : device
      )
    );
    console.log(`Device Position Updated: ID=${id} to (${xPercent}%, ${yPercent}%)`);
  };

  // 배치도 업로드 핸들러 (파일 선택 시)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      setSelectedFile(file);
    } else {
      // 메시지 설정 부분 제거
    }
  };

  // 배치도 업로드 함수
  const uploadFloorPlan = async () => {
    if (!selectedFile) {
      // 메시지 설정 부분 제거
      return;
    }

    // 파일 크기 제한 
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      // 메시지 설정 부분 제거
      return;
    }

    setIsLoading(true);
    // 메시지 초기화 관련 코드는 제거했습니다.

    try {
      // JSON 데이터 준비
      const jsonHeader = {
        header: {
          siteId: siteId,
        },
      };

      // FormData 생성
      const formData = new FormData();
      formData.append('jsonHeader', JSON.stringify(jsonHeader));
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      formData.append('siteImage', selectedFile, `image.${fileExtension}`);

      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');

      // Axios POST 요청
      const response = await axios.post(UPLOAD_API_URL, formData, {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.status === 200) {
        console.log('이미지 업로드 성공:', response.data);
        // 메시지 설정 부분 제거

        // 성공적으로 업로드되면 floorPlanImage 업데이트 및 sessionStorage에 저장
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          sessionStorage.setItem(`floorPlanImage_${siteId}`, base64data);
          const img = new Image();
          img.onload = () => {
            setFloorPlanImage(img);
            adjustCanvasSize(img);
          };
          img.src = base64data;
        };
        reader.readAsDataURL(selectedFile);

        setIsUploadModalOpen(false);
        setSelectedFile(null); // 파일 선택 초기화
      } else {
        console.error('배치도 업로드 실패:', response.statusText);
        // 메시지 설정 부분 제거
      }
    } catch (error) {
      console.error('배치도 업로드 오류:', error);
      // 메시지 설정 부분 제거
    } finally {
      setIsLoading(false);
    }
  };

  // saveDevicesToServer 함수 정의
  const saveDevicesToServer = useCallback(async () => {
    setIsLoading(true);
    // 메시지 초기화 관련 코드는 제거했습니다.
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await axios.post(UPLOADING_DEVICE_API_URL, { // UPLOADING_DEVICE_API_URL 변수가 실제 주소로 사용됨
        Header: {
          SiteId: siteId,
        },
        Data: devices.map(device => ({
          DeviceId: device.DeviceId,
          DeviceName: device.DeviceName,
          CoordinateX: device.CoordinateX,
          CoordinateY: device.CoordinateY,
        })),
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.status === 200) {
        // 메시지 설정 부분 제거
        console.log('디바이스 데이터 저장 성공:', response.data);
        
        // **잠금 상태를 활성화하도록 추가**
        setIsLocked(true);
      } else {
        console.error('디바이스 데이터 저장 실패:', response.statusText);
        // 메시지 설정 부분 제거
      }
    } catch (error) {
      const errorMessage = error.message || '디바이스 데이터를 저장하는데 오류가 발생했습니다.';
      console.error('디바이스 데이터 저장 오류:', errorMessage);
      // 메시지 설정 부분 제거
    } finally {
      setIsLoading(false);
    }
  }, [devices, siteId, setIsLocked]);

  // 매칭된 사용자 이름과 상태를 포함한 장치 데이터
  const devicesWithUserDetails = useMemo(() => {
    return devices.map((device) => {
      const connectedRings = ringData.filter((ring) => ring.DeviceId === device.DeviceId);
      const connectedUsers = connectedRings.map((ringDevice) => {
        const user = users.find((u) => u.macAddr === ringDevice.MacAddr);
        if (user) {
          const status = calculateUserStatus(user); // 사용자 상태 계산
          return { name: user.name, status: status, id: user.id };
        }
        return null;
      }).filter(Boolean);
  
      const overallStatus = connectedUsers.reduce((acc, user) => {
        if (user.status === 'danger') return 'danger';
        if (user.status === 'warning' && acc !== 'danger') return 'warning';
        return acc;
      }, 'normal');
  
      console.log(`Device ID: ${device.DeviceId}, Overall Status: ${overallStatus}`);
  
      return { ...device, connectedUsers, overallStatus };
    });
  }, [devices, ringData, users, updateKey]);

  // **페이지 새로고침 방지**
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    if (isNameModalOpen || isUploadModalOpen) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isNameModalOpen, isUploadModalOpen]);

  return (
    <div className="floorplan-container flex flex-col p-4 overflow-auto max-h-screen overflow-x-hidden">
      {/* 로딩 표시 */}
      {isLoading && (
        <div className="mb-4 p-4 rounded bg-blue-100 text-blue-700 flex items-center" role="status" aria-live="polite">
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          처리 중...
        </div>
      )}

      {/* 스마트폰 리스트 및 버튼 */}
      <div
        ref={smartphoneListRef}
        className="smartphone-list bg-white p-4 rounded shadow-lg overflow-y-auto transition-all duration-300 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center">
          <h3 className="text-lg font-bold mr-4">배치된 스마트폰:</h3>
          <div className="flex space-x-2">
            {devicesWithUserDetails.map((device, index) => (
              <Tooltip
              title={
                device.connectedUsers.length > 0 ? (
                  <div>
                    <p><strong>연결된 이용자:</strong></p>
                    {device.connectedUsers.map((user, i) => (
                      <div key={i} className="flex items-center">
                        <Link
                          to={`/users/${user.id}`}
                          className={`interactive-link ${user.status === 'danger' ? 'text-red-500' : 'text-white'}`} // interactive-link 클래스 추가
                          aria-label={`사용자 ${user.name} 상세 페이지 링크`}
                        >
                          {user.name}
                        </Link>
                        {user.status === 'danger' && (
                          <span className="ml-1 text-red-500" aria-label="위험 상태 표시">⚠️</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>연결된 이용자가 없습니다.</p>
                )
              }
              placement="right"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: '15px',
                    padding: '15px',
                    maxWidth: '400px',
                    bgcolor: 'grey.700',
                    color: 'white'
                  },
                },
                arrow: {
                  sx: { color: 'grey.700' },
                },
              }}
            >
                <button
                  onClick={() => handleChangeName(device)}
                  className="focus:outline-none"
                  aria-label={`디바이스 ${device.DeviceName} 이름 변경 버튼`}
                >
                  <FaMobileAlt size={20} color={colors[index % colors.length]} />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
        {/* 기존의 저장 버튼 제거 */}
        <div className="flex space-x-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center justify-center"
            aria-label="배치도 업로드 버튼"
          >
            <FaUpload className="mr-2" />
            배치도 업로드
          </button>
        </div>
      </div>

      {/* 캔버스 및 디바이스 아이콘 */}
      <div className="flex flex-1 w-full justify-center relative">
        <div
          ref={containerRef}
          className="canvas-container relative border border-gray-300 rounded shadow-lg overflow-hidden"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            position: 'relative',
            margin: '0 auto',
          }}
        >
          {/* 저장 버튼을 잠금 버튼의 왼쪽에 배치 */}
          <Tooltip title="디바이스 위치 저장" placement="bottom" arrow>
            <button
              onClick={() => saveDevicesToServer()} // saveDevicesToServer 함수 호출
              className="absolute top-2 right-12 bg-white bg-opacity-75 rounded-full p-2 shadow-md flex items-center justify-center"
              style={{ zIndex: 100 }} // zIndex 추가 및 높임
              aria-label="디바이스 위치 저장 버튼"
            >
              <FaSave size={25} color="#000000" /> {/* 아이콘 색상 설정 */}
            </button>
          </Tooltip>

          {/* 캔버스 내 잠금 아이콘 버튼 */}
          <Tooltip title={isLocked ? "잠금 해제" : "잠금 설정"} placement="bottom" arrow>
            <button
              onClick={() => setIsLocked(!isLocked)} // setIsLocked를 사용하여 상태 토글
              className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-2 shadow-md flex items-center justify-center"
              style={{ zIndex: 100 }} // zIndex 추가 및 높임
              aria-label={isLocked ? "잠금 해제" : "잠금 설정"}
            >
              {isLocked ? <FaLock size={25} color="#000000" /> : <FaLockOpen size={25} color="#000000" />}
            </button>
          </Tooltip>

          {floorPlanImage ? (
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                width: '100%',
                height: '100%',
                cursor: 'default',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
              }}
              aria-label="배치도 캔버스"
            />
          ) : (
            <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              배치도를 불러오거나 업로드하세요.
            </p>
          )}
          {/* 스마트폰 및 연결된 링 기기 수 표시 */}
          {floorPlanImage &&
            devicesWithUserDetails.map((device, index) => (
              <DeviceIcon
                key={`device-${device.DeviceId}-${updateKey}`}
                device={device}
                colors={colors}
                adjustCanvasSize={adjustCanvasSize}
                canvasSize={canvasSize}
                updateDevicePosition={updateDevicePosition}
                index={index}
                updateKey={updateKey}
                isLocked={isLocked} // 잠금 상태 전달
              />
            ))
          }
        </div>
      </div>

      {/* 디바이스 이름 변경 모달 */}
      {isNameModalOpen && selectedDevice && (
        <Modal onClose={() => setIsNameModalOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl mb-4">디바이스 이름 변경</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-300 rounded p-2 mb-4 w-full"
              placeholder="새 이름을 입력하세요"
              aria-label="디바이스 이름 입력 필드"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
                aria-label="모달 닫기 버튼"
              >
                취소
              </button>
              <button
                onClick={handleNameUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                aria-label="디바이스 이름 저장 버튼"
              >
                저장
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 배치도 업로드 모달 */}
      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl mb-4">배치도 업로드</h2>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="file-input w-full p-2 border border-gray-300 rounded mb-4"
              aria-label="배치도 업로드 파일 선택 필드"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
                aria-label="모달 닫기 버튼"
              >
                취소
              </button>
              <button
                onClick={uploadFloorPlan}
                className="bg-green-500 text-white px-4 py-2 rounded"
                aria-label="배치도 업로드 버튼"
              >
                업로드
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorPlan;
