# VyOS Router Configuration UI

A modern web interface for configuring VyOS routers with AI-powered configuration generation and real-time SSH connectivity testing.

## Features

- 🎨 **Visual Topology Builder** - Drag-and-drop network topology creation
- 🤖 **AI Configuration Generation** - OpenAI-powered VyOS configuration suggestions
- 🔧 **Real-time Router Management** - SSH connectivity testing and configuration application
- 📊 **Interactive Dashboard** - Monitor router status and network topology
- 🔒 **Secure SSH Integration** - Support for password and key-based authentication

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- Python 3.8+ (for Netmiko fallback)
- VyOS router with SSH access enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gotofffromthebus/VyOSweb.git
   cd VyOSweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Install Python dependencies (for Netmiko)**
   ```bash
   pip install netmiko
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

### Adding a Router

1. Go to the **Topology** page
2. Click **Add Router** 
3. Fill in the connection details:
   - **Host**: Router IP address (e.g., `192.168.1.1`)
   - **Username**: SSH username (usually `vyos`)
   - **Password**: SSH password
   - **Port**: SSH port (default: 22)

4. Click **Test SSH** to verify connectivity
5. The router node will appear green if connected successfully

### Generating Configurations

1. Go to the **Configurations** page
2. Select a router from the dropdown
3. Enter your configuration requirements in natural language
4. Click **Generate with AI** to get VyOS configuration suggestions
5. Review and edit the generated configuration
6. Click **Apply to Router** to deploy the configuration

### Example Configuration

```
set system host-name 'my-router'
set interfaces ethernet eth0 address '192.168.1.1/24'
set service ssh port '22'
set service dhcp-server shared-network-name LAN subnet 192.168.1.0/24 default-router '192.168.1.1'
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── routes.ts          # API routes
│   ├── vyos.ts           # VyOS SSH integration
│   └── database.ts       # Database operations
├── shared/               # Shared types and utilities
└── public/              # Static assets
```

## API Endpoints

- `GET /api/topology` - Get network topology
- `POST /api/topology` - Update topology
- `GET /api/configurations` - Get saved configurations
- `POST /api/configurations` - Save configuration
- `POST /api/routers/check` - Test router connectivity
- `POST /api/routers/apply` - Apply configuration to router
- `POST /api/ai/generate` - Generate configuration with AI

## SSH Configuration

The application supports multiple SSH authentication methods:

1. **Password Authentication** - Standard username/password
2. **Key-based Authentication** - SSH key pairs
3. **Netmiko Fallback** - Python-based SSH client for complex scenarios

### VyOS SSH Setup

Ensure SSH is enabled on your VyOS router:

```bash
set service ssh port 22
set service ssh listen-address 0.0.0.0
commit
save
```

## Troubleshooting

### Common Issues

1. **"Apply to Router" button inactive**
   - Ensure router host, username, and configuration are filled
   - Check SSH connectivity with "Test SSH" button
   - Verify router is reachable from the server

2. **SSH connection timeouts**
   - Check network connectivity: `ping <router-ip>`
   - Verify SSH service is running: `telnet <router-ip> 22`
   - Ensure firewall allows SSH connections

3. **"all configuration authentication methods failed"**
   - Verify username and password are correct
   - Check if SSH key authentication is required
   - Try the Netmiko fallback (automatically used when SSH2 fails)

4. **404 errors on API endpoints**
   - Ensure server is running on port 5000
   - Check that API routes are registered before Vite middleware

### Network Requirements

- Server must be able to reach the router's IP address
- If server runs on `127.0.0.1`, ensure router is in the same network or configure routing
- SSH port 22 (or custom port) must be open and accessible

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

- `OPENAI_API_KEY` - Required for AI configuration generation
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review server logs for detailed error information
