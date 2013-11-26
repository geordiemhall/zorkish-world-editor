/* 
 * Graph
 *
 * Controller for the graph
 * Provides a graphical view of the world that can be manipulated
 * and various nodes can be selected, with their details showing
 * in the sidebar
 * 
 * @geordiemhall
======================================================= */

;(function($, window){

	
	// Expose ourselves
	window.Graph = function(opts){
		return new graph(opts)
	}

	window.addNewlines = function(str, maxChars) {

		var result = '';

		while (str) {
		    result += str.substring(0, maxChars) + '\n';
		    str = str.substring(maxChars);
		}

		return result.trim();

	}

	var defaults = {
		$workArea: null,
		sidebar: null,
		world: null
	}

	var classes = {
		disabledPrompt: 'text-muted',
		disabledShow: 'show-prompt'
	}

	var selectors = $.extend({}, classes)
	$.each(selectors, function(i, d){ selectors[i] = '.' + d })



	/**
	* Constructor
	*/


	var graph = function(opts){

		this.opts = $.extend(true, {}, defaults, opts || {})

		if (!this.opts.$workArea.length){
			console.error('Graph has no element')
			return
		}

		this.init()

	}



	/**
	* Init
	*/

	graph.prototype.init = function(){

		var self = this

		self.world = self.opts.world
		self.sidebar = self.opts.sidebar
		self.$workArea = self.opts.$workArea
		self.$disabledPrompt = self.$workArea.find(selectors.disabledPrompt)

		self.worldNode = null


		if (!self.world){
			self.disable()
		}

		self.initSVG()

	}

	graph.prototype.disable = function(){

		this.$disabledPrompt.addClass(classes.disabledShow)
		this.sidebar.disable()

	}

	graph.prototype.enable = function(){

		this.$disabledPrompt.removeClass(classes.disabledShow)
		this.sidebar.enable()

	}






	/**
	* World loading
	*/


	graph.prototype.initWithWorld = function(world, filename){

		var self = this

		self.filename = filename // for saving later
		
		self.loadWorld(world)

		self.enable()
		self.sidebar.enable()

		

		self.drawGraph()

		// Populate the world pane
		self.inspectNode(self.worldNode, false)
		// Popupate the player pane
		self.inspectNode(self.findWithType('PLAYER'), false)

		console.log('graphNode')
		console.log(self.worldNode)

	}

	graph.prototype.loadWorld = function(world){

		var self = this
		
		self.world = window.world = world
		self.worldNode = GraphNodeFactory(world.entity, self)

	}

	// world.prototype.newEntity = function(type){

	// 	var self = this

	// 	var entity = new Entity(new ASTNode({
	// 		type: type.toUpperCase(),
	// 		id: generateId()
	// 	}), self)


	// 	return entity

	// }

	var getTimestamp = function(){
		var d = new Date()
		var s = [d.getFullYear(), '-', d.getDate(), '-', d.getDay(), ' ', d.getHours(), ':', d.getMinutes(), ':', d.getSeconds()].join('')
		return s
	}

	graph.prototype.saveWorldAsFile = function(){

		var data = []

		data.push('// ZORKISH WORLD FILE')
		data.push('// Saved: ' + getTimestamp())

		data.push('\n')

		data.push('// EDITOR COMMENTS')
		_.each(window.EditorComments, function(d, i){
			data.push('//- ' + i + ': ' + d)
		})

		data.push('\n')

		
		data.push(this.worldNode.entity.toString())

		

		var s = data.join('\n')

		console.log('saving', s)

		var blob = new Blob([s], {type: "text/plain;charset=utf-8"});
		saveAs(blob, this.filename || 'world.zorkish');

	}





	/**
	* SVG
	*/

	graph.prototype.initSVG = function(){

		var self = this
		
		
		// Append the SVG



		// self.$workArea.on('click', function(e){
			
		// 	self.clearEntitySelection()

		// })


		


	}

	graph.prototype.clearEntitySelection = function(){

		var self = this

		// self.sidebar.disablePane('entity', 'No entity selected.')

		// Clear the pane
		this.sidebar.clearPane('entity')

		// And add our text
		$('<div class="text-muted"></div>')
			.text('No entity selected')
			.appendTo(this.sidebar.addComponentToPane('entity'))
		
		// And change the label
		this.sidebar.setPaneLabel('entity', 'Entity')

		// self.unselectNodes()
		// d3.select('svg .selected').classed('selected', false)
		d3.selectAll('svg .show').classed('show', false)
		d3.selectAll('svg .node-hover').classed('node-hover', false)
		

	}

	graph.prototype.drawGraph = function(){
		
		var self = this

		// self.drawPackCircle()
		// self.drawCluster()
		self.drawForceTree()

	}

	graph.prototype.drawText = function(){

		// Do a text version for debugging
		self.drawNode(self.findWithType('MAP').children)

	}

	graph.prototype.getSpawnBlock = function(){
		var self = this
		var player = self.findWithType('PLAYER')
		return self.findWithId(player.prop('POSITION'))
	}

	





	graph.prototype.drawForceTree = function(){

		var self = this

		var width = self.$workArea.width(),
			height = self.$workArea.height(),
			r = width * 0.8,
			x = d3.scale.linear().range([0, r]),
			y = d3.scale.linear().range([0, r]),
			node,
			root;

		var scale = 1
		var charge = 0
		var linkDistance = 130
		var stickAmount = 3
		var blockRadius = 40
		var portRadius = 10



		/**
		* Prepare the data
		*/
		
		// Read the data
		node = root = self.findWithType('MAP');

		// Array of blocks or 'nodes' 
		var blocks = []

		// Array of ports, 4 for each node
		var ports = []

		// Array of ports that are connected, and so should be used in the force simulation
		var activePorts = []


		function generatePortsForBlock(d, i){

			function addDirection(dir, x, y){
				var dir = {
					x: d.x + x * d.r,
					y: d.y + y * d.r,
					r: portRadius,
					label: dir,
					source: d,
					target: d.prop(dir) && self.findWithId(d.prop(dir))
				}

				ports.push(dir)
			}

			addDirection('NORTH', 0, -1)
			addDirection('SOUTH', 0, 1)
			addDirection('EAST', 1, 0)
			addDirection('WEST', -1, 0)

		}

		self.updateGraph = function(){

			// Refresh our graph nodes based on the actual world
			self.loadWorld(self.world)

			// Generate new blocks
			updateBlocks()

			// Redraw the graph and handle enter/exit
			redraw()

			// Recalculate force weights etc.
			// force.start()
		}



		/**
		* Grid
		*/

		// Calculates the position of each block relative to its neighbours
		// in a grid, working out from the spawn node

		// TODO: Handle nodes that aren't connected to anything

		var grid = function(blocks, distance){

			// var self = this


			// We get given an array of blocks, we need
			// to calculate the logical position of said blocks 
			// relative to one another, making them [distance] apart

			
			var originBlock = self.getSpawnBlock()


			

			// Invalidate the position of all blocks
			blocks.forEach(function(d){
				d.dirty = true
			})


			// Set the position of a node to x, y if it's
			// marked as dirty. Do the same to its neighbours
			function setPosition(block, x, y){

				if (!block.dirty) 
					return

				var dx = x - block.x
				var dy = y - block.y

				

				// Set our children's positions
				block.allChildren.forEach(function(d, i){
					d.x += dx
					d.y += dy
				})

				// Then set our own
				block.x += dx
				block.y += dy
				block.r = blockRadius
				block.dirty = false
				block.depth = 0



				function calculateDirection(dir, dx, dy){
					var id = block.prop(dir)
					if (id){
						var n = self.findWithId(id)
						setPosition(n, x + dx, y + dy)
					}
				}

				// Use SVG coordinates, so top left is 0
				calculateDirection('NORTH', 0, -distance)
				calculateDirection('SOUTH', 0, distance)
				calculateDirection('EAST', distance, 0)
				calculateDirection('WEST', -distance, 0)
			}


			// Recursively visit each node that's connected
			// to the start node. If that node hasn't been positioned yet,
			// then it will position it a relative distance away from
			// the source node, and then do the same to all of that node's
			// connected nodes etc.
			setPosition(originBlock, 0, 0)


		}

		/**
		* Packing
		*/


		// This should be run before grid()
		// It will treat every block as a circle, and then
		// for each of its children, generate an x, y and radius
		// so that they fit inside of one another

		// The x,y of the block itself will also be overriden though,
		// so it's important to run grid() on them afterwards, which will
		// set the blocks to their proper coordinates, and offset their children
		// by the difference. 

		// This packing should occur only when the graph is completely regenerated
		// from the world, such as when an object is added or removed. 
		// Changing the directions of a block shouldn't affect subobjects, so 
		// there's no need to repack

		var blockObjects = []
		var blockObjectRatio = 0.7
		

		function packBlockObjects(){

			// We have to pack each block individually, otherwise
			// some would be larger than others (due to children)
			// We want blocks to all be the same size, then any children
			// to fit based on size etc.
			blocks.forEach(function(block){

				var pack = d3.layout.pack()
				    .padding(10)
				    .size([blockRadius * 2 * blockObjectRatio, blockRadius * 2 * blockObjectRatio])
				    .value(function(d){ return 1 }) // all children are weighted equally

				// A flat array of this node and its children
				var packedNodes = pack.nodes(block);

				// Get an array with just children (no block)
				var childrenNodes = _.without(packedNodes, block)

				block.allChildren = childrenNodes

				// Then add these children to the blockObjects array
				// so they can be drawn
				blockObjects = _.union(blockObjects, childrenNodes)



			})

		}

		console.log("blockObjects", blockObjects)


		

		
		






		function updateBlocks(){

			// Get blocks from model
			blocks = self.findWithType('MAP').children

			// Calculate the block subobject relative positions
			packBlockObjects()
			
			// Calculate the ideal distance of each block
			// and position subobjects
			grid(blocks, linkDistance)

			// And tell our force graph about our new blocks
			force.nodes(blocks)

			// Now update our ports
			updatePorts()

			updateScale()

		}	

		function updateScale(){
			blocks.forEach(function(d){
				d.r = blockRadius * scale
			})

			ports.forEach(function(d){
				d.r = portRadius * scale
			})
		}

		



		function updatePorts(){

			// Reset ports
			ports = []

			// Generate the ports array from our blocks
			blocks.forEach(generatePortsForBlock)		

			// And update the active ports for the graph
			updateActivePorts()
		}



		function updateActivePorts(){

			// Reset active ports
			activePorts = []
			
			// Generate the active ports array from our current ports
			activePorts = _.filter(ports, function(p){ return !!p.target; });

			// And tell the force graph
			force.links(activePorts)
			force.nodes(blocks)

		} 

		var selectedRadius = 1.3

		
		var unselectNodes = self.unselectNodes = function(){

			self.clearEntitySelection()

			// return 
			console.log('unselectNodes')
			var old = d3.select('svg .selected')
				// .classed('selected', false)
				.classed('selected', function(d){ return d.selected = false })

			if (focus == null){
				old.transition()
					.duration(1000)
					.attr('r', function(d){ return d.r })
					.ease(d3.ease('elastic'))
			} else {
				old.attr('r', function(d){ return d.r })
			}
		}

		var selectNode = self.selectNode = function(node, el){
			var self = this
			self.unselectNodes()


			d3.select(el)
				.classed('selected', function(d){ return d.selected = true })
				.transition()
					.duration(1000)
					.ease(d3.ease('elastic'))
					.attr('r', function(d){ return d.r * selectedRadius})
					


		}

		


		/**
		* Layout
		*/


		// And encapsulate in a graph object for clarity
		var graph = {
			nodes: blocks,
			activePorts: activePorts,
			ports: ports
		}

		var panOffset = {
			x: width / 2,
			y: height / 2
		}

		// function worldPosition(node){
		// 	return {
		// 		x: node.lx,
		// 		y: node.ly
		// 	}
		// }

		// function setToWorldPosition(d){
		// 	var pos = worldPosition(d)
		// 	d.x = pos.x
		// 	d.y = pos.y
		// }

		



		function tagClasses(d){
			var c = []
			c.push(d.children ? "parent" : "child")
			
			var tags = d.prop('TAGS')
			if (tags){
				c.push(tags.split(',').map(function(d){
					return 'tag-' + d.trim().toLowerCase()
				}).join(' '))
			}
			return c.join(" ")
		}



		/**
		* Scales and zooming
		*/


		





		/**
		* Dragging
		*/


		var leftMouse = 1

		var leftMouseDown = false
		var didDrag = false


		var node_drag = d3.behavior.drag()
			.on("drag", nodeDragMove)
			.on("dragend", nodeDragEnd)
			.origin(function(d){
				return d // already has x and y coordinates
			})

		function nodeDragMove(d, i) {
			console.log('nodeDragMove')

			if (d3.event.sourceEvent.which !== leftMouse) return

			d.fixed = d.isDragging = didDrag = true;
			d3.select(this)
				.attr("cx", d.px = d3.event.x)
				.attr("cy", d.py = d3.event.y)

			d3.event.sourceEvent.stopPropagation()
		}

		function nodeDragEnd(d, i) {
			d.fixed = d.isDragging = false;
			leftMouseDown = false

			if (didDrag) force.resume();
		}



		/**
		* Events
		*/

		

		

		$(document).on("keydown", function(e){
			console.log('window keyup', e)

			if ($(e.target).is('input, textarea'))
				return

			var backspace = 8
			if (e.which === backspace){

				// Stop the page from going back
				e.preventDefault()
				e.stopImmediatePropagation()

				var node = d3.select('svg .selected')

				if (node.empty()){
					console.log('delete, but nothing selected')
				} else {
					console.log('delete node!', node)
					var block = node.datum()
					var id = block.prop('id')

					if (block === self.getSpawnBlock()){
						console.log('cant delte spawn block')
						return
					}

					// Remove our own directions
					'NORTH EAST SOUTH WEST'.split(' ').forEach(function(direction){
						block.prop(direction, null)
					})

					// Remove any other block's connection to us
					blocks.forEach(function(d, i){
						'NORTH EAST SOUTH WEST'.split(' ').forEach(function(direction){
							if (d.prop(direction) == id)
								d.prop(direction, null)
						})
					})


					self.clearEntitySelection()
					block.entity.remove()
					self.updateGraph()


				}
			}




			
			
		})

		var temporaryNode = null

		var portEvents = {
			firstDragMove: false,
			makeNewNode: false,
			isDragging: false,
			dragStartPort: null,
			dragStartPortElement: null,
			drawStartNode: null,
			dragEndNode: null,
			dragEndNodeElement: null,
			// hoveredNode: null,
			// lastHoveredNode: null,
			hoveredPort: null,
			lastHoveredPort: null,
			startedDragging: function(startPort, el){

				console.log('startedDragging')

				force.stop()

				this.isDragging = true
				this.dragStartPort = startPort
				this.dragStartPortElement = el

				d3.select(this.dragStartPortElement).classed('show', true)
				d3.select(this.dragStartPort.labelEl).classed('show', true)
				d3.select(this.dragStartPortElement).classed('source-connection', true)
				vis.classed('is-dragging-link', true)

				this.makeNewNode = false


				var sourceNode = this.drawStartNode = startPort.source

				if (d3.event.shiftKey || d3.event.altKey){
					console.log("make a new node!")
					this.makeNewNode = true
					vis.classed('is-dragging-new-node', true)

					temporaryNode = vis.append('svg:circle')
						.style('opacity', 0)
						.attr('r', 0.01)
						.attr('class', function(d){ return classForBlock(sourceNode) })
						.classed('temporary-node', true)
						.classed('disable-pointer-events', true)
						.attr('data-tags', function(d){ return tagClasses(sourceNode) })


				}

				this.firstDragMove = true



			},
			cancelDrag: function(){

				if (this.isDragging){
					console.log('completed a drag!')

					// linkForPort(this.dragStartPort).classed('is-dragging', false)

					// Remove all dragging classes
					d3.select(this.dragEndNodeElement).classed('port-select', false)
					d3.select(this.dragStartPortElement).classed('show', false)
					d3.select(this.dragStartPort.labelEl).classed('show', false)
					d3.select(this.dragStartPortElement).classed('source-connection', false)
					vis.classed('is-dragging-new-node', false)
					vis.classed('is-dragging-link', false)

					
					var hadNode = !!this.dragEndNode
					var wasSameNode = this.dragEndNode == this.dragStartPort.source

					if (temporaryNode){

						// Then we want to make a new node!

						console.log("make a new node!")

						temporaryNode.remove()
						temporaryNode = null

						var startPort = this.dragStartPort
						var sourceBlock = startPort.source

						// Make a new entity
						var newBlock = self.world.newEntity('block')

						// Copy tags across, but that's all
						newBlock.prop('TAGS', sourceBlock.prop('TAGS'))

						// Set its parent to be the same as its sibling
						newBlock.setParent(sourceBlock.entity.parent)

						// Then set this new node to be the dragEndNode
						// this.dragEndNode = newBlock

						// Set the start port's direction to the new node
						sourceBlock.prop(startPort.label, newBlock.prop('id'))

						var opposites = {
							'NORTH': 'SOUTH',
							'EAST': 'WEST',
							'SOUTH': 'NORTH',
							'WEST': 'EAST'
						}

						// And set the new block's opposite direction to the start port to be the source block
						newBlock.prop(opposites[startPort.label], sourceBlock.prop('id'))
						

						self.updateGraph()
						updateInspectableProperties()
						


					} else if (hadNode && !wasSameNode){
						// If we dragged this port into a node that wasn't our own
						// and wasn't nothing

						// Update the source port's target to be the selected node
						this.dragStartPort.target = this.dragEndNode

						// And update the internal data for the source node
						this.dragStartPort.source.prop(this.dragStartPort.label, this.dragEndNode.prop('id'))						

						console.log('to another node! ', this.dragEndNode.prop('id'))
						console.log('port new target')

						

					} else {
						// We dragged to ourselves or onto the canvas
						// so kill the link

						console.log('to nothing or the same node')
						console.log('kill the link!')
						this.dragStartPort.target = null
						this.dragStartPort.source.prop(this.dragStartPort.label, null)						

					}

					updateActivePorts()
					

					// force.start()

					updateLinkLines()



					// console.log('to', this.dragEndNode ? this.dragEndNode.prop('id') : 'nothing', this)



				}



				// Reset port event state
				this.isDragging = false
				this.dragStartPort = this.dragStartPortElement = null
				this.dragEndNode = this.dragEndNodeElement = null
				

			},
			mouseMove: function(d, el){

				// console.log('mouseMove', d, el)

				if (focus != null)
					return

				if (this.isDragging){


					// force.stop()

					// Set the source port's target to be the current mouse position
					// Then update the drawing, so we get a line from the port to the mouse
					var mousePos = d3.mouse(this.dragStartPortElement)
					mousePos = {
						x: this.dragStartPort.x + mousePos[0],
						y: this.dragStartPort.y + mousePos[1]
					}

					// var mousePos = d3.mouse(this.dragStartPortElement)
					// mousePos = {
					// 	x: mousePos[0],
					// 	y: mousePos[1]
					// }



					this.dragStartPort.target = mousePos
					if (temporaryNode){
						temporaryNode
							.attr('cx', mousePos.x)
							.attr('cy', mousePos.y)
						console.log('set its x to be', mousePos.x)

						if (this.firstDragMove){
							temporaryNode
								.transition()
								.duration(500)
								.ease('elastic')
								.style('opacity', 1)
								.attr('r', this.drawStartNode.r)
						}
					}

					// linkForPort(this.dragStartPort).classed('is-dragging', true)

					// updateActivePorts()
					updateLinkLines()

					this.firstDragMove = false


				}

			},
			portOver: function(d, el){

				if (focus != null)
					return

				if (this.isDragging){

				} else {
					
					d3.select(d.labelEl).classed('hover', true)
					portsForNode(d.source).classed('node-hover', true)
					portLabelsForNode(d.source).classed('node-hover', true)
					d3.select(el)
						.classed('hover', true)
						.transition()
							.duration(1000)
							.attr('r', function(d){ 
								return (d.r || portRadius * scale) * 1.3 
							})
							.ease(d3.ease('elastic'))

					
				}

			},
			portOut: function(d, el){

				if (focus != null)
					return

				
				d3.select(d.labelEl).classed('hover', false)
				portsForNode(d.source).classed('node-hover', false)
				portLabelsForNode(d.source).classed('node-hover', false)

				d3.select(el)
					.classed('hover', false)
					.transition()
						.duration(1000)
						.attr('r', function(d){ 
							if (!d.r) debugger
							return d.r || portRadius * scale 
						})
						.ease(d3.ease('elastic'))
				

				if (this.isDragging){

				} else {
					
				}

			},
			nodeOver: function(node, el){

				if (focus != null)
					return

				if (this.isDragging){

					this.dragEndNode = node
					this.dragEndNodeElement = el

					if (!temporaryNode){

						d3.select(this.dragEndNodeElement).classed('port-select', true)
					}

					


				} else {
					portsForNode(node).classed('node-hover', true)
					portLabelsForNode(node).classed('node-hover', true)
				}

				

			},
			nodeOut: function(node, el){

				if (focus != null)
					return

				if (this.isDragging){

					d3.select(el).classed('port-select', false)

					this.dragEndNode = null
					this.dragEndNodeElement = null

				} else {
					portsForNode(node).classed('node-hover', false)
					portLabelsForNode(node).classed('node-hover', false)
				}

				

			}
		}

		var margin = 50,
		    outerDiameter = Math.min(width, height) + 0,
		    innerDiameter = outerDiameter - margin - margin;

		// x-scale
		var xScale = d3.scale.linear()
		    .range([0, innerDiameter]);

		var yScale = d3.scale.linear()
		    .range([0, innerDiameter]);


		var graphZoom = self.graphZoom = d3.behavior.zoom()
			.on("zoom", rescale)
			// .x(xScale)
			// .y(yScale)
			.size([width, height])
			.center([width/2, height/2])


		var trans = [0, 0]


		// rescale g
		function rescale() {

			// If we're zoomed in on something, then don't translate
			// and revert the zoom's internal translate to our last one
			// (that we're frozen on)
			if (focus){
				self.graphZoom.translate(trans)
				return
			}

		  trans = d3.event.translate;
		  // scale = d3.event.scale;

		  force.stop()
		  panViewport(trans)
		}

		function panViewport(t, animated){
			// return

			console.log("panViewport", !!animated)

			if (animated){
				vis.transition()
					.duration(500)
					.attr("transform", "translate(" + t + ")");
			} else {
				vis.attr("transform", "translate(" + t + ")");
			}

			

		}

		function panToNode(d, animated){

			var newTranslate = [d.x + width/2, d.y + height/2]
			trans = newTranslate
			self.graphZoom.translate(newTranslate)

			panViewport(trans, animated)

			// self.graphZoom.event(rect)


		}


		var focusLevel = 0
		var focus = null
		var focusStack = []

		function shouldReceiveEvents(d){

			d3.select(this).classed('no-events', focusLevel !== d.depth)

			// return  ? null : 'none'
		}

		function nodeOpacity(d){
			var diff = Math.abs(d.depth - focusLevel)
			return diff === 0 ? 1 : Math.pow(0.7, diff * 2)
		}

		function blockObjectColor(d){
			d3.select(this)
				.style('opacity', function(d){
					var o = 1
					var diff = Math.abs(d.depth - focusLevel)

					return o * Math.pow(0.5, diff)
				})
				.style('fill-opacity', function(d){
					return d.depth === focusLevel ? 0.5 : null
				})
				.style('fill', function(d){
					if (d.depth === 0) return null
					return d.depth % 2 ? 'white' : 'black'
				})
		}

		function labelVisibility(d){
			d3.select(this)
				.style('fill-opacity', function(d){

					var o = 1

					
					if (d.depth === focusLevel){
						// If we're at this level, then show the labels
						o = 1
					} else if (d.depth < focusLevel){
						// If we're shallower than this, then hide altogether
						return 0
					} else if (focusLevel == 0){
						// If we're zoomed all the way out, don't show any sublabels
						o = 0
					} else {
						var diff = Math.abs(d.depth - focusLevel)
						o = 1 - diff * 0.7
					}



					console.log('set labelVisibility', o, this.textContent)
					

					return o
				})
		}

		function zoomNone(d, i, el){

			focus = null
			focusLevel = 0
			focusStack = []




			var transition = d3.selectAll("text,circle, .link")
			// var transition = d3.selectAll(".block")

			// var transition = d3.select(el)
				.transition()
			    .ease(d3.ease('elastic',1, 2))
				.duration(d3.event && d3.event.altKey ? 7500 : 700)
			    

			transition.filter('circle, text')
				.attr("transform", function(d) { 
			    	var s = (d.zx = d.x ) + "," + (d.zy = d.y)
			    	// console.log('original :', d.x, ',', d.y)
			    	// console.log('set translate to: ', s)
			    	return "translate(" + s + ")"; 
			    });

			transition.filter("circle")
			    .attr("r", function(d) { return (d.zr = d.selected ? d.r * selectedRadius : d.r); })
			    
			transition.filter(".node-block, .block-object")
				.each(shouldReceiveEvents)

			transition.filter('.link')
				.attr('d', function(d){
					return pathForLink(d)
				})

			 transition.filter('.block-object')
		    	.each(blockObjectColor)
			    // .each(shouldReceiveEvents)

			// Fade in elements that were faded out
		   	transition.filter('.port, .port-label, .link')
				.style("opacity", 1)
				.attr('pointer-events', null)

			transition.filter('.label')
				.each(labelVisibility)
				


		}

		function zoomNode(d, i, el) {

			// Recalculate diameters
			outerDiameter = Math.min(width, height) + 0
			innerDiameter = outerDiameter - margin - margin;

			// x-scale
			xScale.range([0, innerDiameter]);

			yScale.range([0, innerDiameter]);


		    focus = d;
		    focusLevel = d.depth + 1

		    // Push off anything above our focus level
		    while (focusStack.length > d.depth){
		    	focusStack.pop()
		    }

		    // Then push ourselves on
		    focusStack.push({ 'd': d, 'i': i, 'el': el})

		    // Fetch the zoom translate
		    var t = self.graphZoom.translate()
		    t = {
		    	x: t[0],
		    	y: t[1]
		    }

		    var k = innerDiameter / d.r / 2;
		    var leftover = {
		    	x: (width - innerDiameter),
		    	y: (height - innerDiameter)
		    }

		    var percentLeftover = {
		    	x: leftover.x / width,
		    	y: leftover.y / height
		    }

		    xScale.domain([d.x - d.r, d.x + d.r]);
		    yScale.domain([d.y - d.r, d.y + d.r]);
		    // yScale.range([1 - percentLeftover.y/2, percentLeftover.y / 2])

		    d3.event.stopPropagation();



		    var transition = d3.selectAll(".node-block,circle,text, .link")
		    // var transition = d3.selectAll(".block")

		    // var transition = d3.select(el)
		    	.transition()
		    	.ease(d3.ease('elastic',1, .95))
				.duration(d3.event && d3.event.altKey ? 7500 : 1000)

			// Objects with a central pivot
			transition.filter('circle, text')
				.attr("transform", function(d) { 
					var s = (d.zx = xScale(d.x) - t.x + leftover.x / 2 ) + "," + (d.zy = yScale(d.y) - t.y + leftover.y / 2 )
					// console.log('original :', d.x, ',', d.y)
					// console.log('set translate to: ', s)
					return "translate(" + s + ")"; 
				});

		       // Objects with a radius
		    transition.filter("circle")
				.attr("r", function(d) { return (d.zr = k * d.r); })

		    transition.filter(".node-block, .block-object")
		    	.each(shouldReceiveEvents)

		    // Paths
		    transition.filter('.link')
		    	.attr('d', function(d){
		    		return pathForLink(d)
		    	})

		    transition.filter('.block-object')
		    	.each(blockObjectColor)

		   	transition.filter('.port, .port-label, .link')
				.style("opacity", 0)
				.attr('pointer-events', 'none')

			transition.filter('.label')
				.each(labelVisibility)

			transition.filter('.node-label')
				.each(function(n){
					if (d === n){
						console.log('move label up', d.prop('id'))
					}

				})


		    // They'll automatically use the zoom points
		    // updateLinkLines()

		    // transition.filter("text")
		    //     .style("opacity", function(d) { return d.parent === focus || !d.parent ? 1 : 0; });
		  }


		

		


		/**
		* Initialise the SVG
		*/

		// init svg
		var outer = d3.select(".work-area")
		  .append("svg:svg")
		    .attr("width", width)
		    .attr("height", height)
		    .attr("pointer-events", "all");

		var rect = outer.append('svg:rect')
			.attr('width', width)
			.attr('height', height)
			.attr('fill', 'transparent')
			.call(graphZoom)
			// .on("mousewheel.zoom", function(){ console.log("mousehweel")})
			.on('wheel' + ".zoom", null)
			.on("dblclick.zoom", null)
			.on("mousemove", function(d){
				// console.log('canvas mousemove')
				portEvents.mouseMove(d, this)
			})
			.on("mousedown", function(d){
				console.log('canvas mousedown')

				if (focusLevel > 0){
					zoomNone()
				} else {
					self.unselectNodes()
				}

				
			})
			.on("mouseup", function(d){
				console.log('canvas mouseup')
				portEvents.cancelDrag()
			})


		// Create our actual vancas
		var vis = outer
		  .append('svg:g')
		  // .call(d3.behavior.zoom())
		  .classed('zoom-group', true)
		  .append('svg:g')
		  .attr('class', 'main-group')


		vis.append("defs").append("marker")
			.attr('id', 'arrowhead')
		    .attr("viewBox", "0 0 10 10")
		    .attr("refX", "12")
		    .attr("refY", "5")
		    .attr("markerUnits", "strokeWidth")
		    .attr("markerWidth", "2")
		    .attr("markerHeight", "3")
		    .attr("orient", "auto")
		    .append("path")
				.attr("d", "M 0 0 L 10 5 L 0 10 z"); //this is actual shape for arrowhead

		// Create our force layout

		var force = d3.layout.force()
			.size([width, height])
			.charge(charge)
			.linkDistance(linkDistance)
			.on("tick", tick)
		
		
		// Generate our data for the first time
		// this will also generate ports etc.
		// and set the data for the force
		updateBlocks()

		// Now that we have some data, we can start the simulation
		// force.start();

		console.log('force started')
		console.log('blocks', blocks)
		console.log('ports', ports)
		console.log('activePorts', activePorts)


		function classForObject(d){
			return 'block-object block-object' + d.prop('type')
		}

		function classForBlock(d){
			return 'block block-' + d.prop('type')
		}

		function showPortsForNode(d, value){
			port.each(function(p){
				if (d.source === p.source || d === p.source){
					d3.select(this).classed('show', value)
				}
			})
		}

		function portsForNode(node){
			return port.filter(function(d){
				return d.source === node
			})
		}

		function portLabelsForNode(node){
			return portLabel.filter(function(d){
				return d.source === node
			})
		}

		function linkForPort(port){
			return link.filter(function(d){
				return d.source === port.source
			})
		}


		

		
		


		




		function labelForNode(d) { 
			
			var title = addNewlines(d.prop('DESCRIPTION_NAME'), 11)

			var label = title || d.prop('type') + ': ' + d.prop('id')

			var el = d3.select(this);
		    var words = label.split('\n');
		    el.text('');
		    var lineHeight = 15
		    var compensate = -0.2

		    var c = -1 * (words.length + 1)

		    for (var i = 0; i < words.length; i++) {
		        var tspan = el.append('tspan').text(words[i]);
		        if (i > 0){
		            tspan.attr('x', d.x).attr('dy', lineHeight);
		       	} else if (words.length > 1) {
		       		
		       		tspan.attr('y', d.y -lineHeight * (words.length - 1) * 0.5)
		       	}

		    }



			console.log('title', title)

			return label; 
		}

		function portKey(d){
			return d.source.prop('id') + '-' + d.label
		}

		function blockKey(d){
			return d.prop('id')
		}


		



		/**
		* Drawing
		*/


		// Trap our drawing lists in this closure
		var node, text, link, port, portLabel, blockObject, blockObjectLabel;

		// Rebinds the data to the graph
		function redraw(){

			console.log('redraw!')


			

			/**
			* Links
			*/

			// Make a line for every port
			// Do this first so they're behind
			link = vis.selectAll(".link")
				.data(ports, portKey)
			
			link.enter().append("svg:path")
					.attr("class", "link")

			link.exit()
				.remove()

			
			

			


			/**
			* Nodes
			*/

			// Make a big circle for every node

			node = vis.selectAll(".block")
				.data(blocks, blockKey)
			
			node.enter()
				.append("circle")
				.attr("class", classForBlock)
				.classed('spawn-block', function(d){ return d === self.getSpawnBlock()})
				.attr("r", function(d){ return d.r })
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.on('mouseover', function(d){
					// console.log("node mouseover")

					portEvents.nodeOver(d, this)

					// Display all of our ports
					// showPortsForNode(d, true)

				})
				.on('mousemove', function(d){
					// console.log("node mousemove")
					if (d3.event.which != leftMouse){

						// console.log('other mousemove...')

						return
					}
						

					portEvents.mouseMove(d, this)
				})
				.on('mouseout', function(d){
					// console.log("node mouseout")

					portEvents.nodeOut(d, this)

					// Hide all of our ports
					// showPortsForNode(d, false)

				})
				.on('mousedown', function(d){
					if (d3.event.which != leftMouse) 
						return
					// console.log("node mousedown")
				})
				.on('mouseup', function(d){

					if (d3.event.which != leftMouse) 
						return
					// console.log("node mouseup")

					if (portEvents.isDragging){
						portEvents.cancelDrag(d, this)	
					} else {

					}

					
				})
				// .on('dblclick.node', function(d){
				// 	console.log('zoom to node!')
				// })
				.on('click.node', function(d, i){

					if (d3.event.which != leftMouse) 
						return

					console.log('node click')

					var currentSelection = d3.select('svg .block.selected')

					var currentNode = null
					if (currentSelection.size()){
						currentNode = currentSelection.datum()
					}

					// If this node is already clicked...
					if (currentNode === d){

						console.log('alreay clicked')
						console.log('zoom in to this node')

						zoomNode(d, i, this)

					} else {
						// Remove old selection highlight
						self.unselectNodes()

						
						
						// Highlight this node
						self.selectNode(d, this)

						// Inspect this node
						self.inspectNode(d)
					}


					

					// Don't let it get to the work area
					d3.event.stopPropagation()
				})

			node.exit()
				.transition()
				.duration(300)
				.attr('r', 0.01)
				.style('opacity', 0)
				.ease(d3.ease('back', 2))
				.remove()


			/**
			* Block objects
			*/


			blockObject = vis.selectAll(".block-object")
				.data(blockObjects, blockKey)
			
			blockObject.enter()
				.append("circle")
				.attr("class", classForObject)
				.attr("r", function(d){ return d.r })
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.each(blockObjectColor)


			/**
			* Block object labels
			*/


			blockObjectLabel = vis.selectAll(".block-object-label")
				.data(blockObjects, blockKey)
			
			blockObjectLabel.enter()
				.append("svg:text")
				.attr("class", function(d) { return 'label block-object-label ' + tagClasses(d) })
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
				.attr("dy", ".35em")
				.attr("text-anchor", "middle")
				.each(labelForNode)
				.each(labelVisibility)
				

			



			/**
			* Node labels
			*/

			

			text = vis.selectAll(".node-label")
				.data(blocks, blockKey)
			
			text.enter().append("svg:text")
					.attr("class", function(d) { return 'label node-label ' + tagClasses(d) })
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
					.attr("dy", ".35em")
					.attr("text-anchor", "middle")
					.each(labelForNode)
					.each(labelVisibility)
					// zooming fade
					// .style("opacity", function(d) { 
					// 	console.log('d', d.prop('type') + ': ' + d.prop('id'), 'd.r', d.r); 
					// 	return d.r > zoomThreshold ? 1 : 0; })

			text.exit()
				.remove()



			/**
			* Ports
			*/
			
			// Make 4 circles around every node

			port = vis.selectAll(".port")
				.data(ports, portKey)
				
			port.enter()
					.append("circle")
					.attr("class", function(d){ return 'port port-' + d.label.toLowerCase() + (d.target ? ' active' : '') })
					.attr("r", function(d){ return d.r = portRadius * scale })
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
					// .attr("cx", function(d) { return d.x = d.source.x + d.lx * blockRadius * scale })
					// .attr("cy", function(d) { return d.y = d.source.y + d.ly * blockRadius * scale })
					.on('mouseover', function(d){ 
						console.log('port mouseover', d)

						portEvents.portOver(d, this)



					})
					.on('mouseout', function(d){
						console.log('port mouseout')

						portEvents.portOut(d, this)

					})
					.on('mousedown', function(d) { 
						console.log('port mousedown')

						portEvents.startedDragging(d, this)

						// portEvents.isDragging = true
						

					})
					.on('mousemove', function(d){
						// console.log('port mousemove')

						portEvents.mouseMove(d, this)
					})
					.on('mouseup', function(d){
						console.log('port mouseup')

						portEvents.cancelDrag(d, this)

					})

			port.exit()
				.remove()


			// /**
			// * Port labels
			// */

			portLabel = vis.selectAll(".port-label")
				.data(ports, portKey);
				
			portLabel.enter()
					.append("svg:text")
						// .attr('class')
						.each(function(d){ d.labelEl = this; })
						.attr("class", function(d) { return 'port-label port-label-'+d.label.toLowerCase() })
						// .attr("x", function(d) { return d.x; })
						// .attr("y", function(d) { return d.y; })
						.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
						.attr("dy", ".35em")
						.attr("text-anchor", "middle")
						.text(function(d) { return d.label.charAt(0) });

			portLabel.exit()
				.remove();

			updateLinkLines();


		}

		redraw();

		panToNode(self.getSpawnBlock())
		zoomNone()


		var $window = $(window)
		$window.resize(function(e){

			console.log('resize')

			width = self.$workArea.width()
			height = self.$workArea.height()

			outer
				.attr("width", width)
				.attr("height", height);

			rect.attr('width', width)
				.attr('height', height)
		})


		function closestPointOnCircle(point, circleCenter, radius){

			// calculate the closest point on the block circle to our position
			// var point = d
			var center = circleCenter
			var R = radius
			var vX = point.x - center.x;
			var vY = point.y - center.y;
			var magV = Math.sqrt(vX*vX + vY*vY);
			var aX = center.x + vX / magV * R;
			var aY = center.y + vY / magV * R;

			// set our target points
			return {
				x: aX,
				y: aY
			}

		}

		function pathForLink(d){

			// Uses zoom points if available
			
			// Use our target, or ourselves if no target exists
			var target = d.target || d

			var sourcePoint = { 
				x: d.zx || d.x, 
				y: d.zy || d.y 
			}

			var targetPoint = {
				x: target.zx || target.x,
				y: target.zy || target.y
			}



			// But if our target is an entity, then draw a line to the
			// nearest point on its circle instead
			if (d.target && d.target.entity){

				
				var circleCenter = { x: d.target.zx || d.target.x, y: d.target.zy || d.target.y }
				var radius = target.zr || target.r
				console.log("using radius", radius)

				targetPoint = closestPointOnCircle(sourcePoint, circleCenter, radius)


			}

			var dx = targetPoint.x - sourcePoint.x,
				dy = targetPoint.y - sourcePoint.y,
				dr = Math.sqrt(dx * dx + dy * dy);

			
			var p = "M" + sourcePoint.x + "," + sourcePoint.y + "A" + dr + "," + dr + " 0 0,1 " + targetPoint.x + "," + targetPoint.y;
			
			return p
		}

		

		function tick(e) {

			return
			
			updateGraphProperties(e)
			updateLinkLines()
			
		}

		function updateGraphProperties(e){

			// Do any graph-related changes, which aren't affected by 
			// any changes in the inspector

			var amount = stickAmount * e.alpha;
			var restThreshold = 0.1

			// Moves a node back towards to its world point
			function stick(node){

				if (!node.x){
					return
				}

				if (node.isDragging)
					return
				
				var desired = worldPosition(node)

				var difference = {
					x: desired.x - node.x,
					y: desired.y - node.y
				}

				// If it's already close to the spot, then leave it
				if (difference.x > restThreshold || difference.x < -restThreshold)
					node.x += difference.x * amount

				if (difference.y > restThreshold || difference.y < -restThreshold)
					node.y += difference.y * amount


			}
			
			node.each(function(d, i) { stick(d) })
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });

			// And update the text positions
			text.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })
				// .text(function(d) { 
				// 	var title = d.prop('DESCRIPTION_NAME')
				// 	return title || d.prop('type') + ': ' + d.prop('id'); 
				// })

			// Then update the port positions based on our node positions
			port.attr("cx", function(d) { return d.x = d.source.x + d.lx * blockRadius * scale || d.x })
				.attr("cy", function(d) { return d.y = d.source.y + d.ly * blockRadius * scale || d.y })

			portLabel
				.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })

		}

		function updateInspectableProperties(){
			

			

			text.each(labelForNode)
			node.attr('data-tags', tagClasses)
		}

		function updateLinkLines(){
			// Update our link lines
			link
				.classed('hide-link', function(d){ return !d.target })
				.classed('is-dragging', function(d){ return d.target && !d.target.entity })
				.attr("marker-end", function(d){ return d.target ? "url(#arrowhead)" : "" })
				.attr("d", pathForLink);
		}

		self.propertyDidChange = function(){
			updateInspectableProperties()
		}

		


	}



	

	graph.prototype.inspectNode = function(node, showPane){

		console.log('inspectNode', node)

		var self = this

		showPane = _.isBoolean(showPane) ? showPane : true

		// Get the pane this entity should show in
		var $pane = self.sidebar.getPaneElement(node.pane)

		// Clear the pane
		self.sidebar.clearPane($pane)

		// For each component of this node, add it to the sidebar
		_.each(node.components, function(component, i){
			
			if (i > 0)
				self.sidebar.addSeparatorToPane($pane)
			
			var $container = self.sidebar.addComponentToPane($pane)

			component.present($container)

		})

		// Default is true
		if (showPane)
			self.sidebar.showPane(node.pane)




	}




	graph.prototype.drawNode = function(node){

		var self = this
		
		if (_.isArray(node)){
			node.forEach(function(d){
				self.drawNode(d)
			})

			return
		}

		

		var $a = $('<li></li>')
			.text(node.entity.prop('type') + ': ' + node.entity.prop('id'))
			.attr({
				href: '#' + node.entity.prop('id')
			})

		$a.click(function(e){
			e.preventDefault()
			e.stopPropagation()
			self.inspectNode(node)
		})

		$('.debug-console').append($a)

		_.each(node._children, function(d, i){
			self.drawNode(d)
		})



	}



	graph.prototype.find = function(predicate, recursive, inSelf){
		return this.worldNode.find(predicate, recursive, inSelf)
	}

	graph.prototype.findWithId = function(id){
		return this.worldNode.findWithId(id)
	}

	graph.prototype.findWithName = function(name){
		return this.worldNode.findWithName(name)
	}

	graph.prototype.findWithType = function(name){
		return this.worldNode.findWithType(name)
	}


	







})(jQuery, window);