import { turtle } from '@tpluscode/rdf-string';
import { buildDataset } from './dataset'

(async () => {
  const dataset = await buildDataset()

  const ttl = turtle`${dataset}`.toString();
  console.log(ttl);
})();
