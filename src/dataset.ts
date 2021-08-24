/* eslint-disable import/prefer-default-export */
import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import $rdf from 'rdf-ext';
import DatasetExt from 'rdf-ext/lib/Dataset';

import { buildConfig, Config } from './config';
import { APIList } from './global';
import { fetch as fetchCluster } from './objects/cluster';
import { fetch as fetchNamespaces } from './objects/namespace';
import { fetch as fetchIngresses } from './objects/ingress';
import { fetch as fetchDeployment } from './objects/deployment';

/**
 * Build a dataset containing Kubernetes elements.
 *
 * @param config configuration to use instead of the default one.
 * @returns dataset with Kubernetes elements.
 */
export async function buildDataset(config?: Config): Promise<DatasetExt> {
  const ptr = clownface({ dataset: $rdf.dataset() });
  const kc = buildConfig(config);
  const cluster = kc.getCurrentCluster()?.name || 'k8s-cluster';

  // list of all API clients that we are using
  const api: APIList = {
    apps: kc.makeApiClient(AppsV1Api),
    core: kc.makeApiClient(CoreV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  };

  // fetch all different objects
  await fetchCluster(cluster, api, ptr);
  await fetchNamespaces(cluster, api, ptr);
  await fetchIngresses(cluster, api, ptr);
  await fetchDeployment(cluster, api, ptr);

  return ptr.dataset;
}
