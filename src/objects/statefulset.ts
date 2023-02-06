import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';
import { iri as ociIri, process as processOci } from './oci';

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
): NamedNode => ns.k8s[`cluster/${cluster}/namespace/${namespace}/statefulset/${name}`];

/**
 * Build IRI for a StatefulSet resource.
 *
 * @param cluster name of the cluster.
 * @param namespace namespace where the statefulSet is.
 * @param statefulSetName name of the StatefulSet.
 * @param kind kind of the resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (
  cluster: string,
  namespace: string,
  statefulSetName: string,
  kind: string,
  name: string,
): NamedNode => ns.k8s[`cluster/${cluster}/namespace/${namespace}/statefulset/${statefulSetName}/${kind}/${name}`];

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

    // create a new node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, statefulSetNamespace, statefulSetName, 'annotation', key))
        .addOut(ns.rdf.type, ns.k8s.Annotation)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.annotations, statefulSetPtr);
    });

    // create a new node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, statefulSetNamespace, statefulSetName, 'label', key))
        .addOut(ns.rdf.type, ns.k8s.Label)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.labels, statefulSetPtr);
    });

    // fetch OCI information and link to the statefulSet
    const images: NamedNode<string>[] = [];
    const containers = item.spec?.template.spec?.containers;
    containers?.forEach((container) => {
      const { image } = container;
      if (!image) {
        return;
      }

      const imageName = processOci(image, ptr);
      if (!imageName) {
        return;
      }

      images.push(ociIri(imageName));
    });

    if (images.length > 0) {
      statefulSetPtr.addOut(
        ns.k8s.image,
        images,
      );
    }
  });
};
