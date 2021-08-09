import { CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import DatasetExt from 'rdf-ext/lib/Dataset';

/**
 * List of all API clients types.
 */
export type APIList = {
  core: CoreV1Api,
  networking: NetworkingV1Api,
};

/**
 * Alias for the clownface pointer type.
 */
export type ClownfacePtr = clownface.AnyPointer<clownface.AnyContext, DatasetExt>;
