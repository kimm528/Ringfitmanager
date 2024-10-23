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
  const stress = user.data?.stress;

  // 데이터 유효성 검사
  if (bpm == null || oxygen == null || stress == null) {
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

  // 스트레스 상태 계산 (0일 때 이미 정상으로 처리되므로 수정 불필요)
  const stressStatus = (() => {
    if (stress >= 66) {
      return 'danger';
    } else if (stress >= 33) {
      return 'warning';
    } else {
      return 'normal';
    }
  })();

  // 전체 상태 결정 (가장 나쁜 상태로 설정)
  if (bpmStatus === 'danger' || oxygenStatus === 'danger' || stressStatus === 'danger') {
    status = 'danger';
  } else if (
    bpmStatus === 'warning' ||
    oxygenStatus === 'warning' ||
    stressStatus === 'warning'
  ) {
    status = 'warning';
  } else {
    status = 'normal';
  }

  return status;
};
