#!/bin/bash
# =============================================================================
# Script di inizializzazione VPS per il progetto k9
# Compatibile con: Ubuntu 24.04 (Hetzner Cloud)
#
# Utilizzo:
#   - Campo "User data" durante la creazione del server su Hetzner
#     (esegue automaticamente al primo avvio)
#   - Esecuzione manuale: bash scripts/cloud-init.sh
#
# Cosa installa:
#   1. Dipendenze di sistema
#   2. Utente deploy (SSH e kubectl senza root)
#   3. k3s — Kubernetes leggero con Traefik e CoreDNS inclusi
#   4. KEDA — controller autoscaling
#   5. KEDA HTTP Add-on — scaling su richieste HTTP in ingresso
#   6. cert-manager — provisioning automatico certificati TLS (Let's Encrypt)
#   7. Headlamp — UI per pod, risorse ed eventi di scaling
#
#
# Output:
#   Log completo  : /var/log/k9-init.log
#   Marker fine   : /opt/k9/.init-complete
# =============================================================================

set -euo pipefail

LOG="/var/log/k9-init.log"
exec > >(tee -a "$LOG") 2>&1

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "=========================================================="
log " Inizio inizializzazione VPS k9"
log "=========================================================="

# ── 1. Aggiornamento sistema ──────────────────────────────────────────────────
log "[1/6] Aggiornamento sistema e installazione dipendenze..."
apt-get update -y
apt-get upgrade -y
# gettext-base fornisce envsubst, usato dalla GitHub Action per sostituire
# i tag delle immagini nei manifest Kubernetes prima di ogni deploy
apt-get install -y curl gettext-base
# installazione helm
mkdir -p ~/bin
curl -LO https://get.helm.sh/helm-v4.2.2-linux-amd64.tar.gz
tar -zxf helm-v4.2.2-linux-amd64.tar.gz
mv linux-amd64/helm ~/bin/helm
rm -rf helm-v4.2.2-linux-amd64.tar.gz linux-amd64
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

log "      OK"

# ── 2. Utente deploy ──────────────────────────────────────────────────────────
log "[2/6] Creazione utente deploy..."
# k3s gira come servizio di sistema (root) — non e' modificabile.
# L'utente deploy serve per SSH e kubectl senza mai accedere come root.
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG sudo deploy

  # Copia la chiave SSH autorizzata da root → deploy
  # (la stessa chiave pubblica aggiunta su Hetzner al momento della creazione)
  mkdir -p /home/deploy/.ssh
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys

  log "      Utente deploy creato"
else
  log "      Utente deploy gia' esistente, skip"
fi

# ── 3. Cartella di lavoro ─────────────────────────────────────────────────────
mkdir -p /opt/k9
chown deploy:deploy /opt/k9
log "      /opt/k9 creata"

# ── 4. k3s ───────────────────────────────────────────────────────────────────
log "[3/6] Installazione k3s..."
curl -sfL https://get.k3s.io | sh -

log "      Attendo che il nodo sia Ready..."
until kubectl get nodes 2>/dev/null | grep -q " Ready"; do
  sleep 5
done
log "      k3s pronto — $(kubectl get nodes --no-headers | tr -s ' ')"

# Configura kubectl per l'utente deploy
mkdir -p /home/deploy/.kube
cp /etc/rancher/k3s/k3s.yaml /home/deploy/.kube/config
chown -R deploy:deploy /home/deploy/.kube
chmod 600 /home/deploy/.kube/config
# Aggiunge KUBECONFIG a .bashrc (shell interattive) e .profile (login SSH)
# entrambi necessari perché Ubuntu non garantisce quale viene caricato
for RC in /home/deploy/.bashrc /home/deploy/.profile; do
  grep -qxF 'export KUBECONFIG=/home/deploy/.kube/config' "$RC" \
    || echo 'export KUBECONFIG=/home/deploy/.kube/config' >> "$RC"
done
log "      kubectl configurato per utente deploy"

# ── 5. KEDA ──────────────────────────────────────────────────────────────────
log "[4/6] Installazione KEDA..."
# --server-side evita l'errore "Too long: may not be more than 262144 bytes"
# I CRD di KEDA sono troppo grandi per le annotazioni del client-side apply.
kubectl apply --server-side -f "https://github.com/kedacore/keda/releases/download/v2.16.0/keda-2.16.0.yaml"

