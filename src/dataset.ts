import { KubeConfig, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import $rdf from 'rdf-ext';

import { APIList } from './global';
import { fetch as fetchIngresses } from './objects/ingress';
import { fetch as fetchNamespaces } from './objects/namespace';

export async function buildDataset() {
  const ptr = clownface({ dataset: $rdf.dataset() });

  const kc = new KubeConfig();
  kc.loadFromDefault();

  const api: APIList = {
    core: kc.makeApiClient(CoreV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  };

  await fetchNamespaces(api, ptr);
  await fetchIngresses(api, ptr);

  return ptr.dataset
};
