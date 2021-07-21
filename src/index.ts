import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import $rdf from 'rdf-ext';
import { turtle } from '@tpluscode/rdf-string';
import { rdf } from '@tpluscode/rdf-ns-builders';

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CoreV1Api);

const ptr = clownface({ dataset: $rdf.dataset() });

(async () => {
  const apiNamespaces = await k8sApi.listNamespace();
  const namespaces = apiNamespaces.body.items;
  namespaces.forEach((ns) => {
    const namespaceName = ns.metadata?.name;
    if (!namespaceName) {
      return;
    }

    const nsPtr = ptr.namedNode(`urn:k8s:namespace:v1:${namespaceName}`);
    nsPtr.addOut(rdf.label, namespaceName);

    Object.entries(ns.metadata?.labels || {}).forEach(([key, value]) => {
      ptr.blankNode()
        .addOut(rdf.label, key)
        .addOut(rdf.value, value)
        .addIn($rdf.namedNode('urn:k8s:labels'), nsPtr);
    });
  });

  const ttl = turtle`${ptr.dataset}`.toString();
  console.log(ttl);
})();
