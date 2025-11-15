# Real-Time Chat Messenger (Converse)

A fully functional, real-time messaging application with video/audio calling capabilities, built with modern web technologies.

## Live Demo

Try it out here: **[Live Chat App](https://realtime-chat-application-xxew.onrender.com/)**

## Tech Stack

- **Next.js** - Full-stack React framework
- **Tailwind CSS** - Responsive UI styling
- **Convex** - Real-time backend database
- **Clerk** - Authentication & user management
- **LiveKit** - Video/audio calling infrastructure
- **Zod** - Type-safe data validation
- **ShadCN** - Modern UI components

## Features

- Google & Email Authentication
- User Invitations & Friend System
- Real-Time Messaging
- Video & Audio Calls (WebRTC via LiveKit)
- Push Notifications (PWA)
- Support Requests
- Beautiful, Responsive UI
- Profile Management

---

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone https://github.com/PARANDHAMAREDDYBOMMAKA/realtime-chat-application
cd realtime-chat-application
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Convex (Real-time Database)
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

# LiveKit (Video/Audio Calls)
NEXT_PUBLIC_LIVEKIT_URL=your-livekit-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment Options

### Option 1: Deploy to Render/Vercel (Easy)

#### Render
1. Push your code to GitHub
2. Connect your repo to Render
3. Add environment variables in Render dashboard
4. Deploy

#### Vercel
```bash
npm install -g vercel
vercel
```

### Option 2: Deploy to k3s (Self-Hosted, Free)

k3s is a lightweight, certified Kubernetes distribution perfect for self-hosting.

#### Step 1: Install k3s on Your Server

**On Ubuntu/Debian Server:**

```bash
# Install k3s (single command!)
curl -sfL https://get.k3s.io | sh -

# Check installation
sudo k3s kubectl get nodes

# Get kubeconfig for remote access
sudo cat /etc/rancher/k3s/k3s.yaml
```

**Important:** Copy the kubeconfig content. You'll need it for GitHub Actions.

#### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `KUBECONFIG` | Base64 encoded kubeconfig | `sudo cat /etc/rancher/k3s/k3s.yaml \| base64 -w 0` (Linux) or `sudo cat /etc/rancher/k3s/k3s.yaml \| base64` (Mac) |
| `CLERK_SECRET_KEY` | From Clerk dashboard | Your Clerk secret key |
| `CONVEX_DEPLOYMENT` | From Convex dashboard | Your Convex deployment URL |
| `LIVEKIT_API_KEY` | From LiveKit dashboard | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | From LiveKit dashboard | Your LiveKit API secret |
| `LIVEKIT_URL` | From LiveKit dashboard | Your LiveKit server URL |
| `CLERK_WEBHOOK_SECRET` | From Clerk dashboard | Your Clerk webhook secret |

**Optional:**
- `K8S_NAMESPACE` - Kubernetes namespace (default: `default`)

#### Step 3: Update Configuration Files

**Edit `k8s/configmap.yaml`:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: real-time-chat-config
data:
  NEXT_PUBLIC_APP_URL: "https://chat.yourdomain.com"  # Change this
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_..."    # Change this
  NEXT_PUBLIC_CONVEX_URL: "https://your-convex.convex.cloud"  # Change this
  NEXT_PUBLIC_LIVEKIT_URL: "wss://your-livekit-url"  # Change this
```

**Edit `k8s/deployment.yaml` (line 94):**

```yaml
rules:
- host: chat.yourdomain.com  # Replace with your domain
```

**For testing without a domain:**
Use `your-server-ip.nip.io` (e.g., `192.168.1.100.nip.io`)

#### Step 4: Add Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
```

#### Step 5: Deploy

**Automatic Deployment:**

```bash
git add .
git commit -m "Configure k3s deployment"
git push origin main
```

GitHub Actions will automatically build and deploy to your k3s cluster.

**Manual Deployment (Optional):**

```bash
# On your k3s server
sudo k3s kubectl apply -f k8s/configmap.yaml
sudo k3s kubectl create secret generic real-time-chat-secrets \
  --from-literal=CLERK_SECRET_KEY="your-key" \
  --from-literal=CONVEX_DEPLOYMENT="your-deployment" \
  --from-literal=LIVEKIT_API_KEY="your-key" \
  --from-literal=LIVEKIT_API_SECRET="your-secret" \
  --from-literal=LIVEKIT_URL="your-url" \
  --from-literal=CLERK_WEBHOOK_SECRET="your-secret"

sudo k3s kubectl apply -f k8s/deployment.yaml
```

#### Step 6: Access Your Application

**Get the External IP:**

```bash
sudo k3s kubectl get ingress real-time-chat-ingress
```

**Update DNS:**
Point your domain A record to the server IP.

**Access:**
Visit `http://chat.yourdomain.com` or `http://your-server-ip.nip.io`

---

## k3s Management Commands

### View Application Status

```bash
# Check pods
sudo k3s kubectl get pods -l app=real-time-chat

# View logs
sudo k3s kubectl logs -f deployment/real-time-chat

# Check service
sudo k3s kubectl get svc real-time-chat-service

# Check ingress
sudo k3s kubectl get ingress
```

### Update Application

```bash
# Edit environment variables
sudo k3s kubectl edit configmap real-time-chat-config

# Restart deployment
sudo k3s kubectl rollout restart deployment/real-time-chat

# Scale replicas
sudo k3s kubectl scale deployment/real-time-chat --replicas=3
```

### Rollback Deployment

```bash
# View deployment history
sudo k3s kubectl rollout history deployment/real-time-chat

# Rollback to previous version
sudo k3s kubectl rollout undo deployment/real-time-chat
```

### Uninstall Application

```bash
sudo k3s kubectl delete -f k8s/deployment.yaml
sudo k3s kubectl delete -f k8s/configmap.yaml
sudo k3s kubectl delete secret real-time-chat-secrets
```

### Uninstall k3s

```bash
# Complete k3s removal
sudo /usr/local/bin/k3s-uninstall.sh
```

---

## Optional: Enable HTTPS with Let's Encrypt

### Install cert-manager

```bash
sudo k3s kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

### Create Let's Encrypt Issuer

```bash
cat <<EOF | sudo k3s kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

### Enable TLS in Ingress

Edit `k8s/deployment.yaml` and uncomment the TLS section:

```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - chat.yourdomain.com
    secretName: real-time-chat-tls
```

Then redeploy:

```bash
sudo k3s kubectl apply -f k8s/deployment.yaml
```

---

## Troubleshooting

### Pods Not Starting

```bash
sudo k3s kubectl describe pod <pod-name>
sudo k3s kubectl logs <pod-name>
```

### Health Check Failures

```bash
# Port forward to test locally
sudo k3s kubectl port-forward deployment/real-time-chat 3000:3000
curl http://localhost:3000/api/health
```

### Check k3s Status

```bash
sudo systemctl status k3s
sudo k3s kubectl get events --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Verify image pull secret
sudo k3s kubectl get secret regcred -o yaml
```

---

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── (routes)/          # Application pages
├── components/            # React components
├── convex/               # Convex backend functions
├── k8s/                  # Kubernetes manifests
│   ├── deployment.yaml   # Deployment, Service, Ingress
│   └── configmap.yaml    # Configuration
├── .github/workflows/    # GitHub Actions CI/CD
└── public/              # Static assets
```

---

## Resource Requirements

**Minimum per pod:**
- CPU: 250m (0.25 cores)
- Memory: 512Mi

**Recommended for 2 replicas:**
- Total CPU: 1 core
- Total Memory: 2GB RAM

**Server Requirements for k3s:**
- 1GB RAM minimum (2GB recommended)
- 1 CPU core minimum
- 10GB disk space
- Ubuntu 20.04+ or Debian 10+

---

## License

MIT

## Contributing

Pull requests are welcome! Feel free to contribute.

## Support

For issues or questions:
- Create an issue on GitHub
- Check the troubleshooting section above

---

## Screenshots

![Login Screen](screenshots/login.png)
*Login Screen*

![Signing Modal](screenshots/signingmodal.png)
*Signing Modal*

![Conversations](screenshots/conversations.png)
*Conversations Overview*

![Chat Page](screenshots/Chatpage.png)
*Chat Page*

![Friend Request](screenshots/friendRequest.png)
*Friend Request Screen*

---

Happy Coding! 🚀
