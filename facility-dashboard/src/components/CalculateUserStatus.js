// src/utils/calculateUserStatus.js

export const calculateUserStatus = (user) => {
  if (!user || !user.data) return 'normal';

  const sleepScore = calculateSleepScore(user.data);
  const status = {
    score: sleepScore,
    status: 'normal'
  };

  // 수면 점수에 따른 상태 결정 (0은 정상으로 처리)
  if (sleepScore > 0) {
    if (sleepScore < 30) {
      status.status = 'danger';
    } else if (sleepScore < 50) {
      status.status = 'warning';
    }
  }

  return status;
};

export const calculateSleepScore = (healthData) => {
  if (!healthData?.sleepData) return 0;

  const {
    totalSleepDuration = 0,
    deepSleepDuration = 0,
    awakeDuration = 0,
    shallowSleepDuration = 0
  } = healthData.sleepData;

  // 수면 효율 점수 (40점)
  const totalTime = totalSleepDuration;
  const sleepTime = totalTime - awakeDuration;
  const sleepEfficiencyScore = totalTime > 0 
    ? Math.min(40, Math.round((sleepTime / totalTime) * 40))
    : 0;

  // 수면 시간 적정성 점수 (30점)
  const optimalSleepDuration = 420; // 7시간 = 420분
  const durationScore = totalTime > 0
    ? Math.min(30, Math.round((totalTime / optimalSleepDuration) * 30))
    : 0;

  // 수면 구조 점수 (30점)
  const deepSleepRatio = totalTime > 0 ? (deepSleepDuration / totalTime) : 0;
  const optimalDeepSleepRatio = 0.225; // 이상적인 깊은 수면 비율 22.5%
  const structureScore = Math.min(30, Math.round((deepSleepRatio / optimalDeepSleepRatio) * 30));

  // 총점 계산
  const totalScore = sleepEfficiencyScore + durationScore + structureScore;

  return totalScore;
};