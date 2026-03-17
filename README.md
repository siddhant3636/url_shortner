# URL Shortener with Redis Caching

A full-stack URL shortening service built with Node.js and Express. The primary focus of this project is system design and backend optimization, specifically handling high-traffic redirects without bottlenecking the database.

## System Architecture

* **Base62 Encoding:** Instead of generating random strings (which risk database collisions), this system uses a centralized MongoDB counter (`$inc`). That unique base-10 integer is converted into a Base62 string, guaranteeing unique short codes mathematically.
* **Read-Through Caching:** To minimize latency, URL redirects are served directly from a Redis cache (~2ms response time). 
* **Asynchronous Analytics:** On a cache hit, the user is redirected instantly while MongoDB updates click-tracking and telemetry data asynchronously in the background.
* **Cache Invalidation:** Soft-deleting a URL from the dashboard actively evicts the corresponding key from Redis to prevent ghost links.
* **Security:** Implements Redis-backed rate limiting, NoSQL injection sanitization, and strict input escaping to prevent XSS.

## Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose), Redis Cloud
* **Frontend:** EJS (Server-side rendering), Vanilla JS, CSS3
* **Security:** `express-validator`, `express-mongo-sanitize`, `bcryptjs`

## API Endpoints

**Auth**
* `POST /api/auth/signup` - Register a new user
* `POST /api/auth/login` - Authenticate and create session
* `GET /api/auth/logout` - Destroy session

**URLs**
* `POST /api/url` - Generate a new short URL
* `GET /api/url/:shortCode` - Redirect to original URL
* `GET /api/url/:id/analytics` - View click telemetry
* `DELETE /api/url/:id` - Soft-delete a URL

## Run Locally

If you'd like to run this project on your local machine, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/siddhant3602/url_shortner.git
   cd url_shortner