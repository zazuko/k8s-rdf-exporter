#!/usr/bin/env node

import { turtle } from "@tpluscode/rdf-string";
import { Command } from "commander";
import { Config, defaultBaseIri, defaultBaseIriOci } from "./config";
import { buildDataset } from "./dataset";

(async () => {
  const program = new Command();

  program
    .option("-n, --namespace <name>", "name of the namespace to use")
    .option("-b, --base-iri <baseIRI>", "baseIRI to use for resources")
    .option("--base-iri-oci <baseIRI>", "baseIRI to use for OCI resources")
    .option("-u, --api-url <url>", "API URL")
    .option("-c, --cluster-name <name>", "Kubernetes cluster name")
    .option("-p, --certificate-path <path>", "CA Certificate path")
    .option("-t, --service-token <token>", "service token to use")
    .option("--version", "display current version");

  program.parse(process.argv);
  const options = program.opts();

  if (options.version) {
    console.log(process.env.npm_package_version || "dirty");
    process.exit(0);
  }

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
  };

  // specify the namespace if needed
  if (options.namespace) {
    config.namespace = `${options.namespace}`;
  }

  // build the dataset using options from CLI
  const dataset = await buildDataset(config);

  // print the dataset in turtle format directly in the console
  const ttl = turtle`${dataset}`.toString();
  console.log(ttl);
})();
