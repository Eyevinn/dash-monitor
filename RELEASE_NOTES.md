# DASH Stream Monitor v1.0.0 - Release Notes

**Release Date:** November 19, 2025

## 🎉 First Stable Release

We're excited to announce the first stable release of the DASH Stream Monitor - a production-ready TypeScript/Node.js service for monitoring DASH/MPEG-DASH streams with Prometheus metrics integration.

## ✨ Key Features

### Stream Monitoring
- Monitor one or more DASH streams continuously
- Real-time MPD manifest validation
- Automatic error detection and tracking
- Configurable monitoring intervals (default: 3 seconds)
- Stale manifest detection (configurable threshold)

### Validation Capabilities
- ✅ MPD structure validation
- ✅ XML parsing verification
- ✅ Period continuity checks
- ✅ Publish time progression (live streams)
- ✅ HTTP fetch error detection with status codes
- ✅ Required attribute validation

### REST API
Complete REST API with 10 endpoints for full monitor lifecycle management:
- Create, list, and delete monitors
- Add and remove streams dynamically
- Query status and errors
- Clear error history
- Health checks

### Prometheus Integration
Comprehensive metrics in OpenMetrics format:
- Monitor state and metadata
- Per-stream error counts
- Manifest fetch errors with HTTP codes
- Time since last error
- Current error counts

### Developer Experience
- **TypeScript**: Full type safety with .d.ts declarations
- **Library Mode**: Use as npm package in your applications
- **CLI Mode**: Run as standalone service
- **Docker Ready**: Dockerfile and docker-compose included
- **Testing Suite**: Complete test payloads and scripts
- **Documentation**: Comprehensive guides and examples

## 📦 Installation

```bash
npm install @eyevinn/dash-monitor
```

## 🚀 Quick Start

### As a Service
```bash
npm start
```

### As a Library
```javascript
const { DASHMonitor } = require('@eyevinn/dash-monitor');

const monitor = new DASHMonitor([
  'https://example.com/stream.mpd'
], {
  staleLimit: 6000,
  monitorInterval: 3000
});

await monitor.start();
```

### With Docker
```bash
docker-compose up -d
```

Access:
- DASH Monitor: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## 🧪 Testing

Tested with:
- ✅ 5 DASH streams (public test streams)
- ✅ 100+ errors detected
- ✅ All 10 API endpoints verified
- ✅ Prometheus metrics validated
- ✅ Docker deployment confirmed

Test scripts included in `testing/` directory.

## 📊 Architecture

Follows the proven architecture of the HLS Stream Monitor:
- **DASHMonitor**: Core monitoring engine
- **DASHMonitorService**: Fastify REST API wrapper
- **MPDLoader**: Manifest fetching and parsing
- **ErrorsList**: FIFO error storage

## 🌍 Deployment

### OSC (Open Source Cloud)
Ready for deployment to Eyevinn Open Source Cloud:
```bash
osc create eyevinn-web-runner dash-monitor \
  -o GitHubUrl=https://github.com/YOUR-ORG/dash-monitor \
  -o GitHubToken="{{secrets.ghtoken}}" \
  -o OscAccessToken="{{secrets.osctoken}}"
```

### Docker
```bash
docker build -t dash-monitor .
docker run -p 8080:8080 dash-monitor
```

## 📝 Documentation

- [README.md](README.md) - Complete user guide
- [QUICKSTART.md](QUICKSTART.md) - Getting started
- [TESTING_SUMMARY.md](TESTING_SUMMARY.md) - Test results
- [testing/README.md](testing/README.md) - Testing guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## 🔗 Links

- **GitHub**: https://github.com/Eyevinn/dash-monitor
- **NPM**: https://www.npmjs.com/package/@eyevinn/dash-monitor
- **OSC**: https://app.osaas.io/browse/dash-monitor
- **Issues**: https://github.com/Eyevinn/dash-monitor/issues

## 🙏 Acknowledgments

- Inspired by the [HLS Stream Monitor](https://github.com/Eyevinn/hls-monitor)
- Built with [mpd-parser](https://github.com/videojs/mpd-parser) from Video.js
- Powered by [Fastify](https://www.fastify.io/)
- Developed for [Eyevinn Open Source Cloud](https://osaas.io)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

None critical. See [GitHub Issues](https://github.com/Eyevinn/dash-monitor/issues) for minor enhancements.

## 🔮 Future Enhancements

- Actual segment URL validation
- Grafana dashboard templates
- Webhook notifications
- Advanced timeline validation
- Rate limiting for production use

---

**Built by Eyevinn Technology** - https://www.eyevinn.se
