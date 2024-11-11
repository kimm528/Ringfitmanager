// src/components/DeviceIcon.js

import React from 'react';
import Draggable from 'react-draggable';
import { FaMobileAlt } from 'react-icons/fa';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom';

const DeviceIcon = ({ device, canvasSize,colors, updateDevicePosition, index, updateKey, isLocked }) => { // isLocked 추가
  const { width, height } = canvasSize;
  const x = (device.CoordinateX / 100) * width;
  const y = (device.CoordinateY / 100) * height;

  const hasDanger = device.overallStatus === 'danger';



  return (
    <Draggable
      position={{ x, y }}
      bounds="parent"
      disabled={isLocked} // 잠금 상태일 때 드래그 비활성화
      onStop={(e, data) => {
        if (!isLocked) { // 잠금 해제 상태일 때만 위치 업데이트
          const newXPercent = (data.x / width) * 100;
          const newYPercent = (data.y / height) * 100;
          updateDevicePosition(device.DeviceId, newXPercent, newYPercent);
        }
      }}
    >
      <div
        className={`device-icon ${hasDanger ? 'danger-border' : ''}`}
        style={{
          position: 'absolute', // position을 flex로 변경
          cursor: isLocked ? 'not-allowed' : 'move', // 잠금 상태에 따라 커서 변경
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          color: 'white',
          fontSize: '12px',
          justifyItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '10px',
          padding: '2px 10px', // padding 줄임
          maxWidth: '100px', // maxWidth 줄임
        }}
        aria-label={`디바이스 ${device.DeviceName}`}
      >
        {/* Tooltip을 원 전체 영역에 적용 */}
        <Tooltip
          title={
            device.connectedUsers.length > 0 ? (
              <div>
                <p><strong>연결된 이용자:</strong></p>
                {device.connectedUsers.map((user, i) => (
                  <div key={i} className="flex items-center">
                    <Link
                      to={`/users/${user.id}`}
                      className={`${
                        user.status === 'danger' ? 'text-red-500' : 'text-white'
                      }`}
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
          {/* 원 전체를 감싸는 div */}
          <div
            style={{
              width: '50px', // 호버 영역의 가로 크기 줄임
              height: '50px', // 호버 영역의 세로 크기 줄임
              backgroundColor: 'rgba(255, 255, 255, 0.2)', // 원의 배경색 및 투명도 조절
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px', // 아이콘 주변 여백 추가
              boxSizing: 'border-box',
            }}
          >
            <Badge
              badgeContent={device.connectedUsers.length > 0 ? device.connectedUsers.length : null}
              color="primary"
              overlap="circular"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <FaMobileAlt size={25} color={colors[index % colors.length]} /> {/* 아이콘 크기 줄임 */}
            </Badge>
          </div>
        </Tooltip>
        <div style={{ marginTop: '2px', fontSize: '14px' }}>{device.DeviceName}</div> {/* DeviceName 크기 줄임 */}
      </div>
    </Draggable>
  );
};

export default DeviceIcon;
