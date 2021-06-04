class Vertex {
	constructor(name, successors) {
		this.name = name;
		this.successors = successors;
		this.reset();
	}

	reset() {
		this.index = -1;
		this.lowLink = -1;
		this.onStack = false;
		this.visited = false;
	}
}


class Graph {
	constructor() {
		this.vertices = {};
	}

	add(key, descendants) {
		descendants = Array.isArray(descendants) ? descendants : [descendants];

		const successors = descendants.map((key) => {
			if (!this.vertices[key]) {
				this.vertices[key] = new Vertex(key, []);
			}
			return this.vertices[key];
		});

		if (!this.vertices[key]) {
			this.vertices[key] = new Vertex(key);
		}

		this.vertices[key].successors = successors.concat([]).reverse();
		return this;
	}

	reset() {
		Object.keys(this.vertices).forEach((key) => {
			this.vertices[key].reset();
		});
	}

	addAndVerify(key, descendants) {
		this.add(key, descendants);
		const cycles = this.getCycles();
		if (cycles.length) {
			let message = `Detected ${cycles.length} cycle${cycles.length === 1 ? '' : 's'}:`;
			message += '\n' + cycles.map((scc) => {
				const names = scc.map(v => v.name);
				return `  ${names.join(' -> ')} -> ${names[0]}`;
			}).join('\n');

			const err = new Error(message);
			err.cycles = cycles;
			throw err;
		}

		return this;
	}

	dfs(key, visitor) {
		this.reset();
		const stack = [this.vertices[key]];
		let v;
		while (v = stack.pop()) {
			if (v.visited) {
				continue;
			}

			//pre-order traversal
			visitor(v);
			v.visited = true;

			v.successors.forEach(w => stack.push(w));
		}
	}

	getDescendants(key) {
		const descendants = [];
		let ignore = true;
		this.dfs(key, (v) => {
			if (ignore) {
				//ignore the first node
				ignore = false;
				return;
			}
			descendants.push(v.name);
		});

		return descendants;
	}

	hasCycle() {
		return this.getCycles().length > 0;
	}

	getStronglyConnectedComponents() {
		const V = Object.keys(this.vertices).map((key) => {
			this.vertices[key].reset();
			return this.vertices[key];
		});

		let index = 0;
		const stack = [];
		const components = [];

		const stronglyConnect = (v) => {
			v.index = index;
			v.lowLink = index;
			index++;
			stack.push(v);
			v.onStack = true;

			v.successors.forEach((w) => {
				if (w.index < 0) {
					stronglyConnect(w);
					v.lowLink = Math.min(v.lowLink, w.lowLink);
				} else if (w.onStack) {
					v.lowLink = Math.min(v.lowLink, w.index);
				}
			});

			if (v.lowLink === v.index) {
				const scc = [];
				let w;
				do {
					w = stack.pop();
					w.onStack = false;
					scc.push(w);
				} while (w !== v);

				components.push(scc);
			}
		};

		V.forEach(function(v) {
			if (v.index < 0) {
				stronglyConnect(v);
			}
		});

		return components;
	}

	getCycles() {
		return this.getStronglyConnectedComponents().filter((scc) => {
			if (scc.length > 1) {
				return true;
			}

			const startNode = scc[0];
			return startNode && startNode.successors.some(node => node === startNode);
		});
	}

	clone() {
		const graph = new Graph();

		Object.keys(this.vertices).forEach((key) => {
			const v = this.vertices[key];
			graph.add(v.name, v.successors.map((w) => {
				return w.name;
			}));
		});

		return graph;
	}

	toDot() {
		const V = this.vertices;
		const lines = [ 'digraph {' ];

		this.getCycles().forEach((scc, i) => {
			lines.push('  subgraph cluster' + i + ' {');
			lines.push('    color=red;');
			lines.push('    ' + scc.map(v => v.name).join('; ') + ';');
			lines.push('  }');
		});

		Object.keys(V).forEach((key) => {
			const v = V[key];
			if (v.successors.length) {
				v.successors.forEach((w) => {
					lines.push(`  ${v.name} -> ${w.name}`);
				});
			}
		});

		lines.push('}');
		return lines.join('\n') + '\n';
	}
}

// function Graph(){ 
//     this.adjList = {}
// }

// Graph.prototype.addVertex = function (vertex) {
//     this.adjList[vertex] = []
// }

// Graph.prototype.addEdge = function (source,destination){
//     this.adjList[source].push(destination)
// }

// Graph.prototype.dfs = function() {
//     const nodes = Object.keys(this.adjList)

//     const visited = {}

//     for (let i = 0; i < nodes.length; i++){
//         const node = node[i];
//         this._dfsUtil(node,visited)
//     }
// }

// Graph.prototype._dfsUtil = function(source, visited){
//     if(!visited[source]){
//         visited[source] = true  
//         const neighbors = this.adjList[source]
//         for(let i=0; i < neighbors.length; i++){
//             const neighbor = neighbors[i]
//             this._dfsUtil(neighbor,visited)
//         }
//     }
// }

// Graph.prototype.hasCycle = function(){
//     const graphNodes = Object.keys(this.adjList)

//     const visited = {}
//     const recStack = {}

//     for(let i = 0; i < graphNodes.length; i++){
//         const node = graphNodes[i]
//         if(this._detectCycleUtil(node,visited,recStack)){
//             return true
//         }
//     }

//     return false
// }

// Graph.prototype._detectCycleUtil = function(node,visited,stack){
//     if(!visited[node]){
//         visited[node] = true
//         stack[node] = true
//         const nodeNeighbors = this.adjList[node]
//         for(let i = 0; i < nodeNeighbors.length; i++){
//             const currentNode = nodeNeighbor[i]
//             console.log('parent',node,'child',currentNode);
//             if(!visited[currentNode] && this._detectCycleUtil(currentNode,visited,stack)){
//                 return true;
//             }else if(stack[currentNode]){
//                 return true;
//             }
//             stack[node]
//             return false;
//         }
//     }
// }
