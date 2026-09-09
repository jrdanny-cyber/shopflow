# ShopFlow

ShopFlow is a full-stack e-commerce application built as a hands-on DevOps project for learning containerization, orchestration, CI/CD, security, observability, monitoring, and production deployment practices.

The application consists of a React frontend, Node.js/Express REST API, PostgreSQL database, Prometheus monitoring, and Grafana dashboards. The complete application is containerized with Docker and deployed using Docker Swarm.

---

## Architecture

```text
                        User
                          |
                          v
                  http://localhost:8080
                          |
                          v
                 +------------------+
                 |      Nginx       |
                 | React Frontend   |
                 +------------------+
                          |
                       /api/*
                          |
                          v
                 +------------------+
                 | Node.js/Express  |
                 |     Backend      |
                 |   2 replicas     |
                 +------------------+
                          |
                          v
                 +------------------+
                 |   PostgreSQL     |
                 |    Database      |
                 +------------------+

                          |
                    /metrics
                          |
                          v
                 +------------------+
                 |    Prometheus    |
                 +------------------+
                          |
                          v
                 +------------------+
                 |     Grafana      |
                 | Dashboards +     |
                 | Alerting         |
                 +------------------+
```

---

## Technology Stack

### Frontend

- React
- Vite
- Nginx
- ESLint

### Backend

- Node.js
- Express
- PostgreSQL `pg` driver
- Prometheus client
- Jest
- Supertest
- ESLint

### Database

- PostgreSQL 17

### DevOps & Infrastructure

- Docker
- Docker Compose
- Docker Swarm
- Git
- GitHub
- GitHub Actions
- Docker Secrets
- Prometheus
- Grafana

---

## Project Structure

```text
shopflow/
├── backend/
│   ├── src/
│   │   ├── _tests_/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── metrics.js
│   │   └── server.js
│   ├── Dockerfile
│   ├── eslint.config.mjs
│   ├── jest.config.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── postgres/
│   └── init.sql
│
├── prometheus/
│   └── prometheus.yml
│
├── grafana/
│   └── provisioning/
│       └── datasources/
│           └── prometheus.yml
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
├── docker-stack.yml
├── .gitignore
└── README.md
```

---

# Application Features

ShopFlow currently supports:

- Product listing
- Product inventory
- Order creation
- Order history
- Automatic stock reduction after orders
- PostgreSQL persistence
- Backend health checking
- API request logging
- Prometheus metrics
- Grafana monitoring
- Grafana alert rules

---

# REST API

## Application Status

```http
GET /
```

Returns information about the ShopFlow backend service.

---

## Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

The health endpoint verifies that the backend can communicate with PostgreSQL.

---

## Products

```http
GET /products
```

Returns the available ShopFlow products.

Example product:

```json
{
  "id": 1,
  "name": "Laptop Pro 15",
  "price": "1299.99",
  "stock": 25
}
```

---

## Orders

Create an order:

```http
POST /orders
```

Example request:

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1
    },
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

Retrieve orders:

```http
GET /orders
```

---

# Docker

Both the frontend and backend use multi-stage Docker builds.

The backend image performs linting during its build stage before producing the production image.

The frontend performs linting and creates the Vite production build before the resulting static files are served by Nginx.

---

# Docker Compose

Docker Compose can be used for local development and integration testing.

```bash
docker compose up --build
```

The application is then available at:

```text
Frontend:   http://localhost:8080
Backend:    http://localhost:3000
```

---

# Docker Swarm Deployment

ShopFlow is also deployed as a Docker Swarm stack.

Initialize Swarm if necessary:

```bash
docker swarm init
```

Deploy the stack:

```bash
docker stack deploy -c docker-stack.yml shopflow
```

Inspect services:

```bash
docker stack services shopflow
```

The stack currently contains:

```text
shopflow_frontend
shopflow_backend
shopflow_postgres
shopflow_prometheus
shopflow_grafana
```

