<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Land Registry System</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      text-align: center;
      background-color: #fff;
      color: #1a1a1a;
      margin: 0;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      font-weight: 800;
    }
    em {
      font-size: 1.2rem;
      color: #555;
    }
    .badges {
      margin: 1.5rem 0;
    }
    .badges img {
      margin: 0.25rem;
    }
    .tech-stack {
      font-style: italic;
      font-size: 1.2rem;
      margin: 2rem 0 1rem;
    }
    .features {
      max-width: 800px;
      margin: auto;
      text-align: left;
      font-size: 1rem;
      line-height: 1.8;
    }
    .section {
      margin-top: 3rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      text-align: left;
    }
    .section h2 {
      font-size: 1.8rem;
      margin-bottom: 1rem;
    }
    .sub-section {
      margin-top: 1.5rem;
    }
    .sub-section h3 {
      font-size: 1.2rem;
      margin-bottom: 0.25rem;
    }
    code {
      background: #eee;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <h1>LAND-REGISTRY-SYSTEM</h1>
  <em>Transforming Land Ownership with Seamless Innovation</em>

  <div class="badges">
    <img src="https://img.shields.io/badge/last%20commit-today-blue?style=flat&logo=git" alt="last commit">
    <img src="https://img.shields.io/badge/javascript-99.5%25-blue?logo=javascript" alt="javascript">
    <img src="https://img.shields.io/badge/languages-4-informational?logo=code" alt="languages">
  </div>

  <div class="tech-stack">Built with the tools and technologies:</div>

  <div class="badges">
    <img src="https://img.shields.io/badge/Express-black?logo=express&logoColor=white" alt="Express">
    <img src="https://img.shields.io/badge/JSON-000000?logo=json&logoColor=white" alt="JSON">
    <img src="https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white" alt="Markdown">
    <img src="https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=white" alt="npm">
    <img src="https://img.shields.io/badge/Autoprefixer-DD3735?logo=autoprefixer&logoColor=white" alt="Autoprefixer">
    <img src="https://img.shields.io/badge/Mongoose-880000?logo=mongoose&logoColor=white" alt="Mongoose">
    <img src="https://img.shields.io/badge/PostCSS-DD3A0A?logo=postcss&logoColor=white" alt="PostCSS">
    <img src="https://img.shields.io/badge/.ENV-FCE566?logo=dotenv&logoColor=black" alt=".ENV">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
    <img src="https://img.shields.io/badge/Nodemon-76D04B?logo=nodemon&logoColor=white" alt="Nodemon">
    <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Formik-007ACC?logo=formik" alt="Formik">
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary">
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/bat-FFCC33?logo=babel&logoColor=black" alt="bat">
    <img src="https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white" alt="ESLint">
    <img src="https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white" alt="Axios">
    <img src="https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white" alt="Chart.js">
    <img src="https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white" alt="Jest">
  </div>

  <div class="features">
    <p>✨ <strong>Transforming Land Ownership with Seamless Innovation</strong></p>
    <ul>
      <li>🏛️ <strong>Government-Grade Security</strong> - Role-based access control and authentication</li>
      <li>📄 <strong>Document Management</strong> - GridFS storage with verification workflows</li>
      <li>💳 <strong>Payment Integration</strong> - Secure Chapa payment gateway integration</li>
      <li>🗺️ <strong>Interactive Maps</strong> - Leaflet-based property visualization</li>
      <li>⚖️ <strong>Legal Compliance</strong> - Ethiopian property law standards</li>
      <li>📊 <strong>Comprehensive Reporting</strong> - Real-time analytics and audit trails</li>
    </ul>
  </div>

  <div class="section">
    <h2>📘 Overview</h2>
    <p><strong>land-registry-system</strong> is an all-in-one developer toolkit for building secure, scalable land registration and property management platforms. It automates environment setup, manages complex workflows, and integrates with external payment gateways to streamline property transactions.</p>
    <ul>
      <li>🛠️ <strong>Automated Startup Orchestration</strong> – Launches multiple services for development</li>
      <li>🔒 <strong>Role-Based Security</strong> – Middleware, authentication, and authorization</li>
      <li>📂 <strong>Document & Payment Management</strong> – GridFS, Chapa integration</li>
      <li>📊 <strong>Logging & Reporting</strong> – Audit logs and real-time reporting</li>
      <li>⚙️ <strong>Configurable Architecture</strong> – Env vars, port configs, and API endpoints</li>
    </ul>
  </div>

  <div class="section">
    <h2>🏗️ System Architecture</h2>

    <div class="sub-section">
      <h3>🏛️ Land Officer Portal</h3>
      <ul>
        <li><strong>Purpose:</strong> Admin interface for officials</li>
        <li><strong>Users:</strong> Land officers, administrators</li>
        <li><strong>Features:</strong> Verification, approval, reporting</li>
        <li><strong>Access:</strong> <code>http://localhost:3000</code></li>
      </ul>
    </div>

    <div class="sub-section">
      <h3>👥 Citizen Portal</h3>
      <ul>
        <li><strong>Purpose:</strong> Public interface</li>
        <li><strong>Users:</strong> Property owners, citizens</li>
        <li><strong>Features:</strong> Registration, document upload, Chapa payment</li>
        <li><strong>Access:</strong> <code>http://localhost:3002</code></li>
      </ul>
    </div>
  </div>
<div class="section">
  <h2>⚙️ Prerequisites</h2>
  <ul>
    <li>Node.js v16+</li>
    <li>MongoDB v5+</li>
    <li>Git</li>
  </ul>
</div>

<div class="section">
  <h2>🚀 1-Minute Setup</h2>
  <pre><code>
# Clone the repository
git clone https://github.com/your-repo/land-registry-system.git
cd land-registry-system

# Start development environment (Windows)
./start-dev.bat

# Start development environment (Linux/Mac)
chmod +x start-dev.sh && ./start-dev.sh
  </code></pre>
</div>

<div class="section">
  <h2>🌐 Access the Applications</h2>
  <ul>
    <li><strong>Land Officer Portal</strong>: <code>http://localhost:3000</code></li>
    <li><strong>User Portal</strong>: <code>http://localhost:3002</code></li>
  </ul>
</div>
</body>
</html>
