import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr, GlobalContext } from '../global';
import {
  rdf, rdfs, k8s, GeneratedNamespace,
} from '../namespaces';
import { iri as namespaceIri } from './namespace';
import { iri as ociIri, process as processOci } from './oci';

/**
 * Build IRI for a StatefulSet.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the StatefulSet is.
 * @param name name of the StatefulSet.
 * @returns IRI for a cluster.
 */
export const iri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  name: string,
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/statefulset/${name}`];

/**
 * Build IRI for a StatefulSet resource.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the statefulSet is.
 * @param statefulSetName name of the StatefulSet.
 * @param kind kind of the resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  statefulSetName: string,
  kind: string,
  name: string,
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/statefulset/${statefulSetName}/${kind}/${name}`];

/**
 * Create nodes in the dataset for all StatefulSets.
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
  const { ns, nsOci, cluster } = context;

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
      iri(ns, cluster, statefulSetNamespace, statefulSetName),
    );
    statefulSetPtr
      .addOut(rdf.type, k8s.StatefulSet)
      .addOut(rdfs.label, statefulSetName);
    if (statefulSetNamespace) {
      statefulSetPtr.addOut(
        k8s.namespace,
        namespaceIri(ns, cluster, statefulSetNamespace),
      );
    }

    // create a new node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, statefulSetNamespace, statefulSetName, 'annotation', key))
        .addOut(rdf.type, k8s.Annotation)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.annotations, statefulSetPtr);
    });

    // create a new node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, statefulSetNamespace, statefulSetName, 'label', key))
        .addOut(rdf.type, k8s.Label)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.label, statefulSetPtr);
    });

    // fetch OCI information and link to the statefulSet
    const images: NamedNode<string>[] = [];
    const containers = item.spec?.template.spec?.containers;
    containers?.forEach((container) => {
      const { image } = container;
      if (!image) {
        return;
      }

      const imageName = processOci(nsOci, image, ptr);
      if (!imageName) {
        return;
      }

      images.push(ociIri(nsOci, imageName));
    });

    if (images.length > 0) {
      statefulSetPtr.addOut(
        k8s.images,
        images,
      );
    }
  });
};