The backend runs with multiple replicas to demonstrate service replication and load balancing.

---

# Rolling Updates

The backend service uses a rolling-update strategy.

The deployment configuration updates backend replicas gradually rather than stopping every instance simultaneously.

Example configuration:

```yaml
deploy:
  replicas: 2

  update_config:
    parallelism: 1
    delay: 10s
    order: start-first
    failure_action: rollback
```

This allows a new backend version to start before the old replica is removed.

---

# Automatic Rollback

ShopFlow was tested with an intentionally broken backend image.

When the new tasks failed to start, Docker Swarm automatically rolled the service back to the previous working version.

This demonstrates deployment resilience and failure recovery.

---

# Self-Healing

Docker Swarm self-healing was tested by manually removing a running backend container.

Swarm detected that the desired replica count was no longer satisfied and automatically created a replacement task.

The application remained available during the test.

---

# Docker Secrets

Database credentials used by the Swarm deployment are protected using Docker Secrets.

The PostgreSQL password is not stored directly in `docker-stack.yml`.

The backend reads the secret from:

```text
/run/secrets/shopflow_db_password
```

The application also retains an environment-variable fallback for local development and automated tests.

> Never commit database passwords, Gmail App Passwords, API keys, or other credentials to the repository.

---

# Database Security

PostgreSQL is accessible to the backend through the internal Docker network.

The production Swarm configuration does not require PostgreSQL port `5432` to be exposed publicly.

Conceptually:

```text
Internet
   X
   |
   | 5432 blocked
   |
PostgreSQL

Backend
   |
   | Internal Swarm network
   v
PostgreSQL:5432
```

---

# Testing

The backend uses:

- Jest
- Supertest

The test suite currently covers:

- Root API endpoint
- Health endpoint
- Successful order creation
- Invalid order rejection
- Order retrieval

Run tests with:

```bash
cd backend
npm test
```

A separate PostgreSQL test database is used to isolate automated tests from application data.

---

# Linting

Backend:

```bash
cd backend
npm run lint
```

Frontend:

```bash
cd frontend
npm run lint
```

Both frontend and backend linting are also incorporated into the container build and CI workflow.

---

# Continuous Integration

ShopFlow uses GitHub Actions for continuous integration.

The CI workflow validates changes by running checks such as:

```text
Push / Pull Request
        |
        v
   GitHub Actions
        |
        +---- Backend lint
        |
        +---- Backend tests
        |
        +---- Frontend lint
        |
        +---- Frontend build
        |
        +---- Docker image validation
```

This helps catch application and container build problems before deployment.

---

# Observability

ShopFlow exposes Prometheus-compatible application metrics through:

```http
GET /metrics
```

The backend collects both default Node.js metrics and custom HTTP metrics.

Custom metrics include:

```text
shopflow_http_requests_total
shopflow_http_request_duration_seconds
```

Labels include information such as:

```text
method
route
status_code
```

For example, metrics can distinguish traffic for:

```text
/products
/orders
/health
/metrics
```

and HTTP status codes such as:

```text
200
400
404
500
```

---

# Prometheus

Prometheus runs as part of the Docker Swarm stack and periodically scrapes the ShopFlow backend `/metrics` endpoint.

Prometheus is available locally at:

```text
http://localhost:9090
```

Example PromQL query:

```promql
shopflow_http_requests_total
```

Request rate by route:

```promql
sum(rate(shopflow_http_requests_total[5m])) by (route)
```

---

# Grafana

Grafana provides visualization and alerting for the metrics collected by Prometheus.

Grafana is available locally at:

```text
http://localhost:3001
```

Prometheus is automatically provisioned as a Grafana data source:

```text
Grafana
   |
   v
Prometheus
   |
   v
ShopFlow /metrics
```

---

# Grafana Dashboard

The current ShopFlow dashboard contains panels for:

### HTTP Request Rate by Route

```promql
sum(rate(shopflow_http_requests_total[5m])) by (route)
```

### Average HTTP Request Duration by Route

