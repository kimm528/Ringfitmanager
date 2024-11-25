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

  // 심박수와 산소포화도 데이터를 user.data에서 가져오기
  const bpm = user.data?.bpm || 0;
  const oxygen = user.data?.oxygen || 0;

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
  } else if (bpmStatus === 'warning' || oxygenStatus === 'warning') {
    status = 'warning';
  } else {
    status = 'normal';
  }

  return status;
};

export const calculateSleepScore = (totalSleepDuration, deepSleepDuration, awakeDuration, shallowSleepDuration) => {
  if (
    totalSleepDuration !== 0 &&
    deepSleepDuration !== 0 &&
    awakeDuration !== 0 &&
    shallowSleepDuration !== 0
  ) {
    // 총 수면 시간, 깊은 수면 시간, 얕은 수면 시간, 깨어있는 시간에 가중치를 부여
    const totalSleepScore = (totalSleepDuration / 60 / 480.0) * 50; // 8시간(480분)을 기준으로 최대 50점
    const deepSleepScore = (deepSleepDuration / totalSleepDuration) * 30; // 깊은 수면 비율에 따라 최대 30점
    const awakePenalty = (awakeDuration / totalSleepDuration) * -20; // 깨어있는 시간은 최대 -20점 페널티
    const shallowSleepPenalty = (shallowSleepDuration / totalSleepDuration) * -10; // 얕은 수면은 최대 -10점 페널티

    // 총점 계산 (최대 100점)
    let sleepScore = totalSleepScore + deepSleepScore + awakePenalty + shallowSleepPenalty;

    // 점수는 0 ~ 100 사이로 보정
    sleepScore = Math.max(0, Math.min(100, sleepScore));

    return Math.round(sleepScore); // 정수로 반환
  } else {
    return 0;
  }
};