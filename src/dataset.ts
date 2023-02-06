/* eslint-disable import/prefer-default-export */
import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import $rdf from 'rdf-ext';
import DatasetExt from 'rdf-ext/lib/Dataset';

import {
  buildConfig, Config, defaultBaseIri, defaultBaseIriOci,
} from './config';
import { APIList, GlobalContext } from './global';
import { fetch as fetchCluster } from './objects/cluster';
import { fetch as fetchNamespaces } from './objects/namespace';
import { fetch as fetchIngresses } from './objects/ingress';
import { fetch as fetchDeployment } from './objects/deployment';
import { fetch as fetchStatefulSet } from './objects/statefulset';
import { generateNamespace } from './namespaces';

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

  const baseIri = config?.baseIri ? config.baseIri : defaultBaseIri;
  const baseIriOci = config?.baseIriOci ? config.baseIriOci : defaultBaseIriOci;

  const context: GlobalContext = {
    cluster,
    baseIri,
    baseIriOci,
    ns: generateNamespace(baseIri),
    nsOci: generateNamespace(baseIriOci),
  };

  // list of all API clients that we are using
  const api: APIList = {
    apps: kc.makeApiClient(AppsV1Api),
    core: kc.makeApiClient(CoreV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  };

  // fetch all different objects
  await fetchCluster(context, api, ptr);
  await fetchNamespaces(context, api, ptr);
  await fetchIngresses(context, api, ptr);
  await fetchDeployment(context, api, ptr);
  await fetchStatefulSet(context, api, ptr);

  return ptr.dataset;
}
