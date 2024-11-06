import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import Draggable from 'react-draggable';
import { FaMobileAlt, FaSave, FaUpload } from 'react-icons/fa';
import Modal from './Modal';

const FloorPlan = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [floorPlanImage, setFloorPlanImage] = useState(null);
  const [smartphones, setSmartphones] = useState([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [newName, setNewName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const API_URL = 'https://fitlife.dotories.com/api/smartphones';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = () => {
          setFloorPlanImage(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchSmartphones = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSmartphones(data.smartphones || []);
      } else {
        console.error('스마트폰 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('스마트폰 데이터 불러오기 오류:', error);
    }
  }, []);

  const saveSmartphonesToServer = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ smartphones }),
      });
      if (response.ok) {
        alert('스마트폰 위치가 성공적으로 저장되었습니다.');
      } else {
        console.error('스마트폰 데이터를 서버에 저장하는데 실패했습니다.');
        alert('스마트폰 데이터를 저장하는데 실패했습니다.');
      }
    } catch (error) {
      console.error('스마트폰 데이터 저장 오류:', error);
      alert('스마트폰 데이터를 저장하는데 오류가 발생했습니다.');
    }
  }, [smartphones]);

  const adjustCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container && floorPlanImage) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Adjust the canvas to keep a fixed aspect ratio (based on the original image)
      const aspectRatio = floorPlanImage.width / floorPlanImage.height;
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / aspectRatio;

      if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      setCanvasSize({ width: canvasWidth, height: canvasHeight });
    }
  }, [floorPlanImage]);

  useEffect(() => {
    const handleResize = () => {
      adjustCanvasSize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustCanvasSize]);

  useEffect(() => {
    if (floorPlanImage) {
      adjustCanvasSize();
      fetchSmartphones();
    }
  }, [floorPlanImage, adjustCanvasSize, fetchSmartphones]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && floorPlanImage) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        ctx.drawImage(floorPlanImage, 0, 0, canvasSize.width, canvasSize.height);
      }
    }
  }, [canvasSize, floorPlanImage]);

  useEffect(() => {
    setSmartphones((prevSmartphones) =>
      prevSmartphones.map((phone) => ({
        ...phone,
        x: (phone.xPercent / 100) * canvasSize.width,
        y: (phone.yPercent / 100) * canvasSize.height,
      }))
    );
  }, [canvasSize]);

  const addSmartphone = (name, x, y) => {
    const { width: canvasWidth, height: canvasHeight } = canvasSize;

    const xPercent = (x / canvasWidth) * 100;
    const yPercent = (y / canvasHeight) * 100;

    const newPhone = {
      id: Date.now().toString(),
      name: name || `Device-${smartphones.length + 1}`,
      xPercent,
      yPercent,
    };
    setSmartphones((prevSmartphones) => [...prevSmartphones, newPhone]);
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addSmartphone('New Device', x, y);
  };

  const handleChangeName = (phone) => {
    setSelectedPhone(phone);
    setNewName(phone.name);
    setIsNameModalOpen(true);
  };

  const handleNameUpdate = () => {
    if (!newName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    setSmartphones((prevSmartphones) =>
      prevSmartphones.map((phone) =>
        phone.id === selectedPhone.id ? { ...phone, name: newName.trim() } : phone
      )
    );
    setIsNameModalOpen(false);
    setSelectedPhone(null);
    setNewName('');
  };

  const handleDeletePhone = (id) => {
    setSmartphones((prevSmartphones) =>
      prevSmartphones.filter((phone) => phone.id !== id)
    );
  };

  const updateSmartphonePosition = (id, xPercent, yPercent) => {
    setSmartphones((prevSmartphones) =>
      prevSmartphones.map((phone) =>
        phone.id === id ? { ...phone, xPercent, yPercent } : phone
      )
    );
  };

  const colors = ["red", "blue", "green", "orange", "purple", "yellow", "pink", "cyan", "magenta"];

  return (
    <div className="floorplan-container flex flex-col h-full p-4">
      <div className="smartphone-list bg-white p-4 rounded shadow-lg overflow-y-auto transition-all duration-300 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-lg font-bold mr-4">배치된 스마트폰:</h3>
          <div className="flex space-x-2">
            {smartphones.map((phone, index) => (
              <FaMobileAlt key={phone.id} size={20} color={colors[index % colors.length]} />
            ))}
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={saveSmartphonesToServer}
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

      <div className="flex flex-1 w-full">
        <div
          ref={containerRef}
          className="canvas-container relative flex-1 border border-gray-300 rounded shadow-lg flex justify-center items-center overflow-hidden"
        >
          {floorPlanImage ? (
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full h-full"
              style={{ cursor: 'pointer' }}
              onClick={handleCanvasClick}
            />
          ) : (
            <p>배치도를 업로드해주세요.</p>
          )}
          {floorPlanImage &&
            smartphones.map((phone, index) => {
              const { width, height } = canvasSize;
              const x = (phone.xPercent / 100) * width;
              const y = Math.min((phone.yPercent / 100) * height, height - 30);
              return (
                <Draggable
                  key={phone.id}
                  position={{ x, y }}
                  bounds="parent"
                  onStop={(e, data) => {
                    const xPercent = (data.x / width) * 100;
                    const yPercent = Math.min((data.y / height) * 100, 100);
                    updateSmartphonePosition(phone.id, xPercent, yPercent);
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      cursor: 'move',
                      textAlign: 'center',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <FaMobileAlt size={30} color={colors[index % colors.length]} />
                  </div>
                </Draggable>
              );
            })}
        </div>
      </div>

      {isNameModalOpen && selectedPhone && (
        <Modal onClose={() => setIsNameModalOpen(false)}>
          <h2 className="text-xl mb-4">스마트폰 이름 변경</h2>
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

      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)}>
          <h2 className="text-xl mb-4">배치도 업로드</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input w-full p-2 border border-gray-300 rounded mb-4"
          />
          <div className="flex justify-end">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              취소
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorPlan;
