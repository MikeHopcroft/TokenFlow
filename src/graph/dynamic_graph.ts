import { Edge, Graph } from './types';

export class DynamicGraph2 implements Graph {
  edgeLists: Edge[][];

  constructor(edgeLists: Edge[][]) {
    this.edgeLists = edgeLists;
  }
}
