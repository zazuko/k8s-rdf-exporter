import { NamedNode } from "@rdfjs/types";
import { APIList, ClownfacePtr, GlobalContext } from "../global.js";
import { rdf, rdfs, k8s, GeneratedNamespace } from "../namespaces.js";
import { iri as namespaceIri } from "./namespace.js";

/**
 * Build IRI for an ingress.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the ingress is.
 * @param name name of the ingress.
 * @returns IRI for a cluster.
 */
export const iri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  name: string
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/ingress/${name}`];

/**
 * Build IRI for an ingress host.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the ingress is.
 * @param ingress name of the ingress.
 * @param name name of the host.
 * @returns IRI for a cluster.
 */
export const hostIri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  ingress: string,
  name: string
): NamedNode =>
  ns[
    `cluster/${cluster}/namespace/${namespace}/ingress/${ingress}/host/${name}`
  ];

/**
 * Create nodes in the dataset for all ingresses.
 *
 * @param context RDF context.
 * @param api list of client API.
 * @param ptr clownface pointer.
 */
export const fetch = async (
  context: GlobalContext,
  api: APIList,
  ptr: ClownfacePtr
): Promise<void> => {
  const { ns, cluster } = context;

  // fetch all ingresses
  const apiIngresses = await api.networking.listIngressForAllNamespaces();
  const ingresses = apiIngresses.items;

  ingresses.forEach((item) => {
    const ingressName = item.metadata?.name;
    const ingressNamespace = item.metadata?.namespace;
    if (!ingressName || !ingressNamespace) {
      return;
    }

    // create the named node for the ingress
    const ingressPtr = ptr.namedNode(
      iri(ns, cluster, ingressNamespace, ingressName)
    );
    ingressPtr.addOut(rdf.type, k8s.Ingress).addOut(rdfs.label, ingressName);
    if (ingressNamespace) {
      ingressPtr.addOut(
        k8s.namespace,
        namespaceIri(ns, cluster, ingressNamespace)
      );
    }

    // create a new node for each host
    const rules = item.spec?.rules || [];
    const hosts = rules.map((rule) => rule.host);
    hosts.forEach((host) => {
      if (!host) return;
      ptr
        .namedNode(hostIri(ns, cluster, ingressNamespace, ingressName, host))
        .addOut(rdf.type, k8s.Host)
        .addOut(rdfs.label, host)
        .addIn(k8s.host, ingressPtr);
    });
  });
};
