import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

type Datum = Record<string, string | number>;
type Series = { key: string; label: string; color?: string };
const PALETTE = [
  "#007FFF",
  "#1A8CFF",
  "#4DA5FF",
  "#66B2FF",
  "#99CCFF",
  "#B3D9FF",
];
const cardClass = "rounded-2xl border border-border bg-card shadow-sm";

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`${cardClass} ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function Empty({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-sm text-muted-foreground"
    >
      No data yet.
    </div>
  );
}

export function AreaChartCard({
  title,
  description,
  data,
  xAxisKey,
  series,
  height = 200,
  className,
  xAxisInterval,
  footer,
}: {
  title: string;
  description?: string;
  data: Datum[];
  xAxisKey: string;
  series: Series[];
  height?: number;
  className?: string;
  xAxisInterval?: number;
  footer?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <ChartCard title={title} description={description} className={className}>
      {data.length === 0 ? (
        <Empty height={height} />
      ) : (
        <>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={xAxisKey}
                  interval={xAxisInterval}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <defs>
                  {series.map((s) => (
                    <linearGradient
                      key={s.key}
                      id={`fill-${id}-${s.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={s.color ?? PALETTE[0]}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={s.color ?? PALETTE[0]}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                {series.map((s) => (
                  <Area
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    type="monotone"
                    stroke={s.color ?? PALETTE[0]}
                    fill={`url(#fill-${id}-${s.key})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {footer && (
            <p className="mt-3 text-sm text-muted-foreground">{footer}</p>
          )}
        </>
      )}
    </ChartCard>
  );
}

export function LineChartCard({
  title,
  description,
  data,
  xAxisKey,
  series,
  height = 200,
  className,
}: {
  title: string;
  description?: string;
  data: Datum[];
  xAxisKey: string;
  series: Series[];
  height?: number;
  className?: string;
}) {
  return (
    <ChartCard title={title} description={description} className={className}>
      {data.length === 0 ? (
        <Empty height={height} />
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  type="monotone"
                  stroke={s.color ?? PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function BarChartCard({
  title,
  description,
  data,
  xAxisKey,
  series,
  height = 200,
  className,
}: {
  title: string;
  description?: string;
  data: Datum[];
  xAxisKey: string;
  series: Series[];
  height?: number;
  className?: string;
}) {
  return (
    <ChartCard title={title} description={description} className={className}>
      {data.length === 0 ? (
        <Empty height={height} />
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color ?? PALETTE[i % PALETTE.length]}
                  radius={4}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function DonutChartCard({
  title,
  data,
  centerLabel = "Total",
}: {
  title: string;
  data: { category: string; value: number; color?: string }[];
  centerLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className={`${cardClass} flex flex-col`}>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-80 flex-1 items-center justify-center pb-0">
        {data.length === 0 ? (
          <Empty height={240} />
        ) : (
          <div className="h-70 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="52%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.category}
                      fill={item.color ?? PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="44%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-xl font-bold"
                >
                  {total.toLocaleString()}
                </text>
                <text
                  x="50%"
                  y="53%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-xs"
                >
                  {centerLabel}
                </text>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
