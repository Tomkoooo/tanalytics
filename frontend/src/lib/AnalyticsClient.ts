interface EventParameters {
  [key: string]: string | number | object;
}

class AnalyticsClient {
  private apiUrl: string;
  private apiToken: string;
  private cookieText: string;
  private buttonText: string;
  public isCookiesAccepted: boolean;

  constructor(
    apiToken: string,
    cookieText: string = "This site uses cookies for analytics. Do you accept?",
    buttonText: string = "Accept"
  ) {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    this.apiToken = apiToken;
    this.cookieText = cookieText;
    this.buttonText = buttonText;
    this.isCookiesAccepted = typeof document !== "undefined" && document.cookie.includes("cookiesAccepted=true");
  }

  acceptCookies(): void {
    document.cookie = "cookiesAccepted=true; max-age=31536000";
    this.isCookiesAccepted = true;
  }

  // Új metódus: Lekéri a tokenhez tartozó oldalakat
  async getPages(): Promise<string[] | null> {
    try {
      const response = await fetch(`${this.apiUrl}/pages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": this.apiToken,
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error fetching pages: ${response.status}`);
      }
      const pages = await response.json();
      return pages as string[];
    } catch (error) {
      console.error(`Error fetching pages for token ${this.apiToken}:`, error);
      return null;
    }
  }

  async track(page: string, eventName: string, parameters: EventParameters = {}): Promise<void> {
    if (this.isCookiesAccepted) {
      try {
        const response = await fetch(`${this.apiUrl}/${page}/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": this.apiToken,
          },
          credentials: "include",
          body: JSON.stringify({ eventName, parameters }),
        });
        if (!response.ok) {
          throw new Error(`Track request failed: ${response.status}`);
        }
      } catch (error) {
        console.error(`Track error for ${page} (token: ${this.apiToken}):`, error);
      }
    }
  }

  async fetchData<T>(page: string, endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const query = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${this.apiUrl}/${page}/${endpoint}${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": this.apiToken,
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error fetching ${endpoint} for ${page}: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`Fetch error for ${endpoint} on ${page} (token: ${this.apiToken}):`, error);
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