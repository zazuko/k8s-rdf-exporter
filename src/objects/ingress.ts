import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';

/**
 * Build IRI for an ingress.
 *
 * @param cluster name of the cluster.
 * @param namespace namespace where the ingress is.
 * @param name name of the ingress.
 * @returns IRI for a cluster.
 */
export const iri = (
  cluster: string,
  namespace: string,
  name: string,
): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${namespace}:ingress:${name}`];

/**
 * Create nodes in the dataset for all ingresses.
 *
 * @param cluster name of the cluster.
 * @param api list of client API.
 * @param ptr clownface pointer.
 */
export const fetch = async (
  cluster: string,
  api: APIList,
  ptr: ClownfacePtr,
): Promise<void> => {
  // fetch all ingresses
  const apiIngresses = await api.networking.listIngressForAllNamespaces();
  const ingresses = apiIngresses.body.items;

  ingresses.forEach((item) => {
    const ingressName = item.metadata?.name;
    const ingressNamespace = item.metadata?.namespace;
    if (!ingressName || !ingressNamespace) {
      return;
    }

    // create the named node for the ingress
    const ingressPtr = ptr.namedNode(
      iri(cluster, ingressNamespace, ingressName),
    );
    ingressPtr
      .addOut(ns.rdf.type, ns.k8s.Ingress)
      .addOut(ns.rdfs.label, ingressName);
    if (ingressNamespace) {
      ingressPtr.addOut(
        ns.k8s.namespace,
        namespaceIri(cluster, ingressNamespace),
      );
    }

    // create a new blank node for each host
    const rules = item.spec?.rules || [];
    const hosts = rules.map((rule) => rule.host);
    hosts.forEach((host) => {
      if (!host) return;
      ptr
        .blankNode()
        .addOut(ns.rdf.type, ns.k8s.Host)
        .addOut(ns.rdfs.label, host)
        .addIn(ns.k8s.hosts, ingressPtr);
    });
  });
};
