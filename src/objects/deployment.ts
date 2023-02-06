import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';
import { iri as ociIri, process as processOci } from './oci';

/**
 * Build IRI for a deployment.
 *
 * @param cluster name of the cluster.
 * @param namespace namespace where the deployment is.
 * @param name name of the deployment.
 * @returns IRI for a cluster.
 */
export const iri = (
  cluster: string,
  namespace: string,
  name: string,
): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${namespace}:deployment:${name}`];

/**
 * Build IRI for a deployment resource.
 *
 * @param cluster name of the cluster.
 * @param namespace namespace where the deployment is.
 * @param deploymentName name of the deployment.
 * @param kind kind of the resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (
  cluster: string,
  namespace: string,
  deploymentName: string,
  kind: string,
  name: string,
): NamedNode => ns.k8s[`cluster:${cluster}:namespace:${namespace}:deployment:${deploymentName}:${kind}:${name}`];

/**
 * Create nodes in the dataset for all deployments.
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
  // fetch all deployments
  const apiDeployments = await api.apps.listDeploymentForAllNamespaces();
  const deployments = apiDeployments.body.items;

  deployments.forEach((item) => {
    const deploymentName = item.metadata?.name;
    const deploymentNamespace = item.metadata?.namespace;
    if (!deploymentName || !deploymentNamespace) {
      return;
    }

    // create the named node for the deployment
    const deploymentPtr = ptr.namedNode(
      iri(cluster, deploymentNamespace, deploymentName),
    );
    deploymentPtr
      .addOut(ns.rdf.type, ns.k8s.Deployment)
      .addOut(ns.rdfs.label, deploymentName);
    if (deploymentNamespace) {
      deploymentPtr.addOut(
        ns.k8s.namespace,
        namespaceIri(cluster, deploymentNamespace),
      );
    }

    // create a new node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, deploymentNamespace, deploymentName, 'annotation', key))
        .addOut(ns.rdf.type, ns.k8s.Annotation)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.annotations, deploymentPtr);
    });

    // create a new node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(cluster, deploymentNamespace, deploymentName, 'label', key))
        .addOut(ns.rdf.type, ns.k8s.Label)
        .addOut(ns.rdfs.label, key)
        .addOut(ns.rdf.value, value)
        .addIn(ns.k8s.labels, deploymentPtr);
    });

    // fetch OCI information and link to the deployment
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
      deploymentPtr.addOut(
        ns.k8s.image,
        images,
      );
    }
  });
};
