// calculateUserStatus.js
export const calculateUserStatus = (user) => {
  const OXYGEN_WARNING_THRESHOLD = 95;
  const OXYGEN_DANGER_THRESHOLD = 90;

  const thresholds = user.thresholds || {
    heartRateWarningLow: 80,
    heartRateWarningHigh: 120,
    heartRateDangerLow: 70,
    heartRateDangerHigh: 140,
  };

  // 옵셔널 체이닝을 사용하여 안전하게 접근
  const bpm = user.data?.bpm;
  const oxygen = user.data?.oxygen;

  // bpm 또는 oxygen 값이 null 또는 undefined인 경우 'no data' 상태로 간주
  if (bpm == null || oxygen == null) {
    return 'no data';
  }
  if (!bpm || !oxygen) {
    return 'no data';
  }
  let status = 'normal';

  if (
    (bpm > thresholds.heartRateDangerHigh || bpm < thresholds.heartRateDangerLow) ||
    oxygen < OXYGEN_DANGER_THRESHOLD
  ) {
    status = 'danger';
  } else if (
    (bpm > thresholds.heartRateWarningHigh || bpm < thresholds.heartRateWarningLow) ||
    oxygen < OXYGEN_WARNING_THRESHOLD
  ) {
    status = 'warning';
  }

  return status;
};
