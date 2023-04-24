import { NamedNode } from "@rdfjs/types";
import { APIList, ClownfacePtr, GlobalContext } from "../global.js";
import { rdf, rdfs, k8s, GeneratedNamespace } from "../namespaces.js";

/**
 * Build IRI for a cluster.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @returns IRI for a cluster.
 */
export const iri = (ns: GeneratedNamespace, cluster: string): NamedNode =>
  ns[`cluster/${cluster}`];

/**
 * Create node in the dataset for the cluster.
 *
 * @param context RDF context.
 * @param api list of client API.
 * @param ptr clownface pointer.
 */
export const fetch = async (
  context: GlobalContext,
  _api: APIList,
  ptr: ClownfacePtr
): Promise<void> => {
  const { ns, cluster } = context;
  const clusterPtr = ptr.namedNode(iri(ns, cluster));
  clusterPtr.addOut(rdf.type, k8s.Cluster).addOut(rdfs.label, cluster);
};
