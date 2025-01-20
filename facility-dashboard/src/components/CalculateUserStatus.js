// src/utils/calculateUserStatus.js

export const calculateUserStatus = (user) => {
  if (!user || !user.data) return { status: 'normal', score: 0 };

  const sleepScore = calculateSleepScore(user.data);
  const status = {
    score: sleepScore,
    status: 'normal'
  };

  const data = user.data;
  const thresholds = user.thresholds || {
    heartRateWarningLow: 60,
    heartRateWarningHigh: 100,
    heartRateDangerLow: 50,
    heartRateDangerHigh: 110
  };

  // 심박수 체크
  if (data.bpm > 0) {
    if (data.bpm >= thresholds.heartRateDangerHigh || data.bpm <= thresholds.heartRateDangerLow) {
      status.status = 'danger';
    } else if (data.bpm >= thresholds.heartRateWarningHigh || data.bpm <= thresholds.heartRateWarningLow) {
      status.status = status.status === 'danger' ? 'danger' : 'warning';
    }
  }

  // 산소포화도 체크
  if (data.oxygen > 0) {
    if (data.oxygen < 90) {
      status.status = 'danger';
    } else if (data.oxygen < 95) {
      status.status = status.status === 'danger' ? 'danger' : 'warning';
    }
  }

  // 체온 체크
  if (data.temperature > 0) {
    if (data.temperature < 35 || data.temperature > 38) {
      status.status = 'danger';
    } else if (data.temperature < 36 || data.temperature > 37.5) {
      status.status = status.status === 'danger' ? 'danger' : 'warning';
    }
  }

  // 혈압 체크
  if (data.bloodPressure) {
    const { systolic, diastolic } = data.bloodPressure;
    if (systolic > 0 && diastolic > 0) {
      if (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60) {
        status.status = 'danger';
      } else if (systolic > 130 || systolic < 100 || diastolic > 85 || diastolic < 65) {
        status.status = status.status === 'danger' ? 'danger' : 'warning';
      }
    }
  }

  // 수면 점수 체크
  if (sleepScore > 0) {
    if (sleepScore < 30) {
      status.status = status.status === 'danger' ? 'danger' : 'danger';
    } else if (sleepScore < 50) {
      status.status = status.status === 'danger' ? 'danger' : 'warning';
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