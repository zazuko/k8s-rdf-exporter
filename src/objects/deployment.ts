import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';
import { iri as namespaceIri } from './namespace';

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
  });
};
