/* 
 * Graph node
 *
 * Base object for all objects visible on the graph
 * Contains scaffolding for sub-nodes to add components
 * which are displayed in the sidebar
 * 
 * @geordiemhall
======================================================= */


;(function($, window){

	
	var GraphNodes = {}

	// window.GraphNode = function(entity){
	// 	return new Node(entity)
	// }

	window.capitaliseFirstLetter = function(string){
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}



	var defaults = {}

	window.GraphNodeFactory = function(entity, graph){

		var NodeType = GraphNodes[entity.prop('type').toLowerCase()]

		if (NodeType)
			return new NodeType(entity, graph)

		return new GraphNode(entity, graph)
	}

	var GraphNode = function(entity, graph){

		var self = this

		this.entity = entity
		this.graph = graph

		this.children = []
		this.parent = null

		console.log('GraphNode init')
		this.init()


		_.each(entity.children, function(en, i){
			var node = GraphNodeFactory(en, graph)
			node.setParent(self)
		})

	}

	GraphNode.prototype.remove = function(){

		console.log('delete ourselves')

		this.setParent(null)

	}

	GraphNode.prototype.setParent = function(parentNode){

		// If our new parent is null, then remove ourselves from the old parent
		if (!parentNode && this.parent)
			this.parent.removeChild(this)

		// Update our parent
		this.parent = parentNode;

		// If our new parent isn't null, then add ourselves as its child
		if (this.parent)
			this.parent.addChild(this)

		this.entity.setParent(parentNode && parentNode.entity || null)

	}

	GraphNode.prototype.hasChild = function(childNode){

		return _.contains(this.children, childNode)

	}

	GraphNode.prototype.addChild = function(childEntity){
		// Since we're using id as the lookup, we don't need to worry about duplicates
		if (!this.hasChild(childEntity))
			this.children.push(childEntity);
	}

	GraphNode.prototype.removeChild = function(childEntity){

		// Remove it from our children
		this.children = _.without(this.children, childEntity)
	}

	GraphNode.prototype.init = function(){

		console.log('GraphNode init() about to define this.components')
		this.components = []

		this.pane = 'entity'
		this.initComponents()
		

	}

	// Meant to be overridden
	GraphNode.prototype.initComponents = function(){
		this.addComponent(Components.Description)

		this.pane = {
			name: 'entity',
			label: capitaliseFirstLetter(this.entity.prop('type').toLowerCase())
		}
	}

	GraphNode.prototype.addComponent = function(Comp, opts){

		console.log('GraphNode addComponent() ')

		var comp = new Comp(this, opts)

		this.components.push(comp)

		return comp
		
	}

	GraphNode.prototype.select = function(sidebar){

		var $sidebarPage = sidebar.getPage('entity')


	}

	GraphNode.prototype.prop = function(key, value){
		return this.entity.prop(key, value)
	}

	// GraphNode.prototype.children = function(){
	// 	return this.children
	// }


	GraphNode.prototype.find = function(predicate, recursive, inSelf){

		var self = this
		
		recursive = _.isBoolean(recursive) ? recursive : false
		inSelf = _.isBoolean(inSelf) ? inSelf : false

		if (inSelf && predicate(self)){
			return self
		}

		var found = null

		$.each(self.children, function(i, child){
			if (predicate(child)){
				found = child
				return false
			}
				
		})


		if (!found && recursive){
			$.each(self.children, function(i, child){
				var result = child.find(predicate, true)
				if (result){
					found = result
					return false
				}
			})
		}

		return found

	}

	GraphNode.prototype.findWithId = function(id){
		return this.find(function(entity){
			return entity.prop('id') === id
		}, true, true)
	}

	GraphNode.prototype.findWithName = function(name){
		return this.find(function(entity){
			return entity.prop('name') === name
		}, true, true)
	}

	GraphNode.prototype.findWithType = function(type){
		return this.find(function(entity){
			return entity.prop('type') === type
		}, true, true)
	}

	


	

	/**
	* BlockNode
	*/


	var BlockNode = GraphNodes.block = function(entity) {
		
		// Init super
		GraphNode.apply(this, arguments);

		

	}
	
	BlockNode.prototype = Object.create(GraphNode.prototype);

	BlockNode.prototype.initComponents = function(){

		console.log('BlockNode init')
		this.addComponent(Components.Tags)
		this.addComponent(Components.Directions)

		this.pane = {
			name: 'entity',
			label: 'Block'
		}

	}

	BlockNode.prototype.select = function(){
		GraphNode.prototype.select.apply(this, arguments)
		console.log("block select")
	}






	/**
	* WorldNode
	*/


	var WorldNode = GraphNodes.world = function(entity) {
		
		// Init super
		console.log('WorldNode()')
		GraphNode.apply(this, arguments);

	}
	
	WorldNode.prototype = Object.create(GraphNode.prototype);

	WorldNode.prototype.initComponents = function(){

		this.addComponent(Components.World)

		this.pane = 'world'
		this.pane = {
			name: 'world',
			label: 'World'
		}

		console.log('WorldNode init')

	}

	WorldNode.prototype.select = function(){
		GraphNode.prototype.select.apply(this, arguments)
		console.log("block select")
	}




	/**
	* PlayerNode
	*/


	var PlayerNode = GraphNodes.player = function(entity) {
		
		// Init super
		GraphNode.apply(this, arguments);



	}
	
	PlayerNode.prototype = Object.create(GraphNode.prototype);

	PlayerNode.prototype.initComponents = function(){

		console.log('PlayerNode init')
		this.addComponent(Components.Player)

		this.pane = {
			name: 'player',
			label: 'Player'
		}

	}

	PlayerNode.prototype.select = function(){
		GraphNode.prototype.select.apply(this, arguments)
		console.log("block select")
	}






})(jQuery, window);



