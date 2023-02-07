import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr, GlobalContext } from '../global';
import {
  rdf, rdfs, k8s, GeneratedNamespace,
} from '../namespaces';
import { iri as clusterIri } from './cluster';

/**
 * Build IRI for a namespace.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param name name of the namespace.
 * @returns IRI for a cluster.
 */
export const iri = (ns: GeneratedNamespace, cluster: string, name: string): NamedNode => ns[`cluster/${cluster}/namespace/${name}`];

/**
 * Build IRI for a namespace resource.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace name of the namespace.
 * @param kind kind of resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  kind: string,
  name: string,
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/${kind}/${name}`];

/**
 * Create nodes in the dataset for all namespaces.
 *
 * @param context RDF context.
 * @param api list of client API.
 * @param ptr clownface pointer.
 */
export const fetch = async (
  context: GlobalContext,
  api: APIList,
  ptr: ClownfacePtr,
): Promise<void> => {
  const { ns, cluster } = context;

  // fetch all namespaces
  const apiNamespaces = await api.core.listNamespace();
  const namespaces = apiNamespaces.body.items;

  namespaces.forEach((item) => {
    const namespaceName = item.metadata?.name;
    if (!namespaceName) {
      return;
    }

    // create the named node for the namespace
    const nsPtr = ptr.namedNode(iri(ns, cluster, namespaceName));
    nsPtr
      .addOut(rdf.type, k8s.Namespace)
      .addOut(rdfs.label, namespaceName)
      .addOut(k8s.cluster, clusterIri(ns, cluster));

    // create a new node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, namespaceName, 'annotation', key))
        .addOut(rdf.type, k8s.Annotation)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.annotation, nsPtr);
    });

    // create a new node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, namespaceName, 'label', key))
        .addOut(rdf.type, k8s.Label)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.label, nsPtr);
    });
  });
};
