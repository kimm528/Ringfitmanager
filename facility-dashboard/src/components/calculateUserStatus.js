// src/utils/calculateUserStatus.js

export const calculateUserStatus = (user) => {
  // 산소포화도 임계값
  const OXYGEN_WARNING_THRESHOLD = 95;
  const OXYGEN_DANGER_THRESHOLD = 90;

  // 사용자 지정 심박수 임계값
  const thresholds = user.thresholds || {
    heartRateWarningLow: 80,
    heartRateWarningHigh: 120,
    heartRateDangerLow: 70,
    heartRateDangerHigh: 140,
  };

  // getLastNonZero 함수 (0을 제외하고 가장 최근의 값을 가져오기 위한 함수)
  const getLastNonZero = (arr) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== 0) {
        return arr[i];
      }
    }
    return 0;
  };

  // HeartRateArr와 MinBloodOxygenArr, MaxBloodOxygenArr에서 최신 값 가져오기
  const latestHeartRate = getLastNonZero(user.ring?.HeartRateArr || []);
  const bpm = latestHeartRate !== 0 ? latestHeartRate : user.data?.bpm || 0;

  const latestMinOxygen = getLastNonZero(user.ring?.MinBloodOxygenArr || []);
  const latestMaxOxygen = getLastNonZero(user.ring?.MaxBloodOxygenArr || []);
  const oxygen = (latestMinOxygen && latestMaxOxygen)
    ? Math.round((latestMinOxygen + latestMaxOxygen) / 2)
    : user.data?.oxygen || 0;

  // 데이터 유효성 검사
  if (bpm == null || oxygen == null) {
    return 'no data';
  }

  // 초기 상태
  let status = 'normal';

  // 심박수 상태 계산
  const bpmStatus = (() => {
    if (bpm === 0) {
      return 'normal';
    } else if (bpm <= thresholds.heartRateDangerLow || bpm >= thresholds.heartRateDangerHigh) {
      return 'danger';
    } else if (bpm <= thresholds.heartRateWarningLow || bpm >= thresholds.heartRateWarningHigh) {
      return 'warning';
    } else {
      return 'normal';
    }
  })();

  // 산소포화도 상태 계산
  const oxygenStatus = (() => {
    if (oxygen === 0) {
      return 'normal';
    } else if (oxygen < OXYGEN_DANGER_THRESHOLD) {
      return 'danger';
    } else if (oxygen < OXYGEN_WARNING_THRESHOLD) {
      return 'warning';
    } else {
      return 'normal';
    }
  })();

  // 전체 상태 결정 (가장 나쁜 상태로 설정)
  if (bpmStatus === 'danger' || oxygenStatus === 'danger') {
    status = 'danger';
  } else if (
    bpmStatus === 'warning' ||
    oxygenStatus === 'warning'
  ) {
    status = 'warning';
  } else {
    status = 'normal';
  }

  return status;
};
