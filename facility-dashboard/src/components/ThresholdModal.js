import React from 'react';
import ReactSlider from 'react-slider';

const ThresholdModal = ({ 
  thresholds, 
  setThresholds, 
  user, 
  updateUser, 
  setShowThresholdModal,
  modalRef 
}) => {
  return (
    <div 
      className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        e.stopPropagation();
        setShowThresholdModal(false);
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg p-6 relative mx-4"
        style={{ maxHeight: '90%', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={() => setShowThresholdModal(false)}
        >
          ×
        </button>
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
      </div>
    </div>
  );
};

export default ThresholdModal; 