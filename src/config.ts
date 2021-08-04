import { KubeConfig } from '@kubernetes/client-node';

export type Config = {
  clusterName: string;
  apiUrl: string;
  serviceToken: string;
  namespace?: string;
  certificatePath: string;
};

export const buildConfig = (config?: Config): KubeConfig => {
  const kc = new KubeConfig();

  if (!config) {
    kc.loadFromDefault();
    return kc;
  }

  const userName = `${config.clusterName}-rdf-user`;
  const contextName = `${config.clusterName}-rdf-context`;

  kc.addCluster({
    name: config.clusterName,
    server: config.apiUrl,
    skipTLSVerify: false,
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
