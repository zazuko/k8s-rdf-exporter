import { NamedNode } from "@rdfjs/types";
import { ClownfacePtr } from "../global.js";
import { rdf, rdfs, oci, GeneratedNamespace } from "../namespaces.js";

export type OCI = {
  registry: string;
  path: string;
  tag: string;
};

/**
 * Build IRI for a OCI item.
 *
 * @param ns IRI namespace.
 * @param name name of the deployment.
 * @returns IRI for a cluster.
 */
export const iri = (ns: GeneratedNamespace, name: string): NamedNode =>
  ns[`${name}`];

export const toOCI = (img: string): OCI | null => {
  const parts = img.match(
    /^(?:(?<registry>[a-z0-9-]+\.[a-z0-9.-]+(?::[0-9]+)?)\/)?(?<path>(?:[0-9a-z_-]+)(?:\/(?:[0-9a-z._-]+))*)(?::(?<tag>[0-9a-z._-]+))?(?:@(?<digest>.+))?$/
  );
  if (!parts || !parts.groups) {
    return null;
  }

  let { registry, path, tag } = parts.groups;
  if (!path) {
    return null;
  }
  if (!path.includes("/")) {
    path = `library/${path}`;
  }
  if (!registry) {
    registry = "docker.io";
  }
  if (!tag) {
    tag = "latest";
  }

  return {
    registry,
    path,
    tag,
  };
};

export const toString = (ociObject?: OCI | null): string | null => {
  if (!ociObject) {
    return null;
  }
  return `${ociObject.registry}/${ociObject.path}:${ociObject.tag}`;
};

export const standardize = (img: string): string | null => toString(toOCI(img));

export const process = (
  ns: GeneratedNamespace,
  img: string,
  ptr: ClownfacePtr
): string | null => {
  const ociData = toOCI(img);
  if (!ociData) {
    return null;
  }

  const registry = ociData.registry;
  const repository = `${ociData.registry}/${ociData.path}`;
  const image = toString(ociData);

  if (!registry || !repository || !image) {
    return null;
  }

  ptr
    .namedNode(iri(ns, image))
    .addOut(rdf.type, oci.Image)
    .addOut(oci.repository, iri(ns, repository))
    .addOut(rdfs.label, image);

  ptr
    .namedNode(iri(ns, repository))
    .addOut(rdf.type, oci.Repository)
    .addOut(oci.registry, iri(ns, registry))
    .addOut(rdfs.label, repository);

  ptr
    .namedNode(iri(ns, registry))
    .addOut(rdf.type, oci.Registry)
    .addOut(rdfs.label, registry);

  return image;
};
