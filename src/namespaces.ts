import namespace from '@rdfjs/namespace';

export { rdf, rdfs } from '@tpluscode/rdf-ns-builders';

export const generateNamespace = (ns: string) => namespace(ns);
export type GeneratedNamespace = ReturnType<typeof generateNamespace>;

export const k8s: GeneratedNamespace = generateNamespace('https://k8s.described.at/');
export const oci: GeneratedNamespace = generateNamespace('https://oci.described.at/');
