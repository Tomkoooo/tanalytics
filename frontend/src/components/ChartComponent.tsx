"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Stat {
  _id: string;
  uniqueUsers: number;
  totalCount: number;
  identifiedUsers: number;
  latest: string;
}

interface ChartComponentProps {
  data: Stat[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item._id,
    uniqueUsers: item.uniqueUsers,
    totalCount: item.totalCount,
    identifiedUsers: item.identifiedUsers,
  }));

  return (
    <LineChart width={600} height={300} data={chartData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="uniqueUsers" stroke="#1a73e8" name="Egyedi sessionök" />
      <Line type="monotone" dataKey="identifiedUsers" stroke="#28a745" name="Azonosított felhasználók" />
      <Line type="monotone" dataKey="totalCount" stroke="#ff9800" name="Összes kattintás" />
    </LineChart>
  );
};

export default ChartComponent;