log "      Attendo che i deployment KEDA siano disponibili..."
kubectl wait --for=condition=available deployment \
  --all --namespace keda --timeout=300s
log "      KEDA pronto"

# ── 6. KEDA HTTP Add-on ───────────────────────────────────────────────────────
log "[5/6] Installazione KEDA HTTP Add-on..."
HTTP_ADDON_VERSION=$(curl -s https://api.github.com/repos/kedacore/http-add-on/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)
log "      Versione rilevata: ${HTTP_ADDON_VERSION}"
kubectl apply --server-side -f "https://github.com/kedacore/http-add-on/releases/download/${HTTP_ADDON_VERSION}/keda-add-ons-http-${HTTP_ADDON_VERSION#v}.yaml"

log "      Attendo che i deployment KEDA HTTP Add-on siano disponibili..."
kubectl wait --for=condition=available deployment \
  --all --namespace keda --timeout=300s
log "      KEDA HTTP Add-on pronto"

# ── 6. cert-manager ──────────────────────────────────────────────────────────
log "[6/7] Installazione cert-manager..."
kubectl apply -f "https://github.com/cert-manager/cert-manager/releases/download/v1.16.0/cert-manager.yaml"

log "      Attendo che i deployment cert-manager siano disponibili..."
kubectl wait --for=condition=available deployment \
  --all --namespace cert-manager --timeout=300s
log "      cert-manager pronto"
log "      Nota: il ClusterIssuer letsencrypt-prod viene applicato"
log "      dalla GitHub Action al primo deploy (richiede la Variable LETSENCRYPT_EMAIL)"

# ── 7. Headlamp (Kubernetes UI) ────────────────────────────────────────────
log "[7/7] Installazione Headlamp..."

# Repository Helm ufficiale di Headlamp
helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/ > /dev/null 2>&1 || true
helm repo update > /dev/null

# Installazione (idempotente: se già installato, fa upgrade)
helm upgrade --install my-headlamp headlamp/headlamp \
  --namespace headlamp \
  --create-namespace

# Attesa che il pod sia pronto
log "Attendo che Headlamp sia pronto..."
kubectl rollout status deployment/my-headlamp \
  --namespace headlamp \
  --timeout=120s

# Service account con accesso completo al cluster
kubectl create serviceaccount headlamp-admin \
  --namespace "headlamp" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create clusterrolebinding headlamp-admin \
  --clusterrole=cluster-admin \
  --serviceaccount="headlamp:headlamp-admin" \
  --dry-run=client -o yaml | kubectl apply -f -

# # Token di accesso (valido 1 anno)
# log "Token di accesso Headlamp (valido 1 anno):"
# kubectl create token headlamp-admin \
#   --namespace headlamp \
#   --duration=8760h

# Token permanente (non scade), legato a un Secret dedicato
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: headlamp-admin-token
  namespace: headlamp
  annotations:
    kubernetes.io/service-account.name: headlamp-admin
type: kubernetes.io/service-account-token
EOF

# Attesa che Kubernetes popoli il campo "token" nel secret
log "Attendo generazione token..."
for i in {1..10}; do
  HEADLAMP_TOKEN=$(kubectl get secret headlamp-admin-token -n headlamp -o jsonpath='{.data.token}' 2>/dev/null | base64 -d)
  [ -n "$HEADLAMP_TOKEN" ] && break
  sleep 1
done

log "Token permanente Headlamp:"
echo "$HEADLAMP_TOKEN"

log "      Headlamp installato"

# ── Completamento ─────────────────────────────────────────────────────────────
touch /opt/k9/.init-complete

# -4 forza IPv4 anche su server con solo IPv6 assegnato
VPS_IP=$(curl -4 -s --max-time 5 ifconfig.me 2>/dev/null || echo '<IP_VPS>')

log ""
log "=========================================================="
log " Inizializzazione completata con successo"
log "=========================================================="
log ""
log " ── ACCESSO SSH ───────────────────────────────────────────"
log " Usa sempre l'utente deploy, non root:"
log "   ssh -i ~/.ssh/k9_deploy deploy@${VPS_IP}"
log ""
log " ── KUBECONFIG (utente deploy) ────────────────────────────"
log " Se kubectl restituisce 'permission denied' su k3s.yaml,"
log " significa che KUBECONFIG non e' impostato correttamente."
log " Verifica che il file esista:"
log "   ls -la ~/.kube/config"
log " Se esiste, ricarica il profilo (scritto sia in .bashrc che .profile):"
log "   echo 'export KUBECONFIG=/home/deploy/.kube/config' >> ~/.profile"
log " Se il file NON esiste, copialo da root:"
log "   sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config"
log "   sudo chown deploy:deploy ~/.kube/config"
log "   chmod 600 ~/.kube/config"
log "   echo 'export KUBECONFIG=/home/deploy/.kube/config' >> ~/.profile"
log ""
log " ── VERIFICA CLUSTER ──────────────────────────────────────"
log "   kubectl get nodes"
log "   kubectl get pods -A"
log ""
log " ── KUBERNETES DASHBOARD ──────────────────────────────────"
log " La dashboard si apre nel browser del TUO PC."
log " Il tunnel SSH porta la porta dal VPS al tuo PC locale"
log " attraverso la connessione SSH — nessuna porta da aprire"
log " sul firewall Hetzner."
log ""
log " Step 1 — Sul VPS (lascia girare in background):"
log "   kubectl proxy --address='127.0.0.1' --port=8001 &"
log ""
log " Step 2 — Sul TUO PC (apre il tunnel, tienilo aperto):"
log "   ssh -i ~/.ssh/k9_deploy -L 8001:localhost:8001 -N deploy@${VPS_IP}"
log ""
log " Step 3 — Nel browser del tuo PC:"
log "   http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
log ""
log " Step 4 — Token di accesso (copialo nel campo Token della dashboard):"
log "   kubectl create token dashboard-admin -n kubernetes-dashboard"
log ""
log " ── SCALING (KEDA) ────────────────────────────────────────"
log " Stato repliche attuali:"
log "   kubectl get hso -n k9"
log " Dettaglio eventi di scaling:"
log "   kubectl describe hso k9-server -n k9"
log " Tutti gli eventi del namespace:"
log "   kubectl get events -n k9 --sort-by='.lastTimestamp'"
log ""
log " ── HEADLAMP (Kubernetes UI) ──────────────────────────────"
log " Headlamp si apre nel browser del TUO PC."
log " Il tunnel SSH porta la porta dal VPS al tuo PC locale"
log " attraverso la connessione SSH — nessuna porta da aprire"
log " sul firewall Hetzner."
log ""
log " Step 1 — Sul VPS (lascia girare in background):"
log "   kubectl port-forward -n headlamp svc/my-headlamp --address='127.0.0.1' 8001:80 &"
log ""
log " Step 2 — Sul TUO PC (apre il tunnel, tienilo aperto):"
log "   ssh -i ~/.ssh/k9_deploy -L 8001:localhost:8001 -N deploy@${VPS_IP}"
log ""
log " Step 3 — Nel browser del tuo PC:"
log "   http://localhost:8001"
log ""
log " Step 4 — Token di accesso (copialo nel campo Token di Headlamp):"
log "   ${HEADLAMP_TOKEN}"
log ""
log " ── PROSSIMI PASSI ────────────────────────────────────────"
log "   1. Aggiungi l'IP ${VPS_IP} alla whitelist MongoDB Atlas"
log "      cloud.mongodb.com → Network Access → Add IP Address"
log "   2. Configura i segreti GitHub:"
log "      VPS_HOST=${VPS_IP}"
log "      VPS_USER=deploy"
log "      VPS_SSH_KEY=<contenuto di ~/.ssh/k9_deploy>"
log "      MONGODB_URI=<uri atlas>"
log "      SESSION_SECRET=<openssl rand -hex 32>"
log "      GHCR_PAT=<github personal access token read:packages>"
log "   3. Sostituisci YOUR_DOMAIN in:"
log "      k8s/ingress.yaml  → campo host:"
log "      k8s/server/hso.yaml → campo hosts:"
log "   4. Push su main → la GitHub Action esegue il primo deploy"
log ""
log " Log completo: $LOG"
