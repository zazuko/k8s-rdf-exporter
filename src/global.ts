import { AppsV1Api, CoreV1Api, NetworkingV1Api } from "@kubernetes/client-node";
import { GeneratedNamespace } from "./namespaces.js";
import { DatasetCore } from "@rdfjs/types";
import { AnyContext, AnyPointer } from "clownface";

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
  apps: AppsV1Api;
  core: CoreV1Api;
  networking: NetworkingV1Api;
};

/**
 * Alias for the clownface pointer type.
 */
export type ClownfacePtr = AnyPointer<AnyContext, DatasetCore>;
