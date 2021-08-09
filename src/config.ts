import { KubeConfig } from '@kubernetes/client-node';

/**
 * Configuration object to get access to cluster information.
 */
export type Config = {
  clusterName: string;
  apiUrl: string;
  serviceToken: string;
  namespace?: string;
  certificatePath: string;
};

/**
 * Build a Kubernetes configuration.
 * @param config configuration to use instead of the default one.
 * @returns Kubernetes configuration.
 */
export const buildConfig = (config?: Config): KubeConfig => {
  const kc = new KubeConfig();

  // load default configuration of no custom configuration object was given
  if (!config) {
    kc.loadFromDefault();
    return kc;
  }

  const userName = `${config.clusterName}-rdf-user`;
  const contextName = `${config.clusterName}-rdf-context`;

  // build the configuration: add cluster and user, create a context from them and set it as default
  kc.addCluster({
    name: config.clusterName,
    server: config.apiUrl,
    skipTLSVerify: false,
    caFile: config.certificatePath,
  });
  kc.addUser({
    name: userName,
    token: config.serviceToken,
  });
  kc.addContext({
    name: contextName,
    cluster: config.clusterName,
    user: userName,
    namespace: config.namespace,
  });
  kc.setCurrentContext(contextName);

  return kc;
};
