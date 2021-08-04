# Kubernetes RDF exporter

## Quick Start

### Using the default configured cluster

```sh
npm i # install dependencies
npm run build # build everything
npm run start
```

### Using explicit credentials

```sh
npm i # install dependencies
npm run build # build everything

# deploy in the `kube-system` namespace in the current cluster
#   - `k8s-rdf-exporter` ServiceAccount
#   - `k8s-rdf-exporter` ClusterRoleBinding, that gives the SA the `view` ClusterRole
(cd k8s && kustomize build | kubectl apply -f -)

K8S_SECRET_NAME=$(kubectl -n kube-system get secret -o name | grep k8s-rdf-exporter)

export K8S_CLUSTER_NAME=$(kubectl config view --minify -o 'jsonpath={.clusters[0].name}')
export K8S_API_URL=$(kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}')
export K8S_SERVICE_TOKEN=$(kubectl -n kube-system get "${K8S_SECRET_NAME}" -o jsonpath='{.data.token}' | base64 -d)
export K8S_CERTIFICATE_PATH="/tmp/k8s-rdf-exporter-cert.txt"

kubectl -n kube-system get "${K8S_SECRET_NAME}" \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > "${K8S_CERTIFICATE_PATH}"

node dist/cli.js \
  --api-url="${K8S_API_URL}" \
  --cluster-name="${K8S_CLUSTER_NAME}" \
  --certificate-path="${K8S_CERTIFICATE_PATH}" \
  --service-token="${K8S_SERVICE_TOKEN}"
```
