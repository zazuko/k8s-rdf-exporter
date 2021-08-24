import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';

/**
 * Build IRI for a StatefulSet.
 *
 * @param cluster name of the cluster.
 * @param namespace namespace where the StatefulSet is.
 * @param name name of the StatefulSet.
 * @returns IRI for a cluster.
 */
export const iri = (
  cluster: string,
  namespace: string,
  name: string,
): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${namespace}:statefulset:${name}`];

/**
 * Create nodes in the dataset for all StatefulSets.
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
  // fetch all StatefulSets
  const apiStatefulSets = await api.apps.listStatefulSetForAllNamespaces();
  const statefulSets = apiStatefulSets.body.items;

  statefulSets.forEach((item) => {
    const statefulSetName = item.metadata?.name;
    const statefulSetNamespace = item.metadata?.namespace;
    if (!statefulSetName || !statefulSetNamespace) {
      return;
    }

    // create the named node for the StatefulSet
    const statefulSetPtr = ptr.namedNode(
      iri(cluster, statefulSetNamespace, statefulSetName),
    );
    statefulSetPtr
      .addOut(ns.rdf.type, ns.k8s.StatefulSet)
      .addOut(ns.rdfs.label, statefulSetName);
    if (statefulSetNamespace) {
      statefulSetPtr.addOut(
        ns.k8s.namespace,
        namespaceIri(cluster, statefulSetNamespace),
      );
    }
  });
};
