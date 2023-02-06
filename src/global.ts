import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import clownface from 'clownface';
import DatasetExt from 'rdf-ext/lib/Dataset';
import { GeneratedNamespace } from './namespaces';

/**
 * Global context.
 */
export type GlobalContext = {
  cluster: string;

  baseIri: string;
  ns: GeneratedNamespace;

  baseIriOci: string;
  nsOci: GeneratedNamespace;
};

/**
 * List of all API clients types.
 */
export type APIList = {
  apps: AppsV1Api,
  core: CoreV1Api,
  networking: NetworkingV1Api,
};

/**
 * Alias for the clownface pointer type.
 */
export type ClownfacePtr = clownface.AnyPointer<clownface.AnyContext, DatasetExt>;
