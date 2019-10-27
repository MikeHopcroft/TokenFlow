// import { Edge, Graph } from './types';

// // DESIGN ISSUES
// //
// // error-prone: this.current vs this.left.length
// // error-prone: potential for this.current to get out of sync
// // consistent meaning of this.right === []
// //   complete path or no path possible?

// export class GraphWalker {
//     // Graph being walked.
//     private graph: Graph;

//     // Cached index of the last vertex in this.graph.
//     private lastVertex: number;

//     // Prefix of current highest scoring path.
//     left: Edge[];

//     // Suffix of current highest scoring path.
//     right: Edge[];

//     // Index of vertex at end of this.left.
//     // TODO: BUGBUG: INVESTIGATE. Why is this.left.length !== this.current?
//     current: number;

//     // Stack of checkpoint markers corresponding to edges in this.left.
//     // Extended on each call to advance(). Trimmed on each call to retreat().
//     // Used in the implementation of the restore() method, which retreats()
//     // to the last checkpointed edge. DESIGN NOTE: after constructor(), 
//     // checkpoints always starts with a single `true` entry. This entry
//     // halts the restore() process once this.left === [].
//     private checkpoints: boolean[];

//     constructor(graph: Graph) {
//         this.graph = graph;
//         this.lastVertex = graph.lastVertex();

//         this.left = [];
//         this.current = 0;
//         this.right = graph.findPath(this.left, this.current);

//         this.checkpoints = [ true ];
//     }

//     // Returns true when the current path extends to the final vertex.
//     complete(): boolean {
//         return this.current === this.lastVertex;
//     }

//     // Attempt to extend the current path by advancing forward along the next
//     // Edge in the top-scoring path through the current vertex. Returns true
//     // if it was possible to extend the path. Otherwise returns false.
//     advance(): boolean {
//         const edge = this.right.shift();
//         if (edge !== undefined) {
//             this.checkpoints.push(false);
//             this.current += edge.length;
//             this.left.push(edge);
//             return true;
//         }
//         return false;
//     }

//     // Attempt to move backwards one edge to the previous vertex. Before
//     // moving, clear the checkpoint on the current vertex. When `reset` is
//     // true, reinstate edges discarded from the previous vertex.
//     retreat(reset: boolean) {
//         this.retreatHelper(reset);
//         if (reset) {
//             const path = this.graph.findPath(this.left, this.current);
//             this.right = path; //path.slice(this.left.length);
//         }
//     }
    
//     private retreatHelper(reset: boolean) {
//         const edge = this.left.pop();
        
//         if (edge === undefined) {
//             throw TypeError('GraphWalker.retreatHelper(): attempt to retreat from first vertex.');
//         }
//         else {
//             if (reset) {
//                 for (const e of this.graph.edgeLists[this.current]) {
//                     e.discarded = false;
//                 }
//             }

//             this.checkpoints.pop();
//             this.current -= edge.length;

//             // Need to update this.right in case caller does not recompute path.
//             this.right.unshift(edge);
//         }
//     }

//     // Attempts to remove the most recently traversed Edge from the graph
//     // and then advances from the previous vertex along the new top-scoring
//     // path. Returns the new Edge.
//     //
//     // NOTE: this method always returns an edge because
//     //   1. discard() can never retreat to the last vertex as this would
//     //      imply a vertex after the last vertex.
//     //   2. discard() is not allowed to remove the default edge.
//     //
//     // NOTE: edges are not necessarily removed in order of decreasing score.
//     // Need to mark edges as removed.
//     discard(): boolean {
//         if (this.right.length === 0) {
//             throw TypeError('GraphWalker.discard(): no edges to discard.');   
//         }

//         this.right[0].discarded = true;
//         this.right = this.graph.findPath(this.left, this.current); //.slice(this.left.length);

//         // Since this.right.length was initially not zero, a length of 0 now
//         // implies that we failed to find a path.
//         return this.right.length > 0;
//     }

//     // Marks the current vertex as checkpointed for possible later use by the
//     // restore() method.
//     checkpoint() {
//         this.checkpoints[this.checkpoints.length - 1] = true;
//     }

//     // Retreats to the most recently checkpointed vertex, removing checkpoint
//     // markers along the way.
//     // NOTE: Attempting to restore from an empty stack will result in an
//     // exception.
//     restore(reset: boolean) {
//         if (this.left.length > 0) {
//             while (this.left.length !== 0) {
//                 this.retreatHelper(reset);

//                 if (this.checkpoints[this.checkpoints.length - 1]) {
//                     break;
//                 }
//             }
//             if (reset) {
//                 this.right = this.graph.findPath(this.left, this.current); //.slice(this.left.length);
//             }
//         }
//         else {
//             throw TypeError('GraphWalker.restore(): attempt to restore from first vertex.');   
//         }
//     }

//     currentEdge(): Edge {
//         // Current edge is stored on vertex before `this.current`.
//         return this.left[this.left.length - 1];
//     }

//     currentEdgeScore(): number {
//         return this.currentEdge().score;
//     }

//     currentPathScore(): number {
//         return this.graph.score();
//     }
// }