// calculateUserStatus.js
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

  // 데이터 접근
  const bpm = user.data?.bpm;
  const oxygen = user.data?.oxygen;

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
