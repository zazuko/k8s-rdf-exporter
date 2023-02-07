import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr, GlobalContext } from '../global';
import {
  rdf, rdfs, k8s, GeneratedNamespace,
} from '../namespaces';
import { iri as namespaceIri } from './namespace';
import { iri as ociIri, process as processOci } from './oci';

/**
 * Build IRI for a deployment.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the deployment is.
 * @param name name of the deployment.
 * @returns IRI for a cluster.
 */
export const iri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  name: string,
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/deployment/${name}`];

/**
 * Build IRI for a deployment resource.
 *
 * @param ns IRI namespace.
 * @param cluster name of the cluster.
 * @param namespace namespace where the deployment is.
 * @param deploymentName name of the deployment.
 * @param kind kind of the resource.
 * @param name name of the resource.
 * @returns IRI for a cluster.
 */
export const resourceIri = (
  ns: GeneratedNamespace,
  cluster: string,
  namespace: string,
  deploymentName: string,
  kind: string,
  name: string,
): NamedNode => ns[`cluster/${cluster}/namespace/${namespace}/deployment/${deploymentName}/${kind}/${name}`];

/**
 * Create nodes in the dataset for all deployments.
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
      iri(ns, cluster, deploymentNamespace, deploymentName),
    );
    deploymentPtr
      .addOut(rdf.type, k8s.Deployment)
      .addOut(rdfs.label, deploymentName);
    if (deploymentNamespace) {
      deploymentPtr.addOut(
        k8s.namespace,
        namespaceIri(ns, cluster, deploymentNamespace),
      );
    }

    // create a new node for each annotation
    Object.entries(item.metadata?.annotations || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, deploymentNamespace, deploymentName, 'annotation', key))
        .addOut(rdf.type, k8s.Annotation)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.annotation, deploymentPtr);
    });

    // create a new node for each label
    Object.entries(item.metadata?.labels || {}).forEach(([key, value]) => {
      ptr
        .namedNode(resourceIri(ns, cluster, deploymentNamespace, deploymentName, 'label', key))
        .addOut(rdf.type, k8s.Label)
        .addOut(rdfs.label, key)
        .addOut(rdf.value, value)
        .addIn(k8s.label, deploymentPtr);
    });

    // fetch OCI information and link to the deployment
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
      deploymentPtr.addOut(
        k8s.images,
        images,
      );
    }
  });
};
