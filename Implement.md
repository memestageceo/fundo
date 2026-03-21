# GitOps Implementation Guide for Fundo Application

## Overview
This guide walks you through setting up a GitOps workflow for your Fundo full-stack application using:
- **Kustomize** for configuration management
- **Argo CD** for continuous deployment
- **External Secrets Operator** with HashiCorp Vault for secrets
- **cert-manager** for TLS certificates
- **Separate namespaces** per environment (dev, staging, prod)

## Prerequisites
- Kubernetes cluster with Argo CD, External Secrets Operator, and cert-manager already installed
- Vault instance with secrets stored at paths like `secret/fundo/dev/database`
- GitHub repository for your application code
- `kubectl` and `kustomize` CLI tools installed locally

## Step 1: Create GitOps Repository
```bash
# Create new repository
gh repo create fundo-k8s --private
git clone https://github.com/your-org/fundo-k8s.git
cd fundo-k8s
```

## Step 2: Repository Structure
Create the following directory structure:
```
fundo-k8s/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   ├── postgresql/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   ├── ingress/
│   │   ├── ingress.yaml
│   │   ├── certificate.yaml
│   │   └── kustomization.yaml
│   └── external-secrets/
│       ├── external-secret.yaml
│       └── kustomization.yaml
├── environments/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── patches/
│   │   │   ├── backend-replicas.yaml
│   │   │   ├── frontend-replicas.yaml
│   │   │   └── postgresql-resources.yaml
│   │   └── vars/
│   │       └── domain.yaml
│   ├── staging/
│   │   └── (same structure as dev)
│   └── prod/
│       └── (same structure as dev)
├── argocd/
│   ├── app-dev.yaml
│   ├── app-staging.yaml
│   └── app-prod.yaml
└── README.md
```

## Step 3: Base Kubernetes Resources

### 3.1 Namespace Template
`base/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fundo-ns  # Will be replaced per environment
```

### 3.2 Backend Deployment
`base/backend/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels:
    app: fundo
    component: backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fundo
      component: backend
  template:
    metadata:
      labels:
        app: fundo
        component: backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/your-org/fundo/backend:COMMIT_SHA  # Will be updated by CI
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: database_url
        - name: CORS_ORIGINS
          value: "https://DOMAIN_PLACEHOLDER"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

`base/backend/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: fundo
    component: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### 3.3 Frontend Deployment
`base/frontend/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: fundo
    component: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fundo
      component: frontend
  template:
    metadata:
      labels:
        app: fundo
        component: frontend
    spec:
      containers:
      - name: frontend
        image: ghcr.io/your-org/fundo/frontend:COMMIT_SHA  # Will be updated by CI
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_BASE_URL
          value: "/api"
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
```

`base/frontend/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: fundo
    component: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### 3.4 PostgreSQL StatefulSet
`base/postgresql/statefulset.yaml`:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql
  replicas: 1
  selector:
    matchLabels:
      app: fundo
      component: database
  template:
    metadata:
      labels:
        app: fundo
        component: database
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: fundo
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command: ["pg_isready", "-U", "fundo"]
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command: ["pg_isready", "-U", "fundo"]
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
```

`base/postgresql/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgresql
spec:
  selector:
    app: fundo
    component: database
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None  # Headless service for StatefulSet
```

### 3.5 Ingress with TLS
`base/ingress/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fundo-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  tls:
  - hosts:
    - DOMAIN_PLACEHOLDER
    secretName: fundo-tls
  rules:
  - host: DOMAIN_PLACEHOLDER
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

`base/ingress/certificate.yaml`:
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: fundo-cert
spec:
  secretName: fundo-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - DOMAIN_PLACEHOLDER
```

### 3.6 External Secret for Database
`base/external-secrets/external-secret.yaml`:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: postgres-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: postgres-credentials
  data:
  - secretKey: username
    remoteRef:
      key: secret/fundo/ENV_PLACEHOLDER/database
      property: username
  - secretKey: password
    remoteRef:
      key: secret/fundo/ENV_PLACEHOLDER/database
      property: password
  - secretKey: database_url
    remoteRef:
      key: secret/fundo/ENV_PLACEHOLDER/database
      property: database_url
