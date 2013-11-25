/* 
 * Sidebar
 *
 * Controller for the sidebar
 * Provides detail for the selected entity, and allows for editing
 * of world-level information, such as player info and sidebar name
 * 
 * @geordiemhall
======================================================= */

;(function($, window){

	
	// Expose ourselves
	window.Sidebar = function(opts){
		return new sidebar(opts)
	}



	var defaults = {
		$sidebar: null
	}

	var classes = {
		nav: 'sidebar-nav',
		panes: 'sidebar-panes',
		pane: 'sidebar-pane',
		stageLeft: 'stage-left',
		stageRight: 'stage-right',
		disabled: 'disabled',
		componentContainer: 'component-container',
		disabledText: 'text-muted',
		navSelected: 'selected'
	}

	var selectors = $.extend({}, classes)
	$.each(selectors, function(i, d){ selectors[i] = '.' + d })

	var sidebar = function(opts){

		this.opts = $.extend({}, defaults, opts || {})

		if (!this.opts.$sidebar.length){
			console.error('Sidebar has no element')
			return
		}

		this.init()

	}




	sidebar.prototype.init = function(){

		var self = this

		self.$sidebar 			= self.opts.$sidebar
		self.$nav 				= self.$sidebar.find(selectors.nav)
		self.$paneContainer 	= self.$sidebar.find(selectors.panes)
		self.$panes 			= self.$sidebar.find(selectors.pane)

		self.initNav()

	}

	/**
	* Navigation and panes
	*/


	sidebar.prototype.initNav = function(){

		var self = this

		self.$nav.find('a').each(function(){
			
			var $this = $(this)
			var pane = $this.attr('href').replace('#', '')
			var $pane = self.getPaneElement(pane)
			$pane.data('nav-item', $this)

			$this.on('click', function(e){
				e.preventDefault()
				if ($pane.length)
					self.showPane($pane)
			})
		})

		self.disablePane('entity', 'No entity selected.')
		self.disablePane('world', 'No world selected.')
		self.disablePane('player', 'No player selected.')

	}

	sidebar.prototype.setPaneLabel = function(pane, label){

		var $pane = this.getPaneElement(pane)
		var $navItem = $pane.data('nav-item')
		$navItem.text(label)

	}

	sidebar.prototype.showPane = function(pane){

		var self = this

		var $pane = self.getPaneElement(pane)

		

		var $navItem = $pane.data('nav-item')
		$navItem.addClass(classes.navSelected).siblings().removeClass(classes.navSelected)

		if (pane.label)
			self.setPaneLabel($pane, pane.label)

		console.log("showPane", $pane)

		var found = false
		var both = [classes.stageLeft, classes.stageRight].join(' ')

		self.$panes.each(function(i, d){
			var $this = $(this)

			if (this == $pane[0]){
				found = true
				$this.removeClass(both)
			} else {
				$this.removeClass(both)
				$this.addClass(found ? classes.stageRight : classes.stageLeft)
			}

			console.log(this == $pane[0])
		})


	}

	sidebar.prototype.getPaneElement = function($pane){

		if (_.isString($pane)){
			// passed the name of a pane
			return this.$panes.filter('[data-pane="' + $pane + '"]')
		} else if ($pane.jquery){
			return $pane
			// passed what we want
		} else if ($pane.name){
			return this.getPaneElement($pane.name)
		} 

		return null

	}



	sidebar.prototype.clearPane = function(pane){
		this.getPaneElement(pane).empty()
	}

	sidebar.prototype.addSeparatorToPane = function(pane){



		var $sep = $('<hr>').appendTo(this.getPaneElement(pane))
	}

	sidebar.prototype.addComponentToPane = function(pane){



		var $container = $('<div>').addClass(classes.componentContainer)

		$container.appendTo(this.getPaneElement(pane))

		return $container

	}

	sidebar.prototype.disablePane = function(pane, text){

		this.clearPane(pane)

		var $text = $('<div>')
			.addClass(classes.disabledText)
			.text(text)
			.appendTo(this.getPaneElement(pane))


	}


	/**
	* State
	*/


	sidebar.prototype.enable = function(){
		this.$sidebar.removeClass(classes.disabled)
	}

	sidebar.prototype.disable = function(){
		this.$sidebar.addClass(classes.disabled)
	}



})(jQuery, window);