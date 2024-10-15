// calculateUserStatus.js
export const calculateUserStatus = (user) => {
    const OXYGEN_WARNING_THRESHOLD = 95;
    const OXYGEN_DANGER_THRESHOLD = 90;
  
    const { bpm, oxygen } = user.data || {};
    const thresholds = user.thresholds || {
      heartRateWarningLow: 80,
      heartRateWarningHigh: 120,
      heartRateDangerLow: 70,
      heartRateDangerHigh: 140,
    };
  
    // 데이터가 없거나 0인 경우 'no data' 상태로 간주
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
  