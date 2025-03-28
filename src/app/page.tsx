"use client";

import { useState, useEffect } from "react";
import AnalyticsClient from "@/lib/AnalyticsClient";
import ChartComponent from "@/components/ChartComponent";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Event {
  _id: string;
  eventName: string;
  timestamp: string;
  parameters: Record<string, string | number | object>;
  sessionId?: string; // Opcionálisra állítjuk, hogy kezeljük a hibás adatokat
}

interface Stat {
  _id: string;
  uniqueUsers: number;
  totalCount: number;
  identifiedUsers: number;
  latest: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [filters, setFilters] = useState({
    eventName: "",
    startDate: "",
    endDate: "",
    sessionId: "",
  });
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [uniqueSessions, setUniqueSessions] = useState<string[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);

  useEffect(() => {
    setShowCookieConsent(!document.cookie.includes("cookiesAccepted"));
  }, []);

  const fetchEvents = async () => {
    const data = await AnalyticsClient.fetchData<Event[]>("events", filters);
    if (Array.isArray(data)) {
      setEvents(data);
      setUniqueSessions([...new Set(data.map((e) => e.sessionId || "Ismeretlen"))]);
    } else {
      setEvents([]);
      setUniqueSessions([]);
    }
  };

  const fetchStats = async () => {
    const data = await AnalyticsClient.fetchData<Stat[]>("stats", filters);
    if (Array.isArray(data)) {
      setStats(data);
      setEventNames([...new Set(data.map((s) => s._id))]);
    } else {
      setStats([]);
      setEventNames([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleTestClick = () => {
    AnalyticsClient.track("test_button_click", { page: "dashboard", userId: "testUser" });
  };

  const handleAcceptCookies = () => {
    document.cookie = "cookiesAccepted=true; max-age=31536000";
    setShowCookieConsent(false);
  };

  const timeSeriesData = events
    .filter((e) => !filters.eventName || e.eventName === filters.eventName)
    .reduce((acc, event) => {
      const date = new Date(event.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(timeSeriesData).map(([date, count]) => ({ date, count }));

  return (
    <div className="dashboard-container">
      {showCookieConsent && (
        <div className="cookie-consent">
          <p>Ez az oldal cookie-kat használ az analitikához. Elfogadod?</p>
          <button onClick={handleAcceptCookies}>Elfogadom</button>
        </div>
      )}

      <h1>Analitikai Dashboard</h1>

      <div className="filter-form">
        <select name="eventName" value={filters.eventName} onChange={handleFilterChange}>
          <option value="">Összes esemény</option>
          {eventNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select name="sessionId" value={filters.sessionId} onChange={handleFilterChange}>
          <option value="">Összes session</option>
          {uniqueSessions.map((id) => (
            <option key={id} value={id}>{id.slice(0, 8)}...</option>
          ))}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
        <button onClick={handleTestClick}>Teszt kattintás</button>
      </div>

      <h2>Események időbeli használata</h2>
      <div className="chart-container">
        {chartData.length > 0 ? (
          <LineChart width={600} height={300} data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#1a73e8" name="Események száma" />
          </LineChart>
        ) : (
          <p>Nincs időbeli adat</p>
        )}
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
              <th>Session ID</th>
              <th>User ID</th>
              <th>Paraméterek</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event._id}>
                <td>{event.eventName}</td>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{event.sessionId ? `${event.sessionId.slice(0, 8)}...` : "Ismeretlen"}</td>
                <td>{(event.parameters.userId as string) || "Nincs"}</td>
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