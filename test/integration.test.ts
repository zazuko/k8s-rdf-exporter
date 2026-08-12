/**
 * Integration tests: run the built CLI against a real Kubernetes cluster and
 * assert on the RDF it produces.
 *
 * Every resource the tests create is named `k8s-rdf-exporter-test` and removed
 * again once the suite is done. Run them against a throwaway cluster:
 *
 *   npm run test:integration
 *
 * In CI they run against the k3s cluster spawned by the test workflow.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import rdf from "@zazuko/env-node";
import type { DatasetCore } from "@rdfjs/types";

import {
  type CommandFailure,
  count,
  exportDataset,
  fixturesPath,
  iris,
  k8s,
  kubectl,
  literal,
  oci,
  runCli,
  testNamespace,
  waitFor,
} from "./helpers.ts";

const { type } = rdf.ns.rdf;
const { label } = rdf.ns.rdfs;
const { value } = rdf.ns.rdf;

const clusterName = kubectl(
  "config",
  "view",
  "--minify",
  "-o",
  "jsonpath={.clusters[0].name}"
).trim();

const apiUrl = kubectl(
  "config",
  "view",
  "--minify",
  "-o",
  "jsonpath={.clusters[0].cluster.server}"
).trim();

const ns = iris(clusterName);

let workDir: string;

before(() => {
  console.log(
    `running against cluster '${clusterName}' (${apiUrl}), namespace '${testNamespace}'`
  );

  workDir = mkdtempSync(join(tmpdir(), "k8s-rdf-exporter-"));

  kubectl("apply", "-f", fixturesPath);

  // The exporter reads object specs rather than pod status, so it is enough to
  // wait for the API server to have registered the objects.
  kubectl(
    "--namespace",
    testNamespace,
    "wait",
    "--for=create",
    "deployment/test-deployment",
    "statefulset/test-statefulset",
    "ingress/test-ingress",
    "--timeout=60s"
  );
});

after(() => {
  kubectl(
    "delete",
    "-f",
    fixturesPath,
    "--ignore-not-found",
    "--wait=false"
  );
  rmSync(workDir, { recursive: true, force: true });
});

describe("exporting the whole cluster", () => {
  let dataset: DatasetCore;

  before(async () => {
    dataset = await exportDataset();
  });

  it("describes the cluster", () => {
    assert.equal(count(dataset, ns.cluster, type, k8s.Cluster), 1);
    assert.equal(count(dataset, ns.cluster, label, literal(clusterName)), 1);
  });

  it("describes the namespace and links it to the cluster", () => {
    const namespace = ns.namespace(testNamespace);

    assert.equal(count(dataset, namespace, type, k8s.Namespace), 1);
    assert.equal(count(dataset, namespace, label, literal(testNamespace)), 1);
    assert.equal(count(dataset, namespace, k8s.cluster, ns.cluster), 1);
  });

  it("exports namespaces the test did not create", () => {
    assert.equal(count(dataset, ns.namespace("kube-system"), type, k8s.Namespace), 1);
  });

  it("exports namespace labels and annotations", () => {
    const annotation = ns.namespaceResource(
      testNamespace,
      "annotation",
      "test-annotation"
    );
    assert.equal(count(dataset, annotation, type, k8s.Annotation), 1);
    assert.equal(
      count(dataset, annotation, value, literal("namespace-annotation-value")),
      1
    );
    assert.equal(
      count(dataset, ns.namespace(testNamespace), k8s.annotation, annotation),
      1
    );

    const namespaceLabel = ns.namespaceResource(
      testNamespace,
      "label",
      "test-label"
    );
    assert.equal(count(dataset, namespaceLabel, type, k8s.Label), 1);
    assert.equal(
      count(dataset, namespaceLabel, value, literal("namespace-label-value")),
      1
    );
  });

  it("describes the deployment", () => {
    const deployment = ns.deployment(testNamespace, "test-deployment");

    assert.equal(count(dataset, deployment, type, k8s.Deployment), 1);
    assert.equal(count(dataset, deployment, label, literal("test-deployment")), 1);
    assert.equal(
      count(dataset, deployment, k8s.namespace, ns.namespace(testNamespace)),
      1
    );
  });

  it("exports deployment labels and annotations", () => {
    const deploymentLabel = ns.deploymentResource(
      testNamespace,
      "test-deployment",
      "label",
      "test-label"
    );
    assert.equal(
      count(dataset, deploymentLabel, value, literal("deployment-label-value")),
      1
    );

    const annotation = ns.deploymentResource(
      testNamespace,
      "test-deployment",
      "annotation",
      "test-annotation"
    );
    assert.equal(
      count(dataset, annotation, value, literal("deployment-annotation-value")),
      1
    );
  });

  it("describes the statefulset", () => {
    const statefulSet = ns.statefulSet(testNamespace, "test-statefulset");

    assert.equal(count(dataset, statefulSet, type, k8s.StatefulSet), 1);
    assert.equal(
      count(dataset, statefulSet, k8s.namespace, ns.namespace(testNamespace)),
      1
    );
    assert.equal(
      count(
        dataset,
        statefulSet,
        k8s.image,
        ns.image("docker.io/library/redis:8.2-alpine")
      ),
      1
    );
  });

  it("describes the ingress and its host", () => {
    const ingress = ns.ingress(testNamespace, "test-ingress");
    const host = ns.ingressHost(
      testNamespace,
      "test-ingress",
      "test.example.com"
    );

    assert.equal(count(dataset, ingress, type, k8s.Ingress), 1);
    assert.equal(count(dataset, ingress, k8s.host, host), 1);
    assert.equal(count(dataset, host, type, k8s.Host), 1);
    assert.equal(count(dataset, host, label, literal("test.example.com")), 1);
  });

  it("normalizes container images into the OCI vocabulary", () => {
    // `nginx:1.29-alpine` in the manifest, with neither registry nor path
    const image = ns.image("docker.io/library/nginx:1.29-alpine");
    const repository = ns.image("docker.io/library/nginx");
    const registry = ns.image("docker.io");

    assert.equal(
      count(
        dataset,
        ns.deployment(testNamespace, "test-deployment"),
        k8s.image,
        image
      ),
      1
    );
    assert.equal(count(dataset, image, type, oci.Image), 1);
    assert.equal(count(dataset, image, oci.repository, repository), 1);
    assert.equal(count(dataset, repository, type, oci.Repository), 1);
    assert.equal(count(dataset, repository, oci.registry, registry), 1);
    assert.equal(count(dataset, registry, type, oci.Registry), 1);
    assert.equal(
      count(dataset, registry, label, literal("docker.io")),
      1
    );
  });
});

describe("restricting the export to some namespaces", () => {
  it("only exports the requested namespace", async () => {
    const dataset = await exportDataset("--namespaces", testNamespace);

    assert.equal(count(dataset, ns.namespace(testNamespace), type, k8s.Namespace), 1);
    assert.equal(
      count(dataset, ns.deployment(testNamespace, "test-deployment"), type, k8s.Deployment),
      1
    );
    assert.equal(count(dataset, ns.namespace("kube-system")), 0);
    assert.equal(count(dataset, ns.deployment("kube-system", "coredns")), 0);
  });

  it("splits a comma separated list of namespaces", async () => {
    const dataset = await exportDataset(
      "--namespaces",
      `${testNamespace},default`
    );

    assert.equal(count(dataset, ns.namespace(testNamespace), type, k8s.Namespace), 1);
    assert.equal(count(dataset, ns.namespace("default"), type, k8s.Namespace), 1);
    assert.equal(count(dataset, ns.namespace("kube-system")), 0);
  });
});

describe("generating namespaces instead of querying them", () => {
  it("generates the namespace but still queries its resources", async () => {
    const dataset = await exportDataset(
      "--generate-namespaces",
      "--namespaces",
      testNamespace
    );

    assert.equal(count(dataset, ns.namespace(testNamespace), type, k8s.Namespace), 1);
    // a generated namespace carries nothing from the cluster
    assert.equal(
      count(
        dataset,
        ns.namespaceResource(testNamespace, "annotation", "test-annotation")
      ),
      0
    );
    assert.equal(
      count(dataset, ns.deployment(testNamespace, "test-deployment"), type, k8s.Deployment),
      1
    );
  });

  it("fails when no namespace is given", () => {
    let failure: CommandFailure | undefined;
    try {
      runCli("--generate-namespaces");
    } catch (error) {
      failure = error as CommandFailure;
    }

    assert.ok(failure, "expected the CLI to exit with an error");
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /requires at least one namespace/);
  });
});

describe("custom base IRIs", () => {
  it("mints every IRI under the configured bases", async () => {
    const base = "https://example.org/k8s/";
    const baseOci = "https://example.org/oci/";
    const custom = iris(clusterName, base, baseOci);

    const dataset = await exportDataset(
      "--namespaces",
      testNamespace,
      "--base-iri",
      base,
      "--base-iri-oci",
      baseOci
    );

    assert.equal(count(dataset, custom.namespace(testNamespace), type, k8s.Namespace), 1);
    assert.equal(
      count(dataset, custom.image("docker.io/library/nginx:1.29-alpine"), type, oci.Image),
      1
    );

    // nothing is left under the default bases
    const defaults = [...dataset].filter(
      (quad) =>
        quad.subject.value.startsWith("urn:k8s:") ||
        quad.subject.value.startsWith("urn:oci:")
    );
    assert.deepEqual(defaults, []);
  });
});

describe("explicit credentials", () => {
  it("uses the ServiceAccount token instead of the kubeconfig", async () => {
    const encodedToken = await waitFor("the ServiceAccount token secret", () =>
      kubectl(
        "--namespace",
        testNamespace,
        "get",
        "secret",
        testNamespace,
        "-o",
        "jsonpath={.data.token}"
      ).trim()
    );

    const encodedCertificate = kubectl(
      "--namespace",
      testNamespace,
      "get",
      "secret",
      testNamespace,
      "-o",
      "jsonpath={.data.ca\\.crt}"
    ).trim();

    const certificatePath = join(workDir, "ca.crt");
    writeFileSync(
      certificatePath,
      Buffer.from(encodedCertificate, "base64")
    );

    // A cluster name that is not the kubeconfig one proves the explicit
    // configuration is the one in use.
    const explicitCluster = "integration-test-cluster";
    const explicit = iris(explicitCluster);

    const dataset = await exportDataset(
      "--api-url",
      apiUrl,
      "--cluster-name",
      explicitCluster,
      "--certificate-path",
      certificatePath,
      "--service-token",
      Buffer.from(encodedToken, "base64").toString("utf8"),
      "--namespaces",
      testNamespace
    );

    assert.equal(count(dataset, explicit.cluster, type, k8s.Cluster), 1);
    assert.equal(
      count(dataset, explicit.namespace(testNamespace), type, k8s.Namespace),
      1
    );
    assert.equal(
      count(
        dataset,
        explicit.deployment(testNamespace, "test-deployment"),
        type,
        k8s.Deployment
      ),
      1
    );
    assert.equal(count(dataset, ns.cluster), 0);
  });
});

describe("the shipped manifests", () => {
  it("are valid against the cluster", () => {
    // server side validation only: this must not create anything, since a real
    // `k8s-rdf-exporter` ServiceAccount may already be deployed on the cluster
    const output = kubectl(
      "apply",
      "-k",
      new URL("../k8s", import.meta.url).pathname,
      "--dry-run=server"
    );

    assert.match(output, /serviceaccount\/k8s-rdf-exporter/);
    assert.match(output, /clusterrolebinding\.rbac\.authorization\.k8s\.io\/k8s-rdf-exporter/);
  });
});
