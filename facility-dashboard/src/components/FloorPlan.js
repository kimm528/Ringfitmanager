// src/components/FloorPlan.js

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import Draggable from 'react-draggable';
import { FaMobileAlt, FaSave, FaUpload } from 'react-icons/fa';
import Modal from './Modal'; // 모달 컴포넌트
import axios from 'axios'; // axios 임포트
import Tooltip from '@mui/material/Tooltip'; 
import Badge from '@mui/material/Badge';

const FloorPlan = ({ringData, users}) => {
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const smartphoneListRef = useRef(null); // 스마트폰 리스트의 높이를 측정하기 위한 ref

  const [floorPlanImage, setFloorPlanImage] = useState(null);
  const [devices, setDevices] = useState([]); // 디바이스 위치 데이터를 저장할 상태 추가
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null); // 디바이스 선택 상태
  const [newName, setNewName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [smartphoneListHeight, setSmartphoneListHeight] = useState(80); // 초기 높이 설정

  const [siteId, setSiteId] = useState('Test'); // siteId를 상태로 설정

  const FLOOR_PLAN_API_URL = `https://fitlife.dotories.com/api/site/image?siteId=${siteId}`;
  const DEVICE_API_URL = `https://fitlife.dotories.com/api/device?siteId=${siteId}`; // 스마트폰 위치 데이터 API URL
  const UPLOAD_API_URL = `https://fitlife.dotories.com/api/site/image`; // 배치도 업로드 API 엔드포인트
  const Uploadingdevice = `https://fitlife.dotories.com/api/device/floorplan`; // 디바이스 데이터 업로드 API 엔드포인트

  // 아이콘 색상 배열
  const colors = [
    "#FF5733", // 밝은 주황색
    "#3375FF", // 밝은 파란색
    "#28A745", // 진한 녹색
    "#FF8C00", // 어두운 주황색
    "#6F42C1", // 보라색
    "#E74C3C", // 빨간색
    "#FFC300", // 황금색
    "#17A2B8", // 청록색
    "#FF33CC"  // 분홍색
  ];
  
  // 로딩 상태 및 메시지 상태
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [messageOpacity, setMessageOpacity] = useState(1); // New state for opacity


  // 업로드할 파일 상태
  const [selectedFile, setSelectedFile] = useState(null); // 추가된 부분

  // 배치도 불러오기 핸들러
  const handleLoadFloorPlan = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' }); // Reset message
    try {
      // Try to load the floor plan image from session storage
      const cachedImageData = sessionStorage.getItem(`floorPlanImage_${siteId}`);
      if (cachedImageData) {
        const img = new Image();
        img.onload = () => {
          setFloorPlanImage(img);
          adjustCanvasSize(img);
          setMessage({ type: 'success', text: '배치도 이미지가 세션에서 로드되었습니다.' });
        };
        img.src = cachedImageData;
        console.log('배치도 이미지 로드 성공 (세션에서 불러옴)');
      } else {
        // If not in session storage, fetch it from the server
        const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
        const imageResponse = await axios.get(FLOOR_PLAN_API_URL, {
          headers: {
            'Authorization': `Basic ${credentials}`,
          },
          responseType: 'blob', // Get image as blob
        });
  
        if (imageResponse.status === 200) {
          const blob = imageResponse.data;
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            sessionStorage.setItem(`floorPlanImage_${siteId}`, base64data);
            const img = new Image();
            img.onload = () => {
              setFloorPlanImage(img);
              adjustCanvasSize(img);
              setMessage({ type: 'success', text: '배치도 이미지가 서버에서 로드되었습니다.' });
            };
            img.src = base64data;
          };
          reader.readAsDataURL(blob);
          console.log('배치도 이미지 로드 성공 (서버에서 불러옴)');
        } else {
          console.error('배치도 이미지 로드 실패:', imageResponse.statusText);
          setMessage({ type: 'error', text: '배치도 이미지를 불러오는데 실패했습니다.' });
        }
      }

      // 스마트폰 위치 데이터 불러오기
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const deviceResponse = await axios.get(DEVICE_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (deviceResponse.status === 200) {
        // 응답 데이터 타입 확인 및 파싱
        let parsedDeviceData;
        if (typeof deviceResponse.data === 'string') {
          parsedDeviceData = JSON.parse(deviceResponse.data);
        } else {
          parsedDeviceData = deviceResponse.data;
        }
        setDevices(parsedDeviceData.Data || []);
        console.log('스마트폰 위치 데이터 불러오기 성공:', parsedDeviceData.Data);
      } else {
        console.error('스마트폰 위치 데이터 불러오기 실패:', deviceResponse.statusText);
        setMessage({ type: 'error', text: '스마트폰 위치 데이터를 불러오는데 실패했습니다.' });
      }

    } catch (error) {
      console.error('배치도 이미지 로드 오류:', error);
      setMessage({ type: 'error', text: '배치도 이미지를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveDevicesToServer = useCallback(async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' }); // 메시지 초기화
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await axios.post(Uploadingdevice, { // Uploadingdevice 변수가 실제 주소로 사용됨
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
        setMessage({ type: 'success', text: '디바이스 위치가 성공적으로 저장되었습니다.' });
        console.log('디바이스 데이터 저장 성공:', response.data);
      } else {
        console.error('디바이스 데이터 저장 실패:', response.statusText);
        setMessage({ type: 'error', text: '디바이스 데이터를 저장하는데 실패했습니다.' });
      }
    } catch (error) {
      const errorMessage = error.message || '디바이스 데이터를 저장하는데 오류가 발생했습니다.';
      console.error('디바이스 데이터 저장 오류:', errorMessage);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [devices, siteId]); // DEVICE_API_URL 제거
  

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
      setMessage({ type: 'error', text: '이름을 입력해주세요.' });
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
    setMessage({ type: 'success', text: '디바이스 이름이 변경되었습니다.' });
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
      setMessage({ type: 'error', text: 'PNG 또는 JPEG 파일만 업로드할 수 있습니다.' });
    }
  };

  // 배치도 업로드 함수
  const uploadFloorPlan = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: '이미지를 선택해주세요.' });
      return;
    }

    // 파일 크기 제한 
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: '파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' }); // 메시지 초기화

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
     setMessage({ type: 'success', text: '배치도가 성공적으로 업로드되었습니다.' });

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
 setMessage({ type: 'error', text: '배치도를 업로드하는데 실패했습니다.' });
}
} catch (error) {
console.error('배치도 업로드 오류:', error);
setMessage({ type: 'error', text: '배치도 업로드 중 오류가 발생했습니다.' });
} finally {
setIsLoading(false);
}
};

  // 컴포넌트 마운트 시 배치도 자동 로드
  useEffect(() => {
    handleLoadFloorPlan();
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    if (message.text) {
      setMessageOpacity(1); // Reset opacity when a new message appears
      const fadeTimer = setTimeout(() => {
        setMessageOpacity(0); // Start fade-out after 3 seconds
      }, 3000); // Wait for 3 seconds before starting fade-out
  
      const removeTimer = setTimeout(() => {
        setMessage({ type: '', text: '' }); // Remove the message after fade-out
      }, 4000); // Total display time is 4 seconds
  
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [message]);
  

  // 매칭된 사용자 이름을 포함한 장치 데이터
  const devicesWithUserNames = devices.map((device) => {
    // `DeviceId`로 ringData에서 매칭되는 모든 장치를 찾기
    const connectedRings = ringData.filter((ring) => ring.DeviceId === device.DeviceId);
  
    // 연결된 링 데이터에서 모든 사용자 이름을 가져오기
    const userNames = connectedRings
      .map((ringDevice) => {
        return users.find((user) => user.macAddr === ringDevice.MacAddr)?.name;
      })
      .filter(Boolean); // 이름이 없는 경우 제거
  
    return { ...device, userNames };
  });

  

  return (
    <div className="floorplan-container flex flex-col p-4 overflow-auto max-h-screen overflow-x-hidden">
      {message.text && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' :
            message.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}
          style={{
            opacity: messageOpacity,
            transition: 'opacity 1s ease-in-out',
          }}
        >
          {message.text}
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-4 rounded bg-blue-100 text-blue-700 flex items-center">
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
            {devices.map((device, index) => (
            <Tooltip
            key={device.DeviceId}
            title={
              <div>
                <p><strong>Device ID : </strong> {device.DeviceId}</p>
                <p><strong>Model : </strong> {device.DeviceModel}</p>
                <p><strong>Name : </strong> {device.DeviceName}</p>
              </div>
            }
            placement="top"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: '15px',   // 툴팁 텍스트 크기
                  padding: '15px',     // 툴팁 내부 여백
                  maxWidth: '400px',  // 툴팁 최대 너비
                  bgcolor: 'grey.700', // 배경색 (MUI 색상 또는 커스텀 컬러)
                  color: 'white'      // 텍스트 색상
                },
              },
              arrow: {
                sx: {
                  color: 'grey.700', // 화살표 색상 (배경색과 맞춤)
                },
              },
            }}
          >
            <button
              onClick={() => handleChangeName(device)}
              className="focus:outline-none"
            >
              <FaMobileAlt size={20} color={colors[index % colors.length]} />
            </button>
          </Tooltip>
            ))}
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={saveDevicesToServer}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            저장
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center justify-center"
          >
            <FaUpload className="mr-2" />
            배치도 업로드
          </button>
        </div>
      </div>

      {/* 캔버스 및 디바이스 아이콘 */}
      <div className="flex flex-1 w-full justify-center">
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
            />
          ) : (
            <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              배치도를 불러오거나 업로드하세요.
            </p>
          )}
          {/* 스마트폰 및 연결된 링 기기 수 표시 */}
          {floorPlanImage &&
  devicesWithUserNames.map((device, index) => {
    const { width, height } = canvasSize;
    const x = (device.CoordinateX / 100) * width;
    const y = (device.CoordinateY / 100) * height;

    return (
      <Draggable
        key={`device-${device.DeviceId}`}
        position={{ x, y }}
        bounds="parent"
        onStop={(e, data) => {
          const newXPercent = (data.x / width) * 100;
          const newYPercent = (data.y / height) * 100;
          updateDevicePosition(device.DeviceId, newXPercent, newYPercent);
        }}
      >
        <div
  style={{
    position: 'absolute',
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
    textAlign: 'center',
    color: 'white', // 텍스트 색상을 흰색으로 변경
    fontSize: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 어두운 반투명 배경
    borderRadius: '8px', // 둥근 모서리
    padding: '8px 8px', // 텍스트와의 여백
    maxWidth: '66px', // 배경 너비 제한
  }}
        >
          <div
            style={{
              width: '50px', // 배경 크기 설정
              height: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)', // 흰색 반투명 배경
              borderRadius: '50%', // 원형 배경
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '5px', // 아이콘과 이름 사이 여백
            }}
          >
            {/* Badge와 Tooltip 적용 */}
            <Tooltip
              title={
                device.userNames.length > 0 ? ( // 연결된 사용자가 있을 때만 표시
                  <div>
                    <p><strong>연결된 이용자:</strong></p>
                    {device.userNames.map((userName, i) => (
                      <p key={i}>{userName}</p>
                    ))}
                  </div>
                ) : null
              }
              placement="right"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: '15px',
                    padding: '15px',
                    maxWidth: '200px',
                    bgcolor: 'grey.700',
                    color: 'white',
                  },
                },
                arrow: {
                  sx: { color: 'grey.700' },
                },
              }}
            >
              <Badge
                badgeContent={device.userNames.length > 0 ? device.userNames.length : null}
                color="primary"
                overlap="circular"
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <FaMobileAlt size={24} color={colors[index % colors.length]} />
              </Badge>
            </Tooltip>
          </div>
          <div>{device.DeviceName}</div>
        </div>
      </Draggable>
    );
  })}


        </div>
      </div>

      {/* 디바이스 이름 변경 모달 */}
      {isNameModalOpen && selectedDevice && (
        <Modal onClose={() => setIsNameModalOpen(false)}>
          <h2 className="text-xl mb-4">디바이스 이름 변경</h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border border-gray-300 rounded p-2 mb-4 w-full"
            placeholder="새 이름을 입력하세요"
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsNameModalOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              취소
            </button>
            <button
              onClick={handleNameUpdate}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              저장
            </button>
          </div>
        </Modal>
      )}

      {/* 배치도 업로드 모달 */}
      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)}>
          <h2 className="text-xl mb-4">배치도 업로드</h2>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            className="file-input w-full p-2 border border-gray-300 rounded mb-4"
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              취소
            </button>
            <button
              onClick={uploadFloorPlan}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              업로드
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorPlan;