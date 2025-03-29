Analitikai Rendszer Dokumentáció
Ez a projekt egy egyedi analitikai rendszert valósít meg, amely egy Next.js frontendből és egy Express backendből áll. Az események (pl. oldal megtekintések, gombnyomások, keresések) MongoDB-ben tárolódnak, és egy dashboardon keresztül követhetők, szűrhetők, grafikonokkal megjelenítve.

Projektstruktúra
express-server/: Backend szerver MongoDB-vel az adatok tárolására és feldolgozására.
next-analytics/: Frontend Next.js alkalmazás dashboarddal és analitikai klienssel.
Előfeltételek
Node.js (v16 vagy newer)
MongoDB (helyileg vagy felhőben futó instancia)
npm (csomagkezelő)
Telepítés
1. Express Szerver
Navigálj a szerver mappájába:
```bash

cd express-server
```

Telepítsd a függőségeket:
```bash

npm install
```
Hozz létre egy .env fájlt a következő tartalommal:
```env

NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MONGODB_URL=mongodb://localhost:27017/analytics
PORT=3001
MONGODB_URI=mongodb://localhost:27017/analytics
```
Módosítsd a MONGODB_URI-t, ha más MongoDB kapcsolatot használsz.
Indítsd el a szervert fejlesztői módban:
```bash
npm run dev
npm run analytics
```