```

### 3.7 Kustomization Files
`base/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- namespace.yaml
- backend
- frontend
- postgresql
- ingress
- external-secrets
```

`base/backend/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
```

(Repeat similar kustomization.yaml files for frontend, postgresql, ingress, external-secrets)

## Step 4: Environment Overlays

### 4.1 Development Environment
`environments/dev/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: fundo-dev
resources:
- ../../base
patches:
- path: patches/backend-replicas.yaml
- path: patches/frontend-replicas.yaml
- path: patches/postgresql-resources.yaml
patchesStrategicMerge:
- vars/domain.yaml
```

`environments/dev/patches/backend-replicas.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
```

`environments/dev/patches/frontend-replicas.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
```

`environments/dev/patches/postgresql-resources.yaml`:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  template:
    spec:
      containers:
      - name: postgres
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

`environments/dev/vars/domain.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: CORS_ORIGINS
          value: "https://dev.fundo.example.com"
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fundo-ingress
spec:
  tls:
  - hosts:
    - dev.fundo.example.com
    secretName: fundo-tls
  rules:
  - host: dev.fundo.example.com
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: fundo-cert
spec:
  dnsNames:
  - dev.fundo.example.com
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: postgres-credentials
spec:
  data:
  - secretKey: username
    remoteRef:
      key: secret/fundo/dev/database
  - secretKey: password
    remoteRef:
      key: secret/fundo/dev/database
  - secretKey: database_url
    remoteRef:
      key: secret/fundo/dev/database
```

### 4.2 Staging and Production Environments
Create similar structures for staging and production with appropriate values:
- Staging: `fundo-staging` namespace, `staging.fundo.example.com`
- Production: `fundo-prod` namespace, `prod.fundo.example.com`

## Step 5: Argo CD Applications
`argocd/app-dev.yaml`:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: fundo-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/fundo-k8s.git
    targetRevision: HEAD
    path: environments/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: fundo-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

Create similar applications for staging and prod.

## Step 6: Application Code Modifications

### 6.1 Frontend Changes
Modify `frontend/src/services/api.ts` to default to `/api`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
```

Update `frontend/Dockerfile` to set default build arg:
```dockerfile
# Add after FROM node:24-alpine AS builder
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
```

### 6.2 Backend Changes
Modify `backend/app/main.py` to read CORS origins from environment:
```python
import os
from fastapi.middleware.cors import CORSMiddleware

# Replace hardcoded origins with:
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # ... rest unchanged
)
```

## Step 7: CI/CD Pipeline Updates

### 7.1 Update GitHub Actions Workflow
Extend `.github/workflows/cd.yml` to update GitOps repository:

```yaml
name: CD

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write

jobs:
  build-and-push:
    # ... existing build and push steps
    
  update-gitops:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
    - name: Checkout GitOps repo
      uses: actions/checkout@v3
      with:
        repository: your-org/fundo-k8s
        token: ${{ secrets.GITOPS_PAT }}
        path: gitops
        
    - name: Update image tags
      run: |
        cd gitops
        # Replace COMMIT_SHA placeholder with actual SHA
        sed -i "s/COMMIT_SHA/${{ github.sha }}/g" base/backend/deployment.yaml
        sed -i "s/COMMIT_SHA/${{ github.sha }}/g" base/frontend/deployment.yaml
        
        # Commit and push changes
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git add .
        git commit -m "Update image tags to ${{ github.sha }}"
        git push
```

## Step 8: Vault Secret Configuration

Store database secrets in Vault:
```bash
# For dev environment
vault kv put secret/fundo/dev/database \
  username=fundo \
  password=securepassword123 \
  database_url=postgresql+psycopg2://fundo:securepassword123@postgresql.fundo-dev.svc.cluster.local:5432/fundo

# Repeat for staging and prod with different passwords
```

## Step 9: Deployment Steps

1. **Create namespaces:**
   ```bash
   kubectl create namespace fundo-dev
   kubectl create namespace fundo-staging
   kubectl create namespace fundo-prod
   ```

2. **Apply Argo CD applications:**
   ```bash
   kubectl apply -f argocd/app-dev.yaml
   kubectl apply -f argocd/app-staging.yaml
   kubectl apply -f argocd/app-prod.yaml
   ```

3. **Monitor deployment:**
   ```bash
   argocd app list
   argocd app get fundo-dev
   ```

## Step 10: Verification

1. **Check pod status:**
   ```bash
   kubectl get pods -n fundo-dev
   ```

2. **Verify ingress:**
   ```bash
   kubectl get ingress -n fundo-dev
   ```

3. **Test application:**
   ```bash
   curl -H "Host: dev.fundo.example.com" http://<ingress-ip>/
   ```

## Security Considerations

1. **Network Policies:** Add NetworkPolicies to restrict pod communication
2. **Pod Security Standards:** Enforce restricted security context
3. **RBAC:** Configure appropriate roles for each namespace
4. **Resource Quotas:** Set resource limits per namespace
5. **Monitoring:** Set up Prometheus/Grafana for monitoring

## Troubleshooting

1. **Argo CD sync issues:** Check Argo CD logs
2. **ExternalSecret not syncing:** Verify Vault connection and permissions
3. **Certificate not issuing:** Check cert-manager logs and ClusterIssuer
4. **Database connection issues:** Verify PostgreSQL pod is running and credentials are correct

## Next Steps

1. Set up monitoring and alerting
2. Configure backup for PostgreSQL data
3. Implement blue/green deployment strategy
4. Add integration tests for each environment
5. Set up disaster recovery procedures

This guide provides a complete GitOps setup. Each component is designed to be modular and can be customized further based on your specific requirements.