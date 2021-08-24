import { NamedNode } from '@rdfjs/types';
import { ClownfacePtr } from '../global';
import * as ns from '../namespaces';

export type OCI = {
  registry: string;
  path: string;
  tag: string;
};

/**
 * Build IRI for a OCI item.
 *
 * @param name name of the deployment.
 * @returns IRI for a cluster.
 */
export const iri = (name: string): NamedNode => ns.oci[`${name}`];

export const toOCI = (img: string): OCI | null => {
  const parts = img.match(
    /^(?:(?<registry>[a-z0-9-]+\.[a-z0-9.-]+(?::[0-9]+)?)\/)?(?<path>(?:[0-9a-z_-]+)(?:\/(?:[0-9a-z_-]+))*)(?::(?<tag>[0-9a-z._-]+))?(?:@(?<digest>.+))?$/,
  );
  if (!parts || !parts.groups) {
    return null;
  }

  let { registry, path, tag } = parts.groups;
  if (!path) {
    return null;
  }
  if (!path.includes('/')) {
    path = `library/${path}`;
  }
  if (!registry) {
    registry = 'docker.io';
  }
  if (!tag) {
    tag = 'latest';
  }

  return {
    registry,
    path,
    tag,
  };
};

export const toString = (oci?: OCI | null): string | null => {
  if (!oci) {
    return null;
  }
  return `${oci.registry}/${oci.path}:${oci.tag}`;
};

export const standardize = (img: string): string | null => toString(toOCI(img));

export const process = (img: string, ptr: ClownfacePtr): string | null => {
  const oci = toOCI(img);
  if (!oci) {
    return null;
  }

  const registry = oci.registry;
  const repository = `${oci.registry}/${oci.path}`;
  const image = toString(oci);

  if (!registry || !repository || !image) {
    return null;
  }

  ptr
    .namedNode(iri(image))
    .addOut(ns.rdf.type, ns.oci.Image)
    .addOut(ns.oci.repository, iri(repository))
    .addOut(ns.rdfs.label, image);

  ptr
    .namedNode(iri(repository))
    .addOut(ns.rdf.type, ns.oci.Repository)
    .addOut(ns.oci.registry, iri(registry))
    .addOut(ns.rdfs.label, repository);

  ptr
    .namedNode(iri(registry))
    .addOut(ns.rdf.type, ns.oci.Registry)
    .addOut(ns.rdfs.label, registry);

  return image;
};
