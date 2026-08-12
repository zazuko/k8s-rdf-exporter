import { execFileSync } from "node:child_process";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import rdf from "@zazuko/env-node";
import type { DatasetCore, NamedNode, Quad_Object, Term } from "@rdfjs/types";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

/** Path of the built CLI, the entry point every test goes through. */
export const cliPath = `${rootDir}dist/cli.js`;

/** Path of the manifests describing the resources under test. */
export const fixturesPath = fileURLToPath(new URL("fixtures.yaml", import.meta.url));

/** Namespace holding every resource created by the tests. */
export const testNamespace = "k8s-rdf-exporter-test";

const kubectlBin = process.env.KUBECTL ?? "kubectl";

/** Vocabularies produced by the exporter. */
export const k8s = rdf.namespace("https://k8s.described.at/");
export const oci = rdf.namespace("https://oci.described.at/");

export type CommandFailure = Error & {
  status: number | null;
  stdout: string;
  stderr: string;
};

/**
 * Run `kubectl` and return its standard output.
 */
export const kubectl = (...args: string[]): string =>
  execFileSync(kubectlBin, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

/**
 * Run the built CLI and return its standard output.
 * Throws a {@link CommandFailure} when the CLI exits with a non-zero code.
 */
export const runCli = (...args: string[]): string =>
  execFileSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });

/**
 * Parse a Turtle document into a dataset.
 */
export const parseTurtle = async (turtle: string): Promise<DatasetCore> => {
  const quads = rdf.formats.parsers.import(
    "text/turtle",
    Readable.from([turtle])
  );
  if (!quads) {
    throw new Error("no text/turtle parser available");
  }
  return rdf.dataset().import(quads);
};

/**
 * Run the CLI and parse the Turtle it produces.
 */
export const exportDataset = async (...args: string[]): Promise<DatasetCore> =>
  parseTurtle(runCli(...args));

/**
 * Build the IRIs the exporter is expected to mint.
 * These are spelled out rather than imported from the source, so that a change
 * in the IRI scheme is caught by the tests.
 */
export const iris = (cluster: string, base = "urn:k8s:", baseOci = "urn:oci:") => {
  const resource = (path: string): NamedNode => rdf.namedNode(`${base}${path}`);
  const namespacePath = (namespace: string) =>
    `cluster/${cluster}/namespace/${namespace}`;

  return {
    cluster: resource(`cluster/${cluster}`),
    namespace: (namespace: string) => resource(namespacePath(namespace)),
    namespaceResource: (namespace: string, kind: string, name: string) =>
      resource(`${namespacePath(namespace)}/${kind}/${name}`),
    deployment: (namespace: string, name: string) =>
      resource(`${namespacePath(namespace)}/deployment/${name}`),
    deploymentResource: (
      namespace: string,
      deployment: string,
      kind: string,
      name: string
    ) =>
      resource(
        `${namespacePath(namespace)}/deployment/${deployment}/${kind}/${name}`
      ),
    statefulSet: (namespace: string, name: string) =>
      resource(`${namespacePath(namespace)}/statefulset/${name}`),
    ingress: (namespace: string, name: string) =>
      resource(`${namespacePath(namespace)}/ingress/${name}`),
    ingressHost: (namespace: string, ingress: string, host: string) =>
      resource(`${namespacePath(namespace)}/ingress/${ingress}/host/${host}`),
    image: (image: string): NamedNode => rdf.namedNode(`${baseOci}${image}`),
  };
};

/** Literal shorthand, so assertions read close to the Turtle they check. */
export const literal = (value: string): Quad_Object => rdf.literal(value);

/** Number of quads matching a pattern. */
export const count = (
  dataset: DatasetCore,
  subject?: NamedNode,
  predicate?: NamedNode,
  object?: Term
): number =>
  dataset.match(
    subject,
    predicate,
    object as Quad_Object | undefined
  ).size;

/**
 * Wait until `probe` returns a non-empty value, or throw after the timeout.
 */
export const waitFor = async <T>(
  description: string,
  probe: () => T | undefined,
  { timeoutMs = 60_000, intervalMs = 2_000 } = {}
): Promise<T> => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = probe();
    if (value) {
      return value;
    }
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for ${description}`);
    }
    // polling is sequential by nature
    // oxlint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }
};
