/* Node
======================================================= */


;(function($, window){

	

	window.ASTNode = function(opts){
		return new Node(opts)
	}



	var defaults = {
		type: 'ENTITY',
		id: '0000000'
	}

	var Node = function(props){

		this._props = {}
		this._parent = null
		this._children = {}

		this.prop(defaults)
		this.prop(props)

		this.init()

	}

	Node.prototype.init = function(){

	}


	Node.prototype.prop = function(key, value){

		var self = this

		// Getter
		if (typeof value === 'undefined' && key && _.isString(key)){
			return this._props[key]
		}

		// Setter
		if (_.isString(key)){
			this._props[key] = value	
		} else if (_.isObject(key)) {
			_.each(key, function(d, i){
				self.prop(i, d)
			})
		}

		return self

	}

	Node.prototype.setParent = function(parentNode){

		this._parent = parentNode
		parentNode.addChild(this)

	}

	Node.prototype.addChild = function(childNode){
		this._children[childNode.prop('id')] = childNode
	}

	Node.prototype.removeChild = function(childNode){
		delete this._children[childNode.prop('id')]
	}

	// Node.prototype.type = function(){
	// 	return this.prop('type')
	// }

	// Node.prototype.id = function(){
	// 	return this.prop('id')
	// }

	Node.prototype.props = function(){
		return this._props
	}

	Node.prototype.children = function(){
		return this._children
	}

	Node.prototype.parent = function(){
		return this._parent
	}

	Node.prototype.parentCount = function(){
		return (this.hasParent()) ? 1 + this.parent().parentCount() : 0;
	}

	Node.prototype.hasParent = function(){
		return !!this.parent()
	}

	Node.prototype.toString = function(){

		// Grab our indent
		var indent = this.parentCount();

		var sb = ""
		var endl = '\n'
		var delimiter = ':'
		var headToken = '=='
		
		
			
		// Print our heading
		sb += indentString(indent);
		sb += headToken + " " + this.prop('type') + delimiter +  " " + this.prop('id') + endl;
		
		
		// Print our properties
		_.each(this.props(), function(value, key){

			if (!value)
				return

			// Reserved props
			if (key === 'id' || key === 'type') 
				return

			// Otherwise output the property
			sb += indentString(indent + 1);
			sb += key.toUpperCase() + delimiter +  " " + value + endl;

		})
			
		
		
		sb += endl;
		
		// Print our children
		_.each(this.children(), function(child, i){
			sb += child.toString();
		})
		
		return sb;


	}

	var indentString = function(n, character){
		character = character || '\t'
		var s = ""
		while (n){
			s += character;
			n--
		}
		return s
	}

	

	/**
	* Block
	*/


	window.Block = function(node) {
	    Entity.apply(this, arguments);
	}

	
	Block.prototype = Object.create(Entity.prototype);

	Block.prototype.directions = function(){

	}

	Block.prototype.select = function(){
		Entity.prototype.select.apply(this, arguments)
		console.log("block select")
	}


})(jQuery, window);