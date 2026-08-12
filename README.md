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

## Tests

```sh
npm test # lint (oxlint) and type check
```

The integration tests ([`test/integration.test.ts`](test/integration.test.ts),
run with the built-in Node test runner) run the CLI against a real cluster,
parse the Turtle it produces and assert on the resulting quads:

```sh
npm run test:integration
```

They use the current `kubectl` context, so point it at a throwaway cluster —
in CI it is a k3s cluster spawned by the workflow. Everything they create is
named `k8s-rdf-exporter-test` and deleted again afterwards, so a real
`k8s-rdf-exporter` deployment on the same cluster is never touched.

## Supported options

```
Usage: cli [options]

Options:
  -n, --namespace <name>         name of the namespace to use by default for querying the cluster
  --generate-namespaces          generate namespace objects instead of querying them from the cluster, to be used in combination with --namespaces option
  --namespaces <namespaces...>   namespaces to query
  -b, --base-iri <baseIRI>       baseIRI to use for resources
  --base-iri-oci <baseIRI>       baseIRI to use for OCI resources
  -u, --api-url <url>            API URL
  -c, --cluster-name <name>      Kubernetes cluster name
  -p, --certificate-path <path>  CA Certificate path
  -t, --service-token <token>    service token to use
  -k, --skip-tls-verify          skip TLS verification
  -h, --help                     display help for command
```
