"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Stat {
  _id: string;
  count: number;
  latest: string;
}

interface ChartComponentProps {
  data: Stat[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item._id,
    count: item.count,
  }));

  return (
    <LineChart width={600} height={300} data={chartData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#8884d8" />
    </LineChart>
  );
};

export default ChartComponent;