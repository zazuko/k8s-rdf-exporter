import { turtle } from '@tpluscode/rdf-string';
import { Command } from 'commander';
import { Config } from './config';
import { buildDataset } from './dataset';

(async () => {
  const program = new Command();

  program
    .option('-n, --namespace <name>', 'name of the namespace to use')
    .requiredOption('-u, --api-url <url>', 'API URL')
    .requiredOption('-c, --cluster-name <name>', 'Kubernetes cluster name')
    .requiredOption('-p, --certificate-path <path>', 'CA Certificate path')
    .requiredOption('-t, --service-token <token>', 'service token to use');

  program.parse(process.argv);
  const options = program.opts();

  // build the configuration object to use
  const config: Config = {
    apiUrl: `${options.apiUrl}`,
    certificatePath: `${options.certificatePath}`,
    clusterName: `${options.clusterName}`,
    serviceToken: `${options.serviceToken}`,
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
