# Half & Full - Restaurant Menu

## Included
- Responsive customer menu
- Search
- Category filter
- Sort by price/name
- Every item always has an image
- Admin login
- Add item
- Upload image
- Edit item
- Change half/full price
- Hide/show item
- Delete item
- SQLite + Prisma
- JWT authentication

## Run backend

cd server
npm install

Copy `.env.example` to `.env`, then:

npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev

## Run frontend

Open a second terminal:

cd client
npm install
npm run dev

Open http://localhost:5173

## Admin

Username: admin
Password: admin123

Change the password before deploying publicly.

The seed creates placeholder images for every menu item so no item is missing an image. Replace them with real dish photos through the Admin Panel.
