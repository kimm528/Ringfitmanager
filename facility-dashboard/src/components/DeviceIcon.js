// src/components/DeviceIcon.js

import React from 'react';
import Draggable from 'react-draggable';
import { FaMobileAlt } from 'react-icons/fa';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom';

const DeviceIcon = ({ device, colors, canvasSize, updateDevicePosition, index, updateKey }) => {
  const { width, height } = canvasSize;
  const x = (device.CoordinateX / 100) * width;
  const y = (device.CoordinateY / 100) * height;

  const hasDanger = device.overallStatus === 'danger';

return (
  <Draggable
    position={{ x, y }}
    bounds="parent"
    onStop={(e, data) => {
      const newXPercent = (data.x / width) * 100;
      const newYPercent = (data.y / height) * 100;
      updateDevicePosition(device.DeviceId, newXPercent, newYPercent);
    }}
  >
    <div
      className={`device-icon ${hasDanger ? 'danger-border' : ''}`}
      style={{
        position: 'absolute',
        cursor: 'move',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        textAlign: 'center',
        color: 'white',
        fontSize: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '8px',
        padding: '8px 8px',
        maxWidth: '66px',
      }}
      aria-label={`디바이스 ${device.DeviceName}`}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '5px',
        }}
      >
        {/* Badge와 Tooltip 적용 */}
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
          <Badge
            badgeContent={device.connectedUsers.length > 0 ? device.connectedUsers.length : null}
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
};

export default DeviceIcon;
