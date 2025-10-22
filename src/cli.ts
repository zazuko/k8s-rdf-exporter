#!/usr/bin/env node

import { turtle } from "@tpluscode/rdf-string";
import { Command } from "commander";
import { Config, defaultBaseIri, defaultBaseIriOci } from "./config.js";
import { buildDataset } from "./dataset.js";

(async () => {
  const program = new Command();

  program
    .option(
      "-n, --namespace <name>",
      "name of the namespace to use by default for querying the cluster"
    )
    .option(
      "--generate-namespaces",
      "generate namespace objects instead of querying them from the cluster, to be used in combination with --namespaces option"
    )
    .option("--namespaces <namespaces...>", "namespaces to query")
    .option("-b, --base-iri <baseIRI>", "baseIRI to use for resources")
    .option("--base-iri-oci <baseIRI>", "baseIRI to use for OCI resources")
    .option("-u, --api-url <url>", "API URL")
    .option("-c, --cluster-name <name>", "Kubernetes cluster name")
    .option("-p, --certificate-path <path>", "CA Certificate path")
    .option("-t, --service-token <token>", "service token to use")
    .option("-k, --skip-tls-verify", "skip TLS verification");

  program.parse(process.argv);
  const options = program.opts();

  const namespacesOption: string[] = options.namespaces
    ? options.namespaces
    : [];
  const namespaces = namespacesOption.flatMap((ns) =>
    ns.split(",").map((n) => n.trim())
  );

  // build the configuration object to use
  const config: Config = {
    apiUrl: options.apiUrl ? `${options.apiUrl}` : undefined,
    certificatePath: options.certificatePath
      ? `${options.certificatePath}`
      : undefined,
    clusterName: options.clusterName ? `${options.clusterName}` : undefined,
    serviceToken: options.serviceToken ? `${options.serviceToken}` : undefined,
    baseIri: options.baseIri ? `${options.baseIri}` : defaultBaseIri,
    baseIriOci: options.baseIriOci
      ? `${options.baseIriOci}`
      : defaultBaseIriOci,
    skipTLSVerify: options.skipTlsVerify ? true : false,
    namespaces,
    generateNamespaces: false,
  };

  // specify the namespace if needed
  if (options.namespace) {
    config.namespace = `${options.namespace}`;
  }

  if (options.generateNamespaces) {
    if (namespaces.length === 0) {
      console.error(
        "Error: --generate-namespaces option requires at least one namespace to be specified using --namespaces option."
      );
      process.exit(1);
    }

    config.generateNamespaces = true;
  }

  // build the dataset using options from CLI
  const dataset = await buildDataset(config);

  // print the dataset in turtle format directly in the console
  const ttl = turtle`${dataset}`.toString();
  console.log(ttl);
})();
