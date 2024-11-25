import { Rectangle } from 'recharts';

const CustomBar = (props) => {
  const { x, y, width, height, fill, value, warningLow, dangerLow, warningHigh, dangerHigh } = props;

  return (
    <g>
      {/* 기본 바 */}
      <Rectangle x={x} y={y} width={width} height={height} fill={fill} />

      {/* 임계값 선 그리기 */}
      {/* 경고 하한선 */}
      {warningLow && (
        <line
          x1={x}
          x2={x + width}
          y1={props.y + props.height - (warningLow / props.yAxisMax) * props.height}
          y2={props.y + props.height - (warningLow / props.yAxisMax) * props.height}
          stroke="#ff9800"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
      {/* 위험 하한선 */}
      {dangerLow && (
        <line
          x1={x}
          x2={x + width}
          y1={props.y + props.height - (dangerLow / props.yAxisMax) * props.height}
          y2={props.y + props.height - (dangerLow / props.yAxisMax) * props.height}
          stroke="#f44336"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
      {/* 경고 상한선 */}
      {warningHigh && (
        <line
          x1={x}
          x2={x + width}
          y1={props.y + props.height - (warningHigh / props.yAxisMax) * props.height}
          y2={props.y + props.height - (warningHigh / props.yAxisMax) * props.height}
          stroke="#ff9800"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
      {/* 위험 상한선 */}
      {dangerHigh && (
        <line
          x1={x}
          x2={x + width}
          y1={props.y + props.height - (dangerHigh / props.yAxisMax) * props.height}
          y2={props.y + props.height - (dangerHigh / props.yAxisMax) * props.height}
          stroke="#f44336"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
    </g>
  );
};
