import namespace from "@rdfjs/namespace";

import env from "@zazuko/env";

const namespaces = env.ns;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rdf: any = namespaces.rdf;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rdfs: any = namespaces.rdfs;

export const generateNamespace = (ns: string) => namespace(ns);
export type GeneratedNamespace = ReturnType<typeof generateNamespace>;

export const k8s: GeneratedNamespace = generateNamespace(
  "https://k8s.described.at/"
);
export const oci: GeneratedNamespace = generateNamespace(
  "https://oci.described.at/"
);
