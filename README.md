# Restaurant Reservation System

A backend project using Node.js that enables users to book reservations at their favorite restaurant with ease.

## Features
- User registration and login
- Admin management
- Restaurant branch and table management
- Reservation creation, confirmation, and cancellation
- Stripe payment integration
- Email notifications for reservation updates
- Automated reminders and status updates

## Project Structure
server/ 
├── config/ # Configuration files 
├── controllers/ # Route controllers 
├── middlewares/ # Middleware functions 
├── migrations/ # Sequelize migrations 
├── models/ # Sequelize models 
├── routes/ # API routes 
├── services/ # External services (e.g., mailer, Stripe) 
├── utilities/ # Utility functions 
├── logs/ # Log files 
├── server.js # Entry point


## Prerequisites
- Node.js (v16+)
- PostgreSQL
- Docker (optional for containerization)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/attoh-ify/Restaurant-Reservation-System.git
   cd Restaurant-Reservation-System/server

2. Install dependencies:
   npm install

3. Set up the .env file:
  DB_USER=your_db_user
  DB_PASSWORD=your_db_password
  DB_NAME=your_db_name
  DB_HOST=localhost
  JWT_SECRET_KEY=your_jwt_secret
  STRIPE_PRIVATE_KEY=your_stripe_private_key
  STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
  EMAIL_ADDRESS=your_email
  EMAIL_PASSWORD=your_email_password
  EMAIL_NAME=your_email_name
  CLIENT_URL=http://localhost:3000
  PORT=5000

4. Run database migrations:
  npm run migrate

5. Start the server:
  npm run dev


API Endpoints
  Authentication
    POST /register/ - Register a new user
    POST /login/ - Log in a user
    POST /logout/ - Log out a user
  Admin
    POST /admin/create/ - Create an admin account
    POST /admin/login/ - Admin login
    POST /admin/logout/ - Admin logout
  Reservations
    POST /reservation/create/ - Create a reservation
    POST /reservation/status/ - Update reservation status
    DELETE /reservation/delete/ - Delete a reservation
  Tables
    POST /table/filter/ - Filter tables
    GET /table/get-table-schedule/ - Get table schedules

    
Testing
  Use tools like Postman or Insomnia to test the API endpoints.
Logging
  Logs are stored in the logs/ directory and rotated daily.
License
  This project is licensed under the ISC License.



