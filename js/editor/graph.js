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

		self.world = world
		self.filename = filename // for saving later

		self.enable()
		self.sidebar.enable()

		self.worldNode = GraphNodeFactory(world.entity, self)

		self.drawGraph()

		// Populate the world pane
		self.selectNode(self.worldNode, false)
		// Popupate the player pane
		self.selectNode(self.findWithType('PLAYER'), false)

		console.log('graphNode')
		console.log(self.worldNode)

	}

	graph.prototype.saveWorldAsFile = function(){

		var data = []

		data.push("Header")
		data.push(this.worldNode.entity.toString())

		console.log('saving', data.join(''))

		var blob = new Blob(data, {type: "text/plain;charset=utf-8"});
		saveAs(blob, this.filename || 'world.zorkish');

	}





	/**
	* SVG
	*/

	graph.prototype.initSVG = function(){

		var self = this
		
		
		// Append the SVG



		self.$workArea.on('click', function(e){
			
			self.clearEntitySelection()

		})


		


	}

	graph.prototype.clearEntitySelection = function(){

		// self.sidebar.disablePane('entity', 'No entity selected.')

		// Clear the pane
		this.sidebar.clearPane('entity')

		// And add our text
		$('<div class="text-muted"></div>')
			.text('No entity selected')
			.appendTo(this.sidebar.addComponentToPane('entity'))
		
		// And change the label
		this.sidebar.setPaneLabel('entity', 'Entity')

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

	graph.prototype.grid = function(blocks, distance){

		var self = this


		// We get given an array of blocks, we need
		// to calculate the logical position of said blocks 
		// relative to one another, making them [distance] apart

		var player = self.findWithType('PLAYER')
		var originBlock = self.findWithId(player.prop('POSITION'))

		// Invalidate the position of all blocks
		blocks.forEach(function(d){
			d.dirty = true
		})


		// Set the position of a node to x, y if it's
		// marked as dirty. Do the same to its neighbours
		function setPosition(block, x, y){

			if (!block.dirty) 
				return

			block.lx = x
			block.ly = y
			block.dirty = false


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
		var linkDistance = 120
		var stickAmount = 3
		var blockRadius = 40
		var portRadius = 10



		/**
		* Prepare the data
		*/
		
		// Read the data
		node = root = self.findWithType('MAP');

		// array of nodes
		var blocks = self.findWithType('MAP').children



		// map of id's to array index
		var idMap = {}
		blocks.forEach(function(d, i){
			idMap[d.prop('id')] = i
		})

		


		





		




		
		function generatePorts(d, i){

			function addDirection(dir, x, y){
				var north = {
					lx: x,
					ly: y,
					label: dir,
					source: d,
					target: d.prop(dir) && self.findWithId(d.prop(dir))
				}

				ports.push(north)
			}

			addDirection('NORTH', 0, -1)
			addDirection('SOUTH', 0, 1)
			addDirection('EAST', 1, 0)
			addDirection('WEST', -1, 0)
			
			

			
		}


		var ports = []

		// Generate the ports array
		blocks.forEach(generatePorts)	

		// Get all ports that have a target
		var activePorts = _.filter(ports, function(p){ return !!p.target; });



		// function generateLinks(d, i){

		// 	if (d.)

		// 	'NORTH SOUTH EAST WEST'.split(' ')
		// 		.forEach(function(direction){ 
		// 			if (d.prop(direction)){
		// 				links.push({
		// 					source: d,
		// 					target: self.findWithId(d.prop(direction))
		// 				})
		// 			}
		// 		})	
		// }

		// var links = []

		// // Generate the links array
		// ports.forEach(generateLinks)





		console.log('ports', ports)


		/**
		* Layout
		*/

		// Calculate the positions of all nodes
		self.grid(blocks, linkDistance)

		console.log('blocks', blocks)


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

		function worldPosition(node){
			return {
				x: panOffset.x + node.lx * scale,
				y: panOffset.y + node.ly * scale
			}
		}

		function setToWorldPosition(d){
			var pos = worldPosition(d)
			d.x = pos.x
			d.y = pos.y
		}

		blocks.forEach(setToWorldPosition)




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


		// var zoom = d3.behavior.zoom()
		// 	.scaleExtent([1, 8])
		// 	.on("zoom", onZoom)

		

		// function onZoom() {
		//   vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		// }

		// focus on svg
		// vis.node().focus();

		function mousedown() {
			// return
		  if (!mousedown_node && !mousedown_link) {
		    // allow panning if nothing is selected
		    vis.call(d3.behavior.zoom().on("zoom", rescale));
		    return;
		  }
		}

		function mousemove() {
			// return
			// console.log('canvas mousemove')

		  if (!mousedown_node) return;

		  // console.log("mousedown node", mousedown_node)

		  // update drag line
		  vis.classed('disable-pointer-events', true)
		  var mousePos = d3.mouse(this)
		  drag_line
		      .attr("x1", mousedown_node.x)
		      .attr("y1", mousedown_node.y)
		      .attr("x2", mousePos[0])
		      .attr("y2", mousePos[1]);

		}

		function mouseup() {
			// return
			console.log('canvas mouseup')
			vis.classed('disable-pointer-events', false)

			// If this was a port drag
			if (port_target){
				console.log('trigger it up on target')
			}




		  if (mousedown_node) {
		    // hide drag line
		    drag_line
		      .attr("class", "drag_line_hidden")

		    if (!mouseup_node) {
		      // add node
		      var point = d3.mouse(this),
		        newNode = {x: point[0], y: point[1]},
		        // n = nodes.push(newNode);

		      // select new node
		      selected_node = newNode;
		      selected_link = null;
		      
		      // add link to mousedown node
		      // links.push({
		      // 	source: mousedown_node, 
		      // 	target: newNode
		      // });
		    }

		    node.call(node_drag)

		    // redraw();
		  }
		  // clear mouse event vars
		  resetMouseVars();
		}

		function resetMouseVars() {
		  mousedown_node = null;
		  mouseup_node = null;
		  mousedown_link = null;
		}





		/**
		* Create the layout
		*/

		var force = d3.layout.force()
			.size([width, height])
			.charge(charge)
			.linkDistance(linkDistance)
			.on("tick", tick);

		// var drag = force.drag()
		//     .on("dragstart", dragstart);

		// var svg = d3.select(".work-area").append("svg")
		// 	.attr("width", width)
		// 	.attr("height", height)
		// 	.append('g')
		// 	.call(zoom);

		// rescale g
		function rescale() {
		  trans = d3.event.translate;
		  scale = d3.event.scale;

		  vis.attr("transform",
		      "translate(" + trans + ")"
		      + " scale(" + scale + ")");
		}

		// mouse event vars
		var selected_node = null,
		    selected_link = null,
		    mousedown_link = null,
		    mousedown_node = null,
		    mouseup_node = null;

		// init svg
		var outer = d3.select(".work-area")
		  .append("svg:svg")
		    .attr("width", width)
		    .attr("height", height)
		    .attr("pointer-events", "all");

		   outer.append('svg:rect')
		       .attr('width', width)
		       .attr('height', height)
		       .attr('fill', 'transparent')
		       // .call(d3.behavior.zoom().on("zoom", rescale))
		       .on("dblclick.zoom", null)
		       .on("mousemove", mousemove)
		       .on("mousedown", mousedown)
		       .on("mouseup", mouseup);

		var vis = outer
		  .append('svg:g')
		  .append('svg:g')
		    // .on("mousemove", mousemove)
		    // .on("mousedown", mousedown)
		    // .on("mouseup", mouseup);

		

		// line displayed when dragging new nodes
		var drag_line = vis.append("line")
		    .attr("class", "drag_line")
		    .attr("x1", 0)
		    .attr("y1", 0)
		    .attr("x2", 0)
		    .attr("y2", 0);

		// vis.selectAll("circle")
		//     .data(data)
		//   .enter().append("circle")
		//     .attr("r", 2.5)
		//     .attr("transform", function(d) { return "translate(" + d + ")"; });



		vis.append("defs").append("marker")
			.attr('id', 'arrowhead')
		    .attr("viewBox", "0 0 10 10")
		    .attr("refX", "0")
		    .attr("refY", "5")
		    .attr("markerUnits", "strokeWidth")
		    .attr("markerWidth", "4")
		    .attr("markerHeight", "3")
		    .attr("orient", "auto")
		    .append("path")
		        .attr("d", "M 0 0 L 10 5 L 0 10 z"); //this is actual shape for arrowhead

		
		force
		  .nodes(graph.nodes)
		  .links(graph.activePorts)
		  .start();


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

		var node, text, link, port;


		function redraw(){

			



			function showPorts(d, value){
				port.each(function(p){
					if (d.source === p.source || d === p.source){
						d3.select(this).classed('show', value)
					}
				})
			}

			// Make a line for every port
			// Do this first so they're behind
			link = vis.selectAll(".link")
				.data(graph.ports)
				.enter().append("svg:path")
					.attr("class", "link")

			

			var port_source = null
			var port_target = null


			function portLeave(d){
				console.log('port mouseout', d)
				showPorts(d, false)
				d3.select(this).classed('highlight', false)
				d3.select(this).classed('valid-connection', false)
				d3.select(this).attr('r', function(d){ return d.rad})
				port_target = null
			}

			function portMouseUp(d) { 

				vis.classed('disable-pointer-events', false)
				// port.classed('be-available', false)

			  	console.log('port mouseup')
			  	
			  	d3.select(this).classed('is-dragging', false)

			  	

			  	
			  	// If we didn't mouseup on the same port
			  	if (port_source && port_source !== d){

			  		// If we have a target that isn't the source...
			  		if (port_target && port_target !== port_source){
			  			console.log("make new thing")
			  		}

			  	}

			  	
			  	d3.select('.source-connection').classed('source-connection', false)
			  	d3.select('.be-available').classed('be-available', false)
			  	d3.select('.valid-connection').classed('valid-connection', false)

			  	port_source = null
			  	port_target = null


			  	// Hide the line
			  	drag_line.attr('class', 'drag_line_hidden')

			  	// And unhighlight this port
			  	portLeave.call(this, d)
			}
			
			// Make a circle for every port
			port = vis.selectAll(".port")
				.data(graph.ports)
				.enter()
					.append("circle")
					.attr("class", function(d){ return 'port port-' + d.label.toLowerCase() + (d.target ? ' active' : '') })
					.attr("r", function(d){ return d.rad = portRadius * scale })
					.attr("cx", function(d) { return d.x = d.source.x + d.lx * blockRadius * scale })
					.attr("cy", function(d) { return d.y = d.source.y + d.ly * blockRadius * scale })
					.on('mouseover', function(d){ 
						console.log('port mouseover', d)
						showPorts(d, true)
						d3.select(this).classed('highlight', true)
						port_target = d

						if (port_source && port_source != port_target){
							d3.select(this).classed('valid-connection', true)
							d3.select(this).attr('r', function(d){ return d.rad * 2})
						}

					})
					.on('mouseout', portLeave)
					.on("mousedown", function(d) { 

						

						console.log('port mousedown', d)
					  	// return
					    // disable zoom
					    // vis.call(d3.behavior.zoom().on("zoom", null));

					    // Make sure the source node stays visible during the drag
					    // d3.select(this).classed('is-dragging', true)

					    // Make all ports show during drag
					    port.classed('be-available', true)
					    // And disable the nodes
					    vis.classed('disable-pointer-events', true)

					    d3.select(this).classed('source-connection', true)

					    // Set ourselves to be the mousedown node...
					    mousedown_node = d;
					    
					    // if (mousedown_node == selected_node){
					    // 	selected_node = null
					    // } else {
					    // 	selected_node = mousedown_node; 
					    // }

					    // We're the port source, but there isn't a target yet
					    port_source = d
					    port_target = null
					    
					    selected_link = null; 

					    // reposition drag line to its center
					    drag_line
					        .attr("class", "link new-link")
					        .attr("x1", mousedown_node.x)
					        .attr("y1", mousedown_node.y)
					        .attr("x2", mousedown_node.x)
					        .attr("y2", mousedown_node.y);

					    // redraw(); 
					  })
					.on("mousedrag", function(d) {
					  	console.log('port mousedrag')
					    // redraw();
					  })
					.on("mouseup", portMouseUp)

			node = vis.selectAll(".block")
				.data(graph.nodes)
				.enter()
				.append("circle")
				.attr("class", function(d){ return 'block block-' + d.prop('type') + ' ' + tagClasses(d)})
				.attr("r", function(d){ return d.rad = blockRadius * scale })
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
				// .call(blockDrag);
				.call(node_drag)
				.on('mouseenter', function(d){ showPorts(d, true) })
				.on('mouseleave', function(d){ showPorts(d, false) })
				.on('click', function(d){ 
					if (didDrag) return

					console.log('click')
					self.selectNode(d) 
					d3.event.stopPropagation()
				})
				.on('dblclick', function(d){ 
					if (didDrag) return

					console.log('double click!')
					
					d3.event.stopPropagation()
				})
				.on("mousedown", 
				  function(d) { 
				    // disable zoom
				    return
				    // vis.call(d3.behavior.zoom().on("zoom", null));

				  })
				.on("mousedrag",
				  function(d) {
				    // redraw();
				  })
				.on("mouseup", 
				  function(d) { 
				  	return
				    if (mousedown_node) {
				      mouseup_node = d; 
				      if (mouseup_node == mousedown_node) { 
				      	resetMouseVars(); 
				      	return; 
				      }

				      // enable zoom
				      // vis.call(d3.behavior.zoom().on("zoom", rescale));
				      // redraw();
				    } 
				  })

			// North port
			// nodeEnter.append('circle')
			// 	.attr('class', 'port port-north')
			// 	.attr('r', 10)
			// 	.attr("cx", function(d) { return 0; d.x + blockRadius * scale; })
			// 	.attr("cy", function(d) { return d.y + blockRadius * scale; })





			text = vis.selectAll("text")
					.data(graph.nodes)
				.enter().append("svg:text")
					.attr("class", function(d) { 
						return tagClasses(d)
						
					})
					.attr("x", function(d) { return d.x; })
					.attr("y", function(d) { return d.y; })
					.attr("dy", ".35em")
					.attr("text-anchor", "middle")
					// .style("opacity", function(d) { 
					// 	console.log('d', d.prop('type') + ': ' + d.prop('id'), 'd.r', d.r); 
					// 	return d.r > zoomThreshold ? 1 : 0; })
					.text(function(d) { return d.prop('type') + ': ' + d.prop('id'); });

			// force.start();
			// force.resume();

		}

		redraw();


		var $window = $(window)
		$window.resize(function(e){

			console.log('resize')

			width = self.$workArea.width()
			height = self.$workArea.height()

			outer
				.attr("width", width)
				.attr("height", height);
		})

		

		function tick(e) {

			var amount = stickAmount * e.alpha;

			var minimum = 0.01
			

			// Moves a node back towards to its world point
			function stick(node){

				if (node.isDragging) return
				
				var desired = worldPosition(node)

				var difference = {
					x: desired.x - node.x,
					y: desired.y - node.y
				}

				// If it's already close to the spot, then leave it
				if (difference.x > minimum || difference.x < -minimum)
					node.x += difference.x * amount

				if (difference.y > minimum || difference.y < -minimum)
					node.y += difference.y * amount

				
				

			}

			// Push sources up and targets down to form a weak tree.
			
			graph.nodes.forEach(function(d, i) {
				stick(d)
			});

			// link.attr("x1", function(d) { return d.x; })
			// 	.attr("y1", function(d) { return d.y; })
			// 	.attr("x2", function(d) { return d.target && d.target.x || d.x; })
			// 	.attr("y2", function(d) { return d.target && d.target.y || d.y; })
			// 	.attr("marker-end", "url(#arrowhead)")

			link
				.attr("d", function(d) {
					if (typeof d.x === 'undefined') 
						return ''

					d3.select(this).classed('hide-link', !d.target)
					.attr("marker-start", d.target ? "url(#arrowhead)" : "")

					var target = d
					if (d.target){
						// calculate the closest point on the block circle to our position
						var point = d
						var center = d.target
						var R = blockRadius * scale
						var vX = point.x - center.x;
						var vY = point.y - center.y;
						var magV = Math.sqrt(vX*vX + vY*vY);
						var aX = center.x + vX / magV * R;
						var aY = center.y + vY / magV * R;

						// if (d.label == 'WEST'){
						// 	var s = d.source.prop('id')
						// 	var t = d.target.prop('id')
						// 	console.log('going from ', s, ' WEST to ', t)

						// 	if (s == '5' && t == '6')
						// 		debugger
						// }

						target = {
							x: aX,
							y: aY
						}

						d3.select(this).attr('to', d.target.prop('id'))
					} else {

						d3.select(this).attr('to', 'self')
					}

					d3.select(this).attr('from', d.source.prop('id'))



					var dx = target.x - d.x,
						dy = target.y - d.y,
						dr = Math.sqrt(dx * dx + dy * dy);
					var p = "M" + d.x + "," + d.y + "A" + dr + "," + dr + " 0 0,1 " + target.x + "," + target.y;
					// console.log("p", p, d)
					return p
				});

			node.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });

			text.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })

			port.attr("cx", function(d) { return d.x = d.source.x + d.lx * blockRadius * scale })
				.attr("cy", function(d) { return d.y = d.source.y + d.ly * blockRadius * scale })
				.classed('force-show', function(d){
					return d.source.isDragging
				})
		}

		


	}

	graph.prototype.drawCluster = function(){

		var self = this

		var width = self.$workArea.width(),
			height = self.$workArea.height(),
			r = width * 0.8,
			x = d3.scale.linear().range([0, r]),
			y = d3.scale.linear().range([0, r]),
			node,
			root;

		var cluster = d3.layout.cluster()
			.size([height, width - 160]);

		var diagonal = d3.vis.diagonal()
			.projection(function(d) { return [d.y, d.x]; });

		var svg = d3.select(".work-area").append("svg")
			.attr("width", width)
			.attr("height", height)
		  .append("g")
			.attr("transform", "translate(40,0)");

		// Read the data
		node = root = self.findWithType('MAP');

		var nodes = cluster.nodes(root),
		  links = cluster.links(nodes);

		var link = vis.selectAll(".link")
		  .data(links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", diagonal);

		var node = vis.selectAll(".node")
		  .data(nodes)
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

		node.append("circle")
		  .attr("r", 4.5);

		node.append("text")
		  .attr("dx", function(d) { return d.children ? -8 : 8; })
		  .attr("dy", 3)
		  .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
		  .text(function(d) { return d.name; });

	}

	graph.prototype.drawPackCircle = function(){

		var self = this

		var w = self.$workArea.width(),
			h = self.$workArea.height(),
			r = w * 0.8,
			x = d3.scale.linear().range([0, r]),
			y = d3.scale.linear().range([0, r]),
			node,
			root;

		var pack = d3.layout.pack()
			.size([r, r])
			.value(function(d) { return 1000; d.prop('id'); })

		var vis = d3.select(".work-area").insert("svg:svg", "h2")
				.attr("width", w)
				.attr("height", h)
			.append("svg:g")
				.attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

		



		// Read the data
		node = root = self.findWithType('MAP');

		var nodes = pack.nodes(root);

		var zoomThreshold = 40

		vis.selectAll("circle")
			.data(nodes)
			.enter().append("svg:circle")
				.attr("class", function(d) { 
					var ancestory = d.children && d.children.length ? "parent" : "child"
					var type = 'node-' + d.prop('type').toLowerCase()
					return ancestory + ' ' + type;
				})
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
				.attr("r", function(d) { return d.r; })
				.on("click", function(d) { return zoom(node == d ? root : d); });

		vis.selectAll("text")
				.data(nodes)
			.enter().append("svg:text")
				.attr("class", function(d) { return d.children ? "parent" : "child"; })
				.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })
				.attr("dy", ".35em")
				.attr("text-anchor", "middle")
				.style("opacity", function(d) { 
					console.log('d', d.prop('type') + ': ' + d.prop('id'), 'd.r', d.r); 
					return d.r > zoomThreshold ? 1 : 0; })
				.text(function(d) { return d.prop('type') + ': ' + d.prop('id'); });



		d3.select(window).on("click", function() { 
			zoom(root); 
		});
		

		var zoom = function(d, i) {
			var k = r / d.r / 2;
			x.domain([d.x - d.r, d.x + d.r]);
			y.domain([d.y - d.r, d.y + d.r]);

			var t = vis.transition()
					.duration(d3.event.altKey ? 7500 : 750);

			t.selectAll("circle")
					.attr("cx", function(d) { return x(d.x); })
					.attr("cy", function(d) { return y(d.y); })
					.attr("r", function(d) { return k * d.r; });

			t.selectAll("text")
					.attr("x", function(d) { return x(d.x); })
					.attr("y", function(d) { return y(d.y); })
					.style("opacity", function(d) { return k * d.r > zoomThreshold ? 1 : 0; });

			node = d;
			d3.event.stopPropagation();
		}

	}

	graph.prototype.selectNode = function(node, showPane){

		var self = this

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
		if (_.isBoolean(showPane) ? showPane : true)
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
			self.selectNode(node)
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