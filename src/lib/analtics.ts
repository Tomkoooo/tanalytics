class AnalyticsClient {
    private apiUrl: string;
    constructor() {
      this.apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    }
  
    async track(eventName: string, parameters = {}) {
      await fetch(`${this.apiUrl}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, parameters }),
      });
    }
  
    async fetchData(endpoint: string, params = {}) {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${this.apiUrl}/${endpoint}${query ? `?${query}` : ""}`);
      return response.json();
    }
  }
  
  export default new AnalyticsClient();