interface EventParameters {
  [key: string]: string | number | object;
}

class AnalyticsClient {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }

  async track(eventName: string, parameters: EventParameters = {}): Promise<void> {
    if (document.cookie.includes("cookiesAccepted=true")) {
      try {
        const response = await fetch(`${this.apiUrl}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ eventName, parameters }),
        });
        if (!response.ok) {
          throw new Error(`Track kérés sikertelen: ${response.status}`);
        }
      } catch (error) {
        console.error("Track hiba:", error);
      }
    }
  }

  async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const query = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${this.apiUrl}/${endpoint}${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Hiba a ${endpoint} lekérdezésében: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Fetch hiba az ${endpoint} endpointon:`, error);
      return null; // Null visszaadása hiba esetén
    }
  }
}

export default new AnalyticsClient();