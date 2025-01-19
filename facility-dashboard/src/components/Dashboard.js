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

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex justify-between items-center p-4">
        {/* 상단 요소가 필요하면 추가 */}
      </div> 

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative">
          {sortedUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
              style={{
                gridColumn: 'span 1',
                visibility: expandedUserId === user.id ? 'hidden' : 'visible',
                opacity: expandedUserId !== null ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
                minWidth: '320px',
                width: '100%',
                maxWidth: '100%'
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
              />
            </motion.div>
          ))}
        </div>

        {/* 확장된 카드와 오버레이 */}
        {expandedUserId !== null && (
          <div className="fixed inset-0 left-0 right-0" style={{ zIndex: 9998 }}>
            <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm" />
            
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
      </div>
    </div>
  );
};

export default Dashboard;
