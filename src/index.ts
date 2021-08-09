import { turtle } from '@tpluscode/rdf-string';
import { buildDataset } from './dataset';

(async () => {
  // build the dataset using default configuration
  const dataset = await buildDataset();

  // print the dataset in turtle format directly in the console
  const ttl = turtle`${dataset}`.toString();
  console.log(ttl);
})();
