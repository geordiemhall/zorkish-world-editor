/* 
 * World
 *
 * Represents a Zorkish world with a superset of features from Zorkish itself. 
 * Can load a world from text, and export a world to text
 * 
 * @geordiemhall
======================================================= */

;(function($, window){

	

	window.World = function(opts){
		return new world(opts)
	}



	var defaults = {
		
	}

	var world = function(opts){

		this.opts = $.extend({}, defaults, opts || {})

		this.init()

	}



	world.prototype.init = function(){

		var self = this
	
		self.entity = null
		self.editorComments = {}
		// self.entityIndex = {}

	}

	world.prototype.deleteEntity = function(entity){

		// set this block's parent to be null...

		var realEntity = self.findById(entity.prop('id'))

		realEntity.parent(null)

	}

	// TODO: This should be set to the highest id found when reading a world in
	var lastIndex = 100

	var generateId = function(){
		return (++lastIndex) + ''
	}

	world.prototype.newEntity = function(type){

		var self = this

		var entity = new Entity(new ASTNode({
			type: type.toUpperCase(),
			id: generateId()
		}), self)


		return entity

	}



	/**
	* Saving
	*/


	world.prototype.toString = function(){

		return this.entity.toString()

	}



	/**
	* Parsing
	*/

	world.prototype.importFromText = function(text){
		
		var self = this

		var ast = self.generateASTFromText(text)
		
		self.entity = new Entity(ast, self)


	}




	world.prototype.generateASTFromText = function(text){

		var self = this
		var rootNode = null

		var lines = text.split('\n')

		var nodes = []
		var nodeStack = []
		var editorComments = {}

		$.each(lines, function(i, line){

			var editorComment = isEditorComment(line)
			if (editorComment){
				editorComments[editorComment.key.toUpperCase()] = editorComment.value
				return true
			}

			var cleaned = cleanLine(line)

			// If blank, skip
			if (cleaned.trim() === "")
				return true

			// Process the line
			var header, prop
			var indent = indentOfString(cleaned)
			

			if (header = isHeader(cleaned)){

				var node = new ASTNode(header)
				
				// Add to our indexes
				nodes.push(node)
				// nodeIndex[node.id()] = node

				if (!nodeStack.length)
					rootNode = node

				// Pop till we're at our parent
				while (nodeStack.length > indent){
					nodeStack.pop()	
				}

				// If there's a parent
				if (nodeStack.length){
					var parentNode = _.last(nodeStack)
					node.setParent(parentNode)
				}

				// We're on top now
				nodeStack.push(node)
				
			} else if (prop = isProperty(cleaned)){

				_.last(nodeStack).prop(prop.key, prop.value)

			}



		})


		window.EditorComments = editorComments

		return rootNode

	}

	var headerExp = /^\s*==\s*/
	var propertyExp = /([a-zA-Z_]+)\s*:\s*?(.+)/
	var editorCommentExp = /^.*\/\/\-\s*([a-zA-Z_]+)\s*:\s*?(.+)/

	var isHeader = function(line){
		
		if (line.trim().indexOf('==') === 0){
			var p = isProperty(line.replace(headerExp, ''))
			if (p){
				return {
					type: p.key,
					id: p.value
				}
			}
		}

		return false
	}

	var isProperty = function(line){

		var p = line.match(propertyExp)

		if (!p) return false
		
		return {
			key: p[1].trim(),
			value: p[2].trim()
		}
	}

	var isEditorComment = function(line){

		var p = line.match(editorCommentExp)

		if (!p) return false
		
		return {
			key: p[1].trim(),
			value: p[2].trim()
		}

	}



	/**
	* Searching
	*/

	world.prototype.find = function(predicate, recursive, inSelf){
		return this.entity.find(predicate, recursive, inSelf)
	}

	world.prototype.findWithId = function(id){
		return this.entity.findWithId(id)
	}

	world.prototype.findWithName = function(name){
		return this.entity.findWithName(name)
	}

	world.prototype.findWithType = function(name){
		return this.entity.findWithType(name)
	}

	world.prototype.childWithId = function(id){
		return this.entity.childWithId(id)
	}

	world.prototype.childWithName = function(name){
		return this.entity.childWithName(name)
	}

	world.prototype.childWithType = function(name){
		return this.entity.childWithType(name)
	}


	/**
	* Utility
	*/

	var trimRight = function(s){
		return s.replace(/\s+$/g, '')
	}

	var trimLeft = function(s){
		return s.replace(/^\s+/, '')
	}

	var cleanLine = function(line){

		// Strip any comments, starting spaces (not tabs) and trailing whitespace
		return trimRight(line.replace(/\/\/.*/, '').replace(/^ +/, ''))

	}

	var indentOfString = function(s){
		return (s.match(/^ *(\t)+/g)||[''])[0].length
	}

	




	/**
	* Entity
	*/


	window.Entity = function(node, world) {

		var self = this
		
		// Store our original node
		this.node = node
		this.world = world

		this.props = {}
		this.children = {}
		this.parent = null

		// And some data
		this.props = $.extend(true, {}, node._props)
		// this.props.id = node.prop('id')
		// this.props.type = node.prop('type')

		// Add ourselves to the index
		// world.entityIndex[this.prop('id')] = this

		// Make entities for children
		_.each(node.children(), function(d, i){
			var child = new Entity(d, world)
			child.setParent(self)
		})

	}



	Entity.prototype.setParent = function(parentEntity){

		// If our new parent is null, then remove ourselves from the old parent
		if (!parentEntity && this.parent)
			this.parent.removeChild(this)

		// Update our parent
		this.parent = parentEntity;

		// If our new parent isn't null, then add ourselves as its child
		if (this.parent)
			this.parent.addChild(this)


	}

	Entity.prototype.addChild = function(childEntity){
		// Since we're using id as the lookup, we don't need to worry about duplicates
		this.children[childEntity.prop('id')] = childEntity;
	}

	Entity.prototype.removeChild = function(childEntity){
		// Delete it from our children object
		this.node.removeChild(childEntity)
		delete this.children[childEntity.prop('id')]

	}

	Entity.prototype.remove = function(){

		this.setParent(null)
		
	}



	
	Entity.prototype.toNode = function(){


		// Make a new node?
		var newNode = new ASTNode(this.props)

		_.each(this.children, function(d, i){
			var n = d.toNode()
			n.setParent(newNode)
		})

		return newNode


		// Overwrite our exiting node's data
		// this.node.prop(this.props)

		// return this.node
		

	}

	Entity.prototype.prop = function(key, value){

		var self = this

		// Getter
		if (typeof value === 'undefined'){
			return self.props[key] || self.node.prop(key, value)
		}

		// Setter
		if (_.isString(key)){
			self.props[key] = value	
			self.node.prop(key, value)
		} else if (_.isObject(key)) {
			_.each(key, function(d, i){
				self.prop(i, d)
			})
		}

		return self

	}


	Entity.prototype.toString = function(){

		


		var s = ["\n\n", this.toNode().toString(), "\n"]




		// $.each(this.children, function(i, child){
		// 	s.push(child.toString())
		// })


		console.log(this.prop('id'), 'to string', s.join(''))

		return s.join('')

	}

	Entity.prototype.find = function(predicate, recursive, inSelf){

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

	Entity.prototype.findWithId = function(id){
		return this.find(function(entity){
			return entity.prop('id') === id
		}, true, true)
	}

	Entity.prototype.findWithName = function(name){
		return this.find(function(entity){
			return entity.prop('name') === name
		}, true, true)
	}

	Entity.prototype.findWithType = function(type){
		return this.find(function(entity){
			return entity.prop('type') === type
		}, true, true)
	}

	Entity.prototype.childWithId = function(id){
		return this.find(function(entity){
			return entity.prop('id') === id
		}, false, false)
	}

	Entity.prototype.childWithName = function(name){
		return this.find(function(entity){
			return entity.prop('name') === name
		}, false, false)
	}

	Entity.prototype.childWithType = function(type){
		return this.find(function(entity){
			return entity.prop('type') === type
		}, false, false)
	}



	






})(jQuery, window);