```promql
sum(rate(shopflow_http_request_duration_seconds_sum[5m])) by (route)
/
sum(rate(shopflow_http_request_duration_seconds_count[5m])) by (route)
```

### HTTP Request Rate by Status Code

```promql
sum(rate(shopflow_http_requests_total[5m])) by (status_code)
```

### HTTP Error Rate by Status Code

```promql
sum(rate(shopflow_http_requests_total{status_code=~"4..|5.."}[5m])) by (status_code)
```

Controlled traffic tests have been used to verify visualization of:

```text
200 OK
400 Bad Request
404 Not Found
500 Internal Server Error
```

---

# Grafana Alerting

A Grafana alert rule has been created for ShopFlow server errors.

The alert evaluates:

```promql
sum(rate(shopflow_http_requests_total{status_code=~"5.."}[5m]))
```

The rule triggers when:

```text
5xx request rate > 0
```

The alert currently evaluates as:

```text
Normal
```

when no server errors are occurring.

Notification delivery through a Grafana contact point is planned as a later enhancement.

---

# Monitoring Architecture

```text
                   ShopFlow Users
                         |
                         v
                 +---------------+
                 |     Nginx     |
                 |   Frontend    |
                 +---------------+
                         |
                         v
                 +---------------+
                 |    Backend    |
                 |   Replicas    |
                 +---------------+
                    |         |
                    |         +------> PostgreSQL
                    |
                    | /metrics
                    v
                 +---------------+
                 |  Prometheus   |
                 +---------------+
                         |
                         | PromQL
                         v
                 +---------------+
                 |    Grafana    |
                 +---------------+
                    |         |
                    |         +------> Dashboards
                    |
                    +----------------> Alert Rules
```

---

# Git Workflow

Development has used a branch-based workflow including:

```text
master
develop
feature/*
```

Features are implemented separately and merged into `develop` after validation.

Git is also used to track infrastructure changes alongside application code.

---

# What This Project Demonstrates

ShopFlow is designed to demonstrate practical DevOps concepts rather than only application development.

The project currently covers:

- Full-stack application development
- REST API development
- PostgreSQL persistence
- Docker containerization
- Multi-stage Docker builds
- Docker Compose
- Docker networking
- Docker Swarm orchestration
- Service replication
- Swarm load balancing
- Rolling deployments
- Automatic rollback
- Container self-healing
- Docker Secrets
- Database network isolation
- Health checks
- Automated testing
- Linting
- Git branching
- GitHub Actions CI
- Application logging
- Prometheus instrumentation
- PromQL
- Grafana dashboards
- HTTP traffic monitoring
- Latency monitoring
- Error monitoring
- Grafana alert rules

---

# Planned Improvements

Future ShopFlow improvements may include:

- Grafana email/Telegram notification delivery
- Persisted Grafana dashboard provisioning
- Improved per-replica Prometheus service discovery
- Additional latency percentiles such as p95/p99
- CPU and memory dashboards
- PostgreSQL monitoring
- Node/container infrastructure metrics
- Alert notification policies
- More comprehensive backend tests
- Frontend automated tests
- Load testing
- CI/CD deployment automation
- Container registry integration
- TLS/HTTPS
- Reverse-proxy hardening
- Multi-node Docker Swarm deployment
- Centralized logging
- Backup and recovery procedures

---

# Current Project Status

ShopFlow currently has a working end-to-end deployment:

```text
React
  ↓
Nginx
  ↓
Express API
  ↓
PostgreSQL
```

with an observability pipeline:

```text
Express Metrics
      ↓
Prometheus
      ↓
Grafana
      ↓
Dashboards + Alert Rules
```

The application has successfully demonstrated container orchestration, rolling updates, automatic rollback, self-healing, secret management, CI validation, application monitoring, controlled error generation, and Grafana alert evaluation.

---

## Author

**Daniel Gamo**

ShopFlow is being developed as a practical DevOps learning and portfolio project.