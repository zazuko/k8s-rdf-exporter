import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';

export const iri = (name: string): NamedNode => ns.k8s[`namespace:${name}`];

export const fetch = async (api: APIList, ptr: ClownfacePtr): Promise<void> => {
  const apiNamespaces = await api.core.listNamespace();
  const namespaces = apiNamespaces.body.items;
  namespaces.forEach((item) => {
    const namespaceName = item.metadata?.name;
    if (!namespaceName) {
      return;
    }

    // TODO: cluster name
    const nsPtr = ptr.namedNode(iri(namespaceName));
    nsPtr.addOut(ns.rdf.type, ns.k8s.Namespace).addOut(ns.rdf.label, namespaceName);

    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr.blankNode()
        .addOut(ns.rdf.type, ns.k8s.Label)
        .addOut(ns.rdf.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.labels, nsPtr);
    });
  });
};
