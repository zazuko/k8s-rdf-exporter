# Kubernetes RDF exporter

## Quick Start

### Using `npx`

```sh
npx @zazuko/k8s-rdf-exporter
```

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
#   - `k8s-rdf-exporter` Secret (it will contain the ServiceAccount credentials, this will be automatically filled)
#   - `k8s-rdf-exporter` ClusterRoleBinding, that gives the SA the `view` ClusterRole
(cd k8s && kustomize build | kubectl apply -f -)

export K8S_CLUSTER_NAME=$(kubectl config view --minify -o 'jsonpath={.clusters[0].name}')
export K8S_API_URL=$(kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}')
export K8S_SERVICE_TOKEN=$(kubectl -n kube-system get secret k8s-rdf-exporter -o jsonpath='{.data.token}' | base64 -d)
export K8S_CERTIFICATE_PATH="/tmp/k8s-rdf-exporter-cert.txt"

kubectl -n kube-system get secret k8s-rdf-exporter \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > "${K8S_CERTIFICATE_PATH}"

node dist/cli.js \
  --api-url="${K8S_API_URL}" \
  --cluster-name="${K8S_CLUSTER_NAME}" \
  --certificate-path="${K8S_CERTIFICATE_PATH}" \
  --service-token="${K8S_SERVICE_TOKEN}"
```

## Supported options

```
Usage: cli [options]

Options:
  -n, --namespace <name>         name of the namespace to use
  -b, --base-iri <baseIRI>       baseIRI to use for resources
  --base-iri-oci <baseIRI>       baseIRI to use for OCI resources
  -u, --api-url <url>            API URL
  -c, --cluster-name <name>      Kubernetes cluster name
  -p, --certificate-path <path>  CA Certificate path
  -t, --service-token <token>    service token to use
  -k, --skip-tls-verify          skip TLS verification
  --version                      display current version
  -h, --help                     display help for command
```
