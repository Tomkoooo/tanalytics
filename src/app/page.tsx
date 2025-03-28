"use client";

import { useState, useEffect } from "react";
import AnalyticsClient from "@/lib/AnalyticsClient";
import ChartComponent from "@/components/ChartComponent";

interface Event {
  _id: string;
  eventName: string;
  timestamp: string;
  parameters: Record<string, string | number | object>;
}

interface Stat {
  _id: string;
  count: number;
  latest: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [filters, setFilters] = useState({
    eventName: "",
    startDate: "",
    endDate: "",
  });

  const fetchEvents = async () => {
    const data = await AnalyticsClient.fetchData<Event[]>("events", filters);
    if (Array.isArray(data)) {
      setEvents(data);
    } else {
      console.error("Events nem tömb:", data);
      setEvents([]);
    }
  };

  const fetchStats = async () => {
    const data = await AnalyticsClient.fetchData<Stat[]>("stats", filters);
    if (Array.isArray(data)) {
      setStats(data);
    } else {
      console.error("Stats nem tömb:", data);
      setStats([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleTestClick = () => {
    AnalyticsClient.track("test_button_click", { page: "dashboard" });
  };

  return (
    <div className="dashboard-container">
      <h1>Analitikai Dashboard</h1>

      <div className="filter-form">
        <input
          type="text"
          name="eventName"
          placeholder="Esemény neve"
          value={filters.eventName}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <button onClick={handleTestClick}>Teszt kattintás</button>
      </div>

      <h2>Események statisztikája</h2>
      <div className="chart-container">
        {stats.length > 0 ? <ChartComponent data={stats} /> : <p>Nincs statisztika adat</p>}
      </div>

      <h2>Események</h2>
      {events.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Esemény neve</th>
              <th>Időpont</th>
              <th>Paraméterek</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event._id}>
                <td>{event.eventName}</td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{JSON.stringify(event.parameters)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nincs esemény adat</p>
      )}
    </div>
  );
}