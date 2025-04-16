import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS, COMPONENT_STYLES } from '@/styles/theme';

// Формат данных для отображения в графике
type ChartDataItem = {
  subject: string;
  value: number;
}

interface Props {
  data: ChartDataItem[] | any;
  title?: string;
  style?: React.CSSProperties;
}

export const BalanceWheelChart: React.FC<Props> = ({ data, title = "Колесо баланса", style }) => {
  // Если данные уже в правильном формате (массив объектов с subject и value)
  const chartData = Array.isArray(data) && data[0]?.subject 
    ? data 
    : [
        { subject: 'Физическое здоровье', value: data.physical || 0 },
        { subject: 'Эмоциональное состояние', value: data.emotional || 0 },
        { subject: 'Интеллектуальное развитие', value: data.intellectual || 0 },
        { subject: 'Духовное развитие', value: data.spiritual || 0 },
        { subject: 'Профессиональный рост', value: data.occupational || 0 },
        { subject: 'Социальные отношения', value: data.social || 0 },
        { subject: 'Окружающая среда', value: data.environmental || 0 },
        { subject: 'Финансовое благополучие', value: data.financial || 0 },
      ];

  return (
    <Card style={{...COMPONENT_STYLES.card, ...style, width: '100%', height: '100%'}}>
      <CardHeader className="pb-2">
        <CardTitle style={{ color: COLORS.textColor, fontSize: '1.5rem' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[900px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 100, right: 100, bottom: 100, left: 100 }}>
              <PolarGrid stroke={COLORS.borderColor} strokeWidth={1.5} />
              <PolarAngleAxis
                dataKey="subject"
                tick={props => {
                  const { x, y, payload, textAnchor, fontSize = 16 } = props;
                  // Разбиваем длинный текст на две строки при необходимости
                  const text = payload.value;
                  const words = text.split(' ');
                  
                  if (words.length <= 1) {
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor={textAnchor} fill={COLORS.textColor} fontSize={fontSize} fontWeight="500">
                          {text}
                        </text>
                      </g>
                    );
                  }
                  
                  // Разделяем текст на две части примерно посередине
                  const midpoint = Math.floor(words.length / 2);
                  const line1 = words.slice(0, midpoint).join(' ');
                  const line2 = words.slice(midpoint).join(' ');
                  
                  // Определяем отступы в зависимости от положения текста
                  const clockPos = (Math.atan2(y - 450, x - 450) * 180 / Math.PI + 360) % 360;
                  const isTop = clockPos > 45 && clockPos < 135;
                  const isBottom = clockPos > 225 && clockPos < 315;
                  const isLeft = clockPos > 135 && clockPos < 225;
                  const isRight = clockPos > 315 || clockPos < 45;
                  
                  let dy1 = 0;
                  let dy2 = 20;
                  
                  if (isTop) {
                    dy1 = -5;
                    dy2 = 15;
                  } else if (isBottom) {
                    dy1 = 0;
                    dy2 = 20;
                  }
                  
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text 
                        x={0} 
                        y={0} 
                        dy={dy1} 
                        textAnchor={textAnchor} 
                        fill={COLORS.textColor} 
                        fontSize={fontSize} 
                        fontWeight="500"
                      >
                        {line1}
                      </text>
                      <text 
                        x={0} 
                        y={0} 
                        dy={dy2} 
                        textAnchor={textAnchor} 
                        fill={COLORS.textColor} 
                        fontSize={fontSize} 
                        fontWeight="500"
                      >
                        {line2}
                      </text>
                    </g>
                  );
                }}
                tickSize={25}
                axisLine={{ stroke: COLORS.borderColor, strokeWidth: 2 }}
                tickLine={{ stroke: COLORS.borderColor }}
              />
              <Radar
                name="Баланс"
                dataKey="value"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.7}
                dot={{ stroke: COLORS.primary, strokeWidth: 3, r: 8, fill: "#fff" }}
                strokeWidth={3}
              />
              <Tooltip
                contentStyle={{
                  ...COMPONENT_STYLES.chart.tooltip.contentStyle,
                  fontSize: '16px',
                  padding: '10px 14px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend 
                wrapperStyle={{ color: COLORS.textColor, fontWeight: 'bold', paddingTop: '15px' }}
                iconSize={18}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 