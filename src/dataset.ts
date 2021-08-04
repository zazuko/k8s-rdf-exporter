/* eslint-disable import/prefer-default-export */
import { CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import $rdf from 'rdf-ext';
import DatasetExt from 'rdf-ext/lib/Dataset';

import { buildConfig, Config } from './config';
import { APIList } from './global';
import { fetch as fetchIngresses } from './objects/ingress';
import { fetch as fetchNamespaces } from './objects/namespace';

export async function buildDataset(config?: Config): Promise<DatasetExt> {
  const ptr = clownface({ dataset: $rdf.dataset() });
  const kc = buildConfig(config);

  const api: APIList = {
    core: kc.makeApiClient(CoreV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  };

  await fetchNamespaces(api, ptr);
  await fetchIngresses(api, ptr);

  return ptr.dataset;
}
