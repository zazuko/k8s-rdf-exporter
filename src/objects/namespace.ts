import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as clusterIri } from './cluster';

export const iri = (cluster: string, name: string): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${name}`];

export const fetch = async (
  cluster: string,
  api: APIList,
  ptr: ClownfacePtr,
): Promise<void> => {
  const apiNamespaces = await api.core.listNamespace();
  const namespaces = apiNamespaces.body.items;

  namespaces.forEach((item) => {
    const namespaceName = item.metadata?.name;
    if (!namespaceName) {
      return;
    }

    const nsPtr = ptr.namedNode(iri(cluster, namespaceName));
    nsPtr
      .addOut(ns.rdf.type, ns.k8s.Namespace)
      .addOut(ns.rdfs.label, namespaceName)
      .addOut(ns.k8s.cluster, clusterIri(cluster));

    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .blankNode()
        .addOut(ns.rdf.type, ns.k8s.Label)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.labels, nsPtr);
    });
  });
};
