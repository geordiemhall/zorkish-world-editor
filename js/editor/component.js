/* Component
======================================================= */


;(function($, window){


	/**
	* Component
	*/

	window.Components = {}

	var Component = function(graphNode){
		
		this.graphNode = graphNode
		this.init()

	}

	Component.prototype.init = function(){



	}

	// Add your elements to a sidebar container element
	// and populate them with your data
	Component.prototype.present = function($container){

		console.warning('Component.present, should never be called')

		return $container

	}

	// Last chance to grab your data from your sidebar elements 
	Component.prototype.deselect = function($container){

	}

	Component.prototype.bindProperty = function(property, inputText){

		var self = this

		inputText.input.$input.on('keyup change', function(e){
			

			var newValue = $(this).val()

			self.graphNode.prop(property, newValue)

			console.log(property, 'newValue', newValue)
		})

		
		var initialValue = self.graphNode.prop(property)
		
		// Fill with the default value
		inputText.input.$input
			.val(initialValue)
			.change().keyup()	// and trigger change so that it can update if it needs to
	

	}

	Component.prototype.getElementForProperty = function(opts){

		var inputText = new InputText(opts)

		this.bindProperty(opts.prop, inputText)

		return inputText

	}


	var InputText = function($block, opts){

		var options = opts || $block || {}

		this.opts = $.extend({
			label: 'New field:',
			type: 'text',
			prompt: '',
			onChange: $.noop
		}, options)

		this.init()

		// If $block was passed first, opts will exist
		if (opts && $block.jquery){
			this.addToBlock($block)
		}



	}

	InputText.prototype.inputTypes = {
		text: function(opts){

			var $input = $('<input class="form-control">')
				.attr({
					placeholder: opts.prompt,
					name: opts.fieldName,
					id: opts.fieldName
				})

			return {
				$input: $input,
				$container: $input
			}

			
		},
		paragraph: function(opts){
			
			var $container = $('<div class="autofit-container">')

			var $autofit = $('<div class="autofit form-control"></div>')
				.appendTo($container)

			var $input = $('<textarea class="form-control"></textarea>')
				.appendTo($container)
				.attr({
					placeholder: opts.prompt,
					name: opts.fieldName,
					id: opts.fieldName
				})
				.on('keyup change', function(e){
					$autofit.html($(this).val().replace(/\n/g, '<br>') + '.')
				})
				.on('focus focusout', function(e){
					$autofit.toggleClass('focus', e.type === 'focus')
				})

			return {
				$input: $input,
				$container: $container
			}

		}
	}

	InputText.prototype.getInput = function(type){

		return this.inputTypes[type]({
			prompt: this.opts.prompt,
			fieldName: this.fieldName
		})

	}

	InputText.prototype.init = function(){

		var self = this

		var $block = this.$block = $('<div class="form-group"></div>')

		// var name = self.opts.bindTo || Date.now()
		var name = this.fieldName = 'field-' + Date.now()

		this.$label = $('<label>Description:</label>')
			.appendTo($block)
			.text(self.opts.label)
			.attr('for', name)

		

		this.input = this.getInput(self.opts.type)
		this.input.$container.appendTo($block)


			
	}

	InputText.prototype.getElement = function(){
		return this.$block
	}

	InputText.prototype.addToBlock = function($block){
		this.getElement().appendTo($block)
	}





	/**
	* Description
	*/

	var Description = Components.Description = function(entity) {
	    Component.apply(this, arguments);
	}
	
	Description.prototype = Object.create(Component.prototype);

	Description.prototype.present = function($container){

		var self = this

		this.getElementForProperty({
			prop: 	'DESCRIPTION_NAME',
			label: 	'Names:',
			prompt: 'What the player can refer to this object by'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_SINGULAR_PRONOUN',
			label: 	'Singular pronoun',
			prompt: 'Pronoun for just one object'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_SINGULAR',
			label: 	'Singular',
			prompt: 'Name for single object'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_PLURAL_PRONOUN',
			label: 	'Plural pronoun',
			prompt: 'Pronoun for multiple objects'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_PLURAL',
			label: 	'Singular',
			prompt: 'Name when there are multiple objects'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_SINGULAR_POSSESSIVE',
			label: 	'Singular possessive',
			prompt: 'Pronoun when in player\'s possession'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_DETAILED',
			label: 	'Detailed:',
			prompt: 'When this object is looked at',
			type: 	'paragraph'
		}).addToBlock($container)



		return $container
	}

	

	/**
	* Directions
	*/

	var Directions = Components.Directions = function(entity) {
		// Init super
	    Component.apply(this, arguments);
	}
	
	Directions.prototype = Object.create(Component.prototype);

	Directions.prototype.present = function($container){

		this.getElementForProperty({
			prop: 	'DESCRIPTION_NAME',
			label: 	'Title:',
			prompt: 'Short title for the block'
		}).addToBlock($container)
		
		this.getElementForProperty({
			prop: 	'DESCRIPTION_DETAILED',
			label: 	'Close description:',
			prompt: 'When looked at from this block',
			type: 	'paragraph'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_DISTANT',
			label: 	'Distant description:',
			prompt: 'When looked at from another block',
			type: 	'paragraph'
		}).addToBlock($container)

		$('<hr>').appendTo($container)

		this.getElementForProperty({
			prop: 	'NORTH',
			label: 	'North',
			prompt: 'Block to the north of this one'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'SOUTH',
			label: 	'South',
			prompt: 'Block to the south of this one'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'WEST',
			label: 	'West',
			prompt: 'Block to the west of this one'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'EAST',
			label: 	'East',
			prompt: 'Block to the east of this one'
		}).addToBlock($container)

		return $container
	}




	/**
	* World properties
	*/

	var WorldProperties = Components.World = function(entity) {
	    Component.apply(this, arguments);
	}
	
	WorldProperties.prototype = Object.create(Component.prototype);

	WorldProperties.prototype.present = function($container){

		var self = this

		this.getElementForProperty({
			prop: 	'DESCRIPTION_NAME',
			label: 	'Name:',
			prompt: 'The name of the world',
			type: 	'text'
		}).addToBlock($container)

		this.getElementForProperty({
			prop: 	'DESCRIPTION_DISTANT',
			label: 	'Description:',
			prompt: 'Used in the level select screen',
			type: 	'paragraph'
		}).addToBlock($container)

		$container.append('<hr>')



		$('<a href="#save">Save world</div>')
			.appendTo($container)
			.on('click', function(e){
				e.preventDefault()
				self.graphNode.graph.saveWorldAsFile()
			})


		return $container
	}


	/**
	* Player properties
	*/

	var PlayerProperties = Components.Player = function(entity) {
	    Component.apply(this, arguments);
	}
	
	PlayerProperties.prototype = Object.create(Component.prototype);

	PlayerProperties.prototype.present = function($container){

		var self = this

		this.getElementForProperty({
			prop: 	'DESCRIPTION_DETAILED',
			label: 	'Description:',
			prompt: 'When the player looks at themselves',
			type: 	'paragraph'
		}).addToBlock($container)

		$container.append('<hr>')

		this.getElementForProperty({
			prop: 	'POSITION',
			label: 	'Position',
			prompt: 'Which block the player is in'
		}).addToBlock($container)


		return $container
	}


})(jQuery, window);