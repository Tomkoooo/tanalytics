interface EventParameters {
  [key: string]: string | number | object;
}

class AnalyticsClient {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/";
  }

  async track(eventName: string, parameters: EventParameters = {}): Promise<void> {
    await fetch(`${this.apiUrl}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, parameters }),
    });
  }

  async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${this.apiUrl}/${endpoint}${query ? `?${query}` : ""}`);
    return response.json();
  }
}

export default new AnalyticsClient();