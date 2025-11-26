# Deploying DASH Monitor to OSC (Open Source Cloud)

This guide walks you through deploying the DASH Stream Monitor to Eyevinn Open Source Cloud.

## Prerequisites

1. **OSC Account**: Sign up at https://app.osaas.io
2. **OSC CLI**: Install the OSC command-line tool
3. **GitHub Repository**: Your fork of this repository
4. **Access Tokens**: GitHub and OSC access tokens

## Step 1: Prepare Your Repository

### 1.1 Fork or Push to GitHub

```bash
cd /Users/kunwu/Workspace/itv/dash-monitor

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DASH Stream Monitor v1.0.0"

# Add your GitHub remote
git remote add origin https://github.com/YOUR-USERNAME/dash-monitor.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Repository Structure

Ensure your repository has:
- `package.json` with proper start script
- `Dockerfile` for containerization
- `start.js` or `cli.js` as entry point
- All dependencies listed

## Step 2: Create Access Tokens

### 2.1 GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes: `repo` (all)
4. Generate and save the token

### 2.2 OSC Access Token

1. Log in to https://app.osaas.io
2. Navigate to Settings → Access Tokens
3. Create new token
4. Save the token securely

## Step 3: Deploy with Web Runner

### Option A: Using OSC CLI

```bash
# Install OSC CLI (if not installed)
npm install -g @osaas/cli

# Login to OSC
osc login

# Create the service
osc create eyevinn-web-runner dash-monitor \
  -o GitHubUrl=https://github.com/YOUR-USERNAME/dash-monitor \
  -o GitHubToken="YOUR_GITHUB_TOKEN" \
  -o OscAccessToken="YOUR_OSC_TOKEN"
```

### Option B: Using OSC Web Interface

1. Go to https://app.osaas.io
2. Click "Create Service"
3. Select "Web Runner"
4. Fill in details:
   - **Name**: `dash-monitor`
   - **GitHub URL**: `https://github.com/YOUR-USERNAME/dash-monitor`
   - **GitHub Token**: Your personal access token
   - **OSC Access Token**: Your OSC token
5. Click "Create"

## Step 4: Configure Environment Variables

### Required Variables

The service uses these environment variables (defaults provided):

```bash
PORT=8080                    # Service port (default: 8080)
NODE_ENV=production          # Environment
```

### Optional Configuration

Set via OSC secrets:

```bash
osc secret create MONITOR_INTERVAL 5000
osc secret create STALE_LIMIT 10000
osc secret create ERROR_LIMIT 10
```

## Step 5: Verify Deployment

### Check Service Status

```bash
# List your services
osc service list

# Get service details
osc service get dash-monitor

# View logs
osc logs dash-monitor
```

### Test the Service

```bash
# Get service URL
SERVICE_URL=$(osc service get dash-monitor --output json | jq -r '.url')

# Health check
curl $SERVICE_URL/

# Create a monitor
curl -X POST $SERVICE_URL/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"]
  }'

# Check metrics
curl $SERVICE_URL/metrics
```

## Step 6: Integrate with Prometheus & Grafana

### 6.1 Create Prometheus Instance

```bash
# Create Prometheus service
osc create prometheus dash-prometheus

# Configure scraping
osc config set dash-prometheus \
  --scrape-config "
  scrape_configs:
    - job_name: 'dash-monitor'
      static_configs:
        - targets: ['dash-monitor:8080']
      metrics_path: '/metrics'
  "
```

### 6.2 Create Grafana Dashboard

1. Create Grafana instance on OSC
2. Add Prometheus data source
3. Import dashboard or create custom queries

Example queries:
```promql
# Total errors per stream
sum(dash_monitor_stream_total_errors) by (stream_id)

# Active monitors
sum(dash_monitor_state{state="active"})

# Error rate
rate(dash_monitor_stream_total_errors[5m])
```

## Step 7: Create Monitor Manager (Optional)

Similar to the HLS setup, create a manager that reads from CouchDB:

```bash
# Create CouchDB instance
osc create apache-couchdb dash-db \
  -o COUCHDB_USER=admin \
  -o COUCHDB_PASSWORD="{{secrets.dbpass}}"

# Create monitor manager
osc create eyevinn-web-runner dash-manager \
  -o GitHubUrl=https://github.com/YOUR-USERNAME/dash-monitor-manager \
  -o GitHubToken="{{secrets.ghtoken}}" \
  -o OscAccessToken="{{secrets.osctoken}}"
```

## Architecture on OSC

```
┌─────────────────────────────────────────────┐
│  Eyevinn Open Source Cloud                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │ DASH Monitor │◄─────┤   CouchDB    │   │
│  │  (Web Runner)│      │  (streams DB)│   │
│  └──────┬───────┘      └──────────────┘   │
│         │                                   │
│         │ /metrics                          │
│         ▼                                   │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  Prometheus  │─────►│   Grafana    │   │
│  │   (scraper)  │      │ (dashboard)  │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Monitoring Your Deployment

### Service Health

```bash
# Check service status
osc service status dash-monitor

# View recent logs
osc logs dash-monitor --tail 100

# Monitor resource usage
osc service metrics dash-monitor
```

### API Health Checks

```bash
# Health endpoint
curl https://dash-monitor.osaas.io/

# List monitors
curl https://dash-monitor.osaas.io/monitor

# Metrics endpoint
curl https://dash-monitor.osaas.io/metrics
```

## Updating Your Deployment

### Push Updates

```bash
# Make changes locally
git add .
git commit -m "Update: description"
git push

# OSC will automatically redeploy
```

### Manual Redeploy

```bash
osc service redeploy dash-monitor
```

## Scaling

### Horizontal Scaling

```bash
# Scale to multiple instances
osc service scale dash-monitor --replicas 3
```

### Resource Limits

```bash
# Set memory/CPU limits
osc service update dash-monitor \
  --memory 512Mi \
  --cpu 0.5
```

## Troubleshooting

### Service Won't Start

1. Check logs: `osc logs dash-monitor`
2. Verify environment variables
3. Check port configuration (must be 8080)
4. Ensure dependencies are in package.json

### No Metrics Appearing

1. Verify `/metrics` endpoint works
2. Check Prometheus scraping configuration
3. Verify service is accessible on port 8080
4. Check monitor is in "active" state

### High Memory Usage

1. Reduce `ERROR_LIMIT` (default: 10)
2. Increase `monitorInterval` to reduce checks
3. Limit number of streams per monitor

## Costs

OSC pricing is based on:
- Service slots used (DASH Monitor = 1 slot)
- Additional services (Prometheus, Grafana, CouchDB)
- Data transfer

Estimated costs:
- DASH Monitor: 1 service slot
- Prometheus: 1 service slot
- Grafana: 1 service slot
- CouchDB: 1 service slot
- **Total**: 4 service slots

## Support

- **OSC Documentation**: https://docs.osaas.io
- **GitHub Issues**: https://github.com/Eyevinn/dash-monitor/issues
- **OSC Community**: https://osaas.io/community
- **Eyevinn**: https://www.eyevinn.se

## Next Steps

After deployment:

1. ✅ Test with your DASH streams
2. ✅ Configure Grafana dashboards
3. ✅ Set up alerting rules
4. ✅ Monitor resource usage
5. ✅ Scale as needed

---

**Deployed successfully? Star the repo!** ⭐
https://github.com/Eyevinn/dash-monitor
