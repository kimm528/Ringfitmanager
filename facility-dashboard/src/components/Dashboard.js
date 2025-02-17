// src/components/Dashboard.js

import React, { useState, useMemo, useCallback } from 'react';
import Card from './Card';
import { calculateUserStatus } from './CalculateUserStatus';
import { motion } from 'framer-motion';

const Dashboard = ({
  users,
  searchQuery,
  updateUser,
  deleteUser,
  availableRings,
  toggleFavorite,
  disconnectInterval,
  sortOption,
  assignedUsers
}) => {
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showRingDisconnectModal, setShowRingDisconnectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const parseCreateDateTime = (createDateTime) => {
    if (!createDateTime || createDateTime.length !== 12) return new Date(0);
    const year = parseInt(createDateTime.slice(0, 2), 10) + 2000;
    const month = parseInt(createDateTime.slice(2, 4), 10) - 1;
    const day = parseInt(createDateTime.slice(4, 6), 10);
    const hours = parseInt(createDateTime.slice(6, 8), 10);
    const minutes = parseInt(createDateTime.slice(8, 10), 10);
    const seconds = parseInt(createDateTime.slice(10, 12), 10);
    
    return new Date(year, month, day, hours, minutes, seconds);
  };
  
  const sortByOption = useCallback((a, b) => {
    switch (sortOption) {
      case '심박수 순': {
        const diff = (b.data?.bpm || 0) - (a.data?.bpm || 0);
        if (diff !== 0) {
          return diff;
        } else {
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '즐겨찾기 순': {
        const diff = (b.isFavorite === true ? 1 : 0) - (a.isFavorite === true ? 1 : 0);
        if (diff !== 0) {
          return diff;
        } else {
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '최근 등록순': {
        const aDate = parseCreateDateTime(a.CreateDateTime);
        const bDate = parseCreateDateTime(b.CreateDateTime);
        const diff = bDate - aDate;
        if (diff !== 0) {
          return diff;
        } else {
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '이름 순':
      default:
        return (a.name || '').localeCompare(b.name || '', 'ko');
    }
  }, [sortOption]);

  const sortedUsers = useMemo(() => {
    const assignedUserIds = assignedUsers || [];
    const filtered = users
      .filter(user => assignedUserIds.includes(user.id))
      .filter((user) =>
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  
    const usersWithStatus = filtered.map((user) => ({
      ...user,
      status: calculateUserStatus(user),
    }));
  
    usersWithStatus.sort((a, b) => {
      if (a.status.status === 'danger' && b.status.status !== 'danger') {
        return -1;
      } else if (b.status.status === 'danger' && a.status.status !== 'danger') {
        return 1;
      } else {
        return sortByOption(a, b);
      }
    });
  
    return usersWithStatus;
  }, [users, searchQuery, sortOption, sortByOption, assignedUsers]);

  const handleCardUpdate = useCallback((updatedUser, shouldExpand) => {
    if (shouldExpand) {
      setExpandedUserId(updatedUser.id);
    } else {
      setExpandedUserId(null);
    }
    updateUser(updatedUser);
  }, [updateUser]);

  const handleRingDisconnect = useCallback((user) => {
    setSelectedUser(user);
    setShowRingDisconnectModal(true);
  }, []);

  const handleRingDisconnectConfirm = useCallback(() => {
    if (selectedUser) {
      const updatedUser = {
        ...selectedUser,
        ring: null,
        macAddr: ''
      };
      updateUser(updatedUser);
      setShowRingDisconnectModal(false);
      setSelectedUser(null);
    }
  }, [selectedUser, updateUser]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center p-4">
        {/* 상단 요소가 필요하면 추가 */}
      </div> 

      <div className="flex-1 p-4 overflow-auto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
          {sortedUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                gridColumn: 'span 1',
                visibility: expandedUserId === user.id ? 'hidden' : 'visible',
                opacity: expandedUserId !== null ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
                minWidth: '320px',
                width: '100%',
                maxWidth: '100%',
                position: 'relative'
              }}
            >
              <Card
                user={user}
                toggleFavorite={toggleFavorite}
                updateUser={handleCardUpdate}
                deleteUser={deleteUser}
                availableRings={availableRings}
                users={users}
                disconnectInterval={disconnectInterval}
                isExpanded={expandedUserId === user.id}
                onRingDisconnect={handleRingDisconnect}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Portal for modals */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        {/* Expanded card modal */}
        {expandedUserId !== null && (
          <div className="fixed inset-0 left-0 right-0" style={{ zIndex: 9998, pointerEvents: 'auto' }}>
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
            
            {sortedUsers.filter(user => user.id === expandedUserId).map((user) => (
              <div
                key={user.id}
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 9999 }}
              >
                <div 
                  className="absolute inset-0" 
                  onClick={() => handleCardUpdate(user, false)}
                />
                <Card
                  user={user}
                  toggleFavorite={toggleFavorite}
                  updateUser={handleCardUpdate}
                  deleteUser={deleteUser}
                  availableRings={availableRings}
                  users={users}
                  disconnectInterval={disconnectInterval}
                  isExpanded={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Ring disconnect modal */}
        {showRingDisconnectModal && selectedUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
            onClick={() => setShowRingDisconnectModal(false)}
          >
            <div 
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">링 해제</h3>
              <p className="mb-4">정말로 {selectedUser.name}님의 링을 해제하시겠습니까?</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowRingDisconnectModal(false)}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={handleRingDisconnectConfirm}
                >
                  해제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
