interface EventParameters {
  [key: string]: string | number | object;
}

class AnalyticsClient {
  private apiUrl: string;
  private page: string;
  private cookieText: string;
  private buttonText: string;
  public isCookiesAccepted: boolean;

  constructor(page: string, cookieText: string = "This site uses cookies for analytics. Do you accept?", buttonText: string = "Accept") {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    this.page = page;
    this.cookieText = cookieText;
    this.buttonText = buttonText;
    this.isCookiesAccepted = typeof document !== "undefined" && document.cookie.includes("cookiesAccepted=true");
  }

  acceptCookies(): void {
    document.cookie = "cookiesAccepted=true; max-age=31536000"; // 1 év
    this.isCookiesAccepted = true;
  }

  async track(eventName: string, parameters: EventParameters = {}): Promise<void> {
    if (this.isCookiesAccepted) {
      try {
        const response = await fetch(`${this.apiUrl}/${this.page}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ eventName, parameters }),
        });
        if (!response.ok) {
          throw new Error(`Track kérés sikertelen: ${response.status}`);
        }
      } catch (error) {
        console.error(`Track hiba az ${this.page} oldalon:`, error);
      }
    }
  }

  async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const query = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${this.apiUrl}/${this.page}/${endpoint}${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Hiba a ${endpoint} lekérdezésében az ${this.page} oldalon: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Fetch hiba az ${endpoint} endpointon az ${this.page} oldalon:`, error);
      return null;
    }
  }

  getCookieText(): string {
    return this.cookieText;
  }

  getButtonText(): string {
    return this.buttonText;
  }
}

export default AnalyticsClient;