/* eslint-disable @typescript-eslint/no-unused-vars */
import { NamedNode } from '@rdfjs/types';
import { APIList, ClownfacePtr } from '../global';
import * as ns from '../namespaces';

/**
 * Build IRI for a cluster.
 *
 * @param cluster name of the cluster.
 * @returns IRI for a cluster.
 */
export const iri = (cluster: string): NamedNode => ns.k8s[`cluster:${cluster}`];

/**
 * Create node in the dataset for the cluster.
 *
 * @param cluster name of the cluster.
 * @param api list of client API.
 * @param ptr clownface pointer.
 */
export const fetch = async (
  cluster: string,
  _api: APIList,
  ptr: ClownfacePtr,
): Promise<void> => {
  const clusterPtr = ptr.namedNode(iri(cluster));
  clusterPtr
    .addOut(ns.rdf.type, ns.k8s.Cluster)
    .addOut(ns.rdfs.label, cluster);
};
