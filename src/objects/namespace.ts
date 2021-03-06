import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as clusterIri } from './cluster';

/**
 * Build IRI for a namespace.
 *
 * @param cluster name of the cluster.
 * @param name name of the namespace.
 * @returns IRI for a cluster.
 */
export const iri = (cluster: string, name: string): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${name}`];

/**
 * Build IRI for a namespace resource.
 *
 * @param cluster name of the cluster.
 * @param namespace name of the namespace.
 * @param kind kind of resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (cluster: string, namespace: string, kind: string, name: string): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${namespace}:${kind}:${name}`];

/**
 * Create nodes in the dataset for all namespaces.
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
  // fetch all namespaces
  const apiNamespaces = await api.core.listNamespace();
  const namespaces = apiNamespaces.body.items;

  namespaces.forEach((item) => {
    const namespaceName = item.metadata?.name;
    if (!namespaceName) {
      return;
    }

    // create the named node for the namespace
    const nsPtr = ptr.namedNode(iri(cluster, namespaceName));
    nsPtr
      .addOut(ns.rdf.type, ns.k8s.Namespace)
      .addOut(ns.rdfs.label, namespaceName)
      .addOut(ns.k8s.cluster, clusterIri(cluster));

    // create a new blank node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, namespaceName, 'annotation', key))
        .addOut(ns.rdf.type, ns.k8s.Annotation)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.annotations, nsPtr);
    });

    // create a new blank node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, namespaceName, 'label', key))
        .addOut(ns.rdf.type, ns.k8s.Label)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.labels, nsPtr);
    });
  });
};
