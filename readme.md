# Analytics Dashboard and Server
This project consists of an analytics dashboard and a corresponding server that manages statistics for multiple pages, each stored in separate MongoDB collections. The frontend is a Next.js application hosting the dashboard, while the server is a Node.js application that records events and provides statistics.

## Project Structure
 - **frontend/:** The Next.js-based client application containing the dashboard and the AnalyticsClient class.
- **server/:** The Node.js server that handles analytics data and communicates with MongoDB.

## Prerequisites
***Node.js:*** Version 16.x or newer (recommended: 18.x)
***MongoDB:*** A MongoDB Atlas cluster or a local MongoDB server
***npm:*** The package manager (typically installed with Node.js)

## Installation
1. Set Up Environment Variables
***server/.env***
Create a .env file in the server directory with the following content:

```env
MONGODB_URI=mongodb+srv://admin:admin@cluster0.tfml4.mongodb.net/analytics?retryWrites=true&w=majority
PORT=3001
```
Replace MONGODB_URI with your own MongoDB connection string.
PORT is optional; defaults to 3001.

***frontend/.env.local***
Create a .env.local file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```
This is the API URL connecting to the server. Update it if the server runs elsewhere.
2. Install Dependencies
***Server***
```bash

cd server
npm install
```
***Frontend***
```bash

cd frontend
npm install
```
3. Prepare Test Data
In the server directory, create test data files (e.g., test-data-clearsmile.json, test-data-regiadental.json) in the following format:

***server/test-data-clearsmile.json***
```json

[
  {
    "_id": "6604f1a2b8e4b2c3d4e5f6a1",
    "eventName": "page_view",
    "timestamp": "2025-03-27T08:15:00.000Z",
    "parameters": { "page": "/home", "userId": "user123" },
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
]
```
***server/test-data-regiadental.json***
```json

[
  {
    "_id": "6604f1a2b8e4b2c3d4e5f6b1",
    "eventName": "page_view",
    "timestamp": "2025-03-27T10:00:00.000Z",
    "parameters": { "page": "/contact", "userId": "user456" },
    "sessionId": "7d793037-a8b2-4f7e-9b9e-8e4f9d6c2b1a"
  }
]
```
## Running the Project
1. Start the Server
In the server directory, run:

```bash
cd server
npm run dev
```
Check the console: You should see "MongoDB connected" and "Analytics server running on port 3001".
The server will load test data if the respective collections are empty.

2. Start the Frontend
In a separate terminal, in the frontend directory:

```bash

cd frontend
npm run dev
```
Open your browser at: http://localhost:3000.

## Usage
 - ***Cookie Consent:***
On page load, a cookie consent popup appears (e.g., "This site uses cookies for analytics. Do you accept?").
Click "Accept" to enable tracking.
- ***Page Selection:***
Select either clearsmile or regiadental from the dropdown menu on the dashboard.
Data will automatically update based on the selected page's collection.
- ***Filters:***
Event Name: Filter by a specific event (e.g., page_view, button_click).
Session ID: Filter by unique sessions.
Date Range: Filter by start and end dates.
- ***Charts and Table:***
Time Series Chart: Displays the temporal distribution of events.
Statistics Chart: Shows unique sessions, identified users, and total clicks.
Events Table: Lists detailed event data.
- ***Test Click:***
Click the "Test Click" button to record a test_button_click event.
File Structure
server/
- ***analytics.js:*** The Node.js server code.
- ***test-data-*.json:*** Test data files for each page.
- ***.env:*** Environment variables.
frontend/
 - ***src/app/page.tsx:*** The dashboard component.
 - ***src/lib/AnalyticsClient.ts:*** The analytics client class.
 - ***src/components/ChartComponent.tsx:*** The statistics chart component.
 - ***.env.local:*** Environment variables.

## Using the AnalyticsClient Class

The AnalyticsClient class is designed to handle analytics tracking and data fetching for a specific page. Below is a brief guide on how to use it:

### Initialization
Create an instance of AnalyticsClient by providing the page name and optional cookie consent text:

```typescript

import AnalyticsClient from "@/lib/AnalyticsClient";

// Initialize with default English text
const client = new AnalyticsClient("clearsmile"); //where clearsmile is the page's name

// Initialize with custom text (e.g., Hungarian)
const clientHU = new AnalyticsClient(
  "clearsmile", //page name
  "Ez az oldal cookie-kat használ az analitikához. Elfogadod?", // cookie text
  "Elfogadom" // text on accept button for cookies
);
```
### Tracking Events
Use the track method to record events, but ensure cookies are accepted first:

```typescript

// Check if cookies are accepted
if (!client.isCookiesAccepted) {
  client.acceptCookies(); // Accept cookies programmatically
}

// Track an event
client.track("button_click", { buttonId: "submit", userId: "user123" });
```
### Fetching Data
Use the fetchData method to retrieve events or statistics:

```typescript

// Fetch events
const events = await client.fetchData<Event[]>("events", { eventName: "page_view" });
if (events) {
  console.log(events);
}

// Fetch stats
const stats = await client.fetchData<Stat[]>("stats");
if (stats) {
  console.log(stats);
}
```
### Cookie Consent
Access the cookie consent text and button text for display:

```typescript
console.log(client.getCookieText());    // "This site uses cookies for analytics. Do you accept?"
console.log(client.getButtonText());    // "Accept"

// In a React component:
<div>
  <p>{client.getCookieText()}</p>
  <button onClick={() => client.acceptCookies()}>{client.getButtonText()}</button>
</div>
```
### Notes
The isCookiesAccepted property indicates if cookies are accepted.
The track method only works if isCookiesAccepted is true.
Use TypeScript generics with fetchData to type the response (e.g., Event[], Stat[]).

## Features
Multi-Page Support: Tracks analytics for multiple pages (e.g., clearsmile, regiadental) in separate MongoDB collections.
Customizable Cookie Consent: Supports multiple languages by passing custom text to AnalyticsClient.
Interactive Dashboard: Filterable and visual analytics with charts and tables.

## Troubleshooting
MongoDB Connection Error: Verify your MONGODB_URI in server/.env. Ensure the cluster name (cluster0) and credentials are correct.
Missing Test Data: Ensure test-data-clearsmile.json and test-data-regiadental.json exist in the server directory.
API Errors: Check that the server is running on http://localhost:3001 and matches NEXT_PUBLIC_API_URL.

## Development
To add a new page, update the pages array in frontend/src/app/page.tsx and create a corresponding test-data-<page>.json file in server/.
To support additional languages, modify the cookieText and buttonText parameters when instantiating AnalyticsClient.