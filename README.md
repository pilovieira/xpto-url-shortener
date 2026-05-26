# 🛠️ XPTO Tools

A collection of lightweight, high-performance developer utilities powered by Node.js, Express, and Redis.

![AI Dev Sweat & Tears](./public/xpto_tools_ai_humor.png)

> **AI-Powered Engineering at its Finest 🧠⚡**
> *This suite of tools was engineered using advanced artificial intelligence models utilizing billions of neural connections, thousands of GPU hours, and enough electrical power to light up a medium-sized city—all to deliver a super-efficient URL shortener and a Base58 utility. You're welcome.*

---

## 🚀 Included Tools

### 1. 🔗 URL Shortener
A fast, reliable URL shortening service using Redis for lightning-fast redirections.
- **Shorten URLs**: Easily generate short hashes for any target URL.
- **Analytics & Logs**: Detailed administration panel to track clicks, request referrers, user agents, and timestamps.
- **Admin Dashboard**: Secure administrative UI to view, create, and delete shortened links in real-time.

### 2. 🔠 Base58 Converter
An encoding/decoding utility using the Bitcoin-style Base58 alphabet (no lookalike characters like `0`, `O`, `I`, `l` to avoid human error).
- **Encoder**: Turn numeric database IDs or strings into compact, URL-safe Base58 tokens.
- **Decoder**: Translate Base58 hashes back to their original values instantly.

---

## 🛠️ Built With

* **Node.js** (v24+) - Core runtime
* **Express** - Fast, unopinionated web framework
* **Redis** (ioredis) - High-performance in-memory key-value database
* **HTML5 / CSS3** - Modern, custom dark-mode Glassmorphism UI (no heavy Tailwind, purely hand-crafted HSL styles)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and a Redis server running locally:
```bash
# Verify Node version
node -v

# Verify Redis is running
redis-cli ping
```

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd xpto-tools
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (optional, if using custom Redis credentials):
   ```env
   PORT=5000
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```

### Running the Application
To start the server:
```bash
npm start
```
The server will start on port `5000` (or your configured `PORT`).
- **Public Shortener UI**: `http://localhost:5000`
- **Admin Hub**: `http://localhost:5000/admin` (Default tools dashboard)

---

## 👨‍💻 Authors

* **Pilo Vieira** - *Initial Work & Architecture* - [GitHub](https://github.com/pilovieira) - [Website](http://pilovieira.com.br)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.