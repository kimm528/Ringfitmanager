// src/components/Dashboard.js

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Card from './Card';
import { calculateUserStatus } from './CalculateUserStatus';
import { motion } from 'framer-motion';
import { Grid, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';

const Dashboard = ({
  showModal,
  setShowModal,
  users,
  searchQuery,
  handleAddUser,
  updateUser,
  deleteUser,
  availableRings,
  toggleFavorite,
  disconnectInterval,
  getNewId,
  sortOption
}) => {
  const gridRef = useRef();
  const [gridKey, setGridKey] = useState(0);

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
    const filtered = users.filter((user) =>
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    const usersWithStatus = filtered.map((user) => ({
      ...user,
      status: calculateUserStatus(user),
    }));
  
    usersWithStatus.sort((a, b) => {
      if (a.status === 'danger' && b.status !== 'danger') {
        return -1;
      } else if (b.status === 'danger' && a.status !== 'danger') {
        return 1;
      } else {
        return sortByOption(a, b);
      }
    });
  
    return usersWithStatus;
  }, [users, searchQuery, sortOption, sortByOption]);

  // 그리드 강제 업데이트 함수
  const forceGridUpdate = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.recomputeGridSize();
      setGridKey(prev => prev + 1);
    }
  }, []);

  // 창 크기 변경 이벤트 리스너
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        forceGridUpdate();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [forceGridUpdate]);

  // AutoSizer의 onResize 핸들러
  const handleAutoSizerResize = useCallback(() => {
    requestAnimationFrame(() => {
      forceGridUpdate();
    });
  }, [forceGridUpdate]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center">
        {/* 상단 요소가 필요하면 추가 */}
      </div> 

      <div className="dashboard-container flex-grow overflow-y-auto overflow-x-hidden">
        <AutoSizer onResize={handleAutoSizerResize}>
          {({ width, height }) => {
            const margin = 5;
            const minColumnWidth = 380;
            const isMobile = width <= 768;

            // 모바일일 때는 한 열로 표시하고 카드 너비를 화면에 맞게 조정
            const columnCount = isMobile ? 1 : Math.max(1, Math.floor((width + margin) / (minColumnWidth + margin)));

            const columnWidth = isMobile 
              ? Math.min(minColumnWidth, width - (margin * 2)) // 모바일에서는 화면 너비에 맞춤
              : Math.floor((width - margin * (columnCount + 1)) / columnCount);

            const rowHeight = 500 + margin;
            const rowCount = Math.ceil(sortedUsers.length / columnCount);

            const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
              const index = rowIndex * columnCount + columnIndex;
              if (index >= sortedUsers.length) {
                return null;
              }
              const user = sortedUsers[index];
              return (
                <div
                  key={key}
                  style={{
                    ...style,
                    left: isMobile ? margin : style.left + margin,
                    top: style.top + margin,
                    width: columnWidth,
                    height: rowHeight - margin,
                    padding: '8px',
                  }}
                >
                  <motion.div
                    layout
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Card
                      user={user}
                      toggleFavorite={toggleFavorite}
                      updateUser={updateUser}
                      deleteUser={deleteUser}
                      availableRings={availableRings}
                      users={users}
                      disconnectInterval={disconnectInterval}
                    />
                  </motion.div>
                </div>
              );
            };

            return (
              <Grid
                key={gridKey}
                ref={gridRef}
                cellRenderer={cellRenderer}
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
                overscanRowCount={5}
              />
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Dashboard;
