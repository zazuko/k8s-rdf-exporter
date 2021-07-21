import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';

export const iri = (namespace: string, ingress: string): NamedNode => ns.k8s[`namespace:${namespace}:ingress:${ingress}`];

export const fetch = async (api: APIList, ptr: ClownfacePtr): Promise<void> => {
  const apiIngresses = await api.networking.listIngressForAllNamespaces();
  const ingresses = apiIngresses.body.items;
  ingresses.forEach((item) => {
    const ingressName = item.metadata?.name;
    const ingressNamespace = item.metadata?.namespace;
    if (!ingressName || !ingressNamespace) {
      return;
    }

    // TODO: cluster name
    const ingressPtr = ptr.namedNode(iri(ingressNamespace, ingressName));
    ingressPtr.addOut(ns.rdf.type, ns.k8s.Ingress).addOut(ns.rdf.label, ingressName);
    if (ingressNamespace) {
      ingressPtr.addOut(ns.k8s.namespace, namespaceIri(ingressNamespace));
    }
  });
};
