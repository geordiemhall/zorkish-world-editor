/* 
 * File
 *
 * Allows for easy reading of files
 * Supports drag and drop, and standard file input
 * 
 * @geordiemhall
======================================================= */

;(function($, window){

	window.OpenFile = function(opts){
		return new openFile(opts)
	}




	var defaults = {
		$dropZone: null,
		$input: null,
		onOpen: $.noop
	}

	var openFile = function(opts){

		this.opts = $.extend(true, {}, defaults, opts || {})

		this.init()

	}



	openFile.prototype.init = function(){

		var self = this
		var $input = self.opts.$input
		var $dropZone = self.opts.$dropZone

		if ($input && $input.length){
			$input.on('change', function(e){
				self.inputChanged(e, self)
			})
		}

		if ($dropZone && $dropZone.length){
			self.initDrop()
		}

	}

	openFile.prototype.inputChanged = function(e, self){
		
		var files = e.target.files
		var file = files.length && files[0] || null

		if (file)
			self.readFile(file)
		
	}

	openFile.prototype.initDrop = function(){
		
		var self = this

		var $dropTrigger = $('body')
		var dropTrigger = $dropTrigger[0]

		self.opts.dropZone = self.opts.$dropZone[0]


		console.log('dropTrigger', dropTrigger)
		dropTrigger.addEventListener("dragleave", 	function(e){ self.hideDropIfShould(e, self) }, 	false)
		// dropTrigger.addEventListener("dragend", 	function(e){ self.hideDrop(e, self) }, 	false)
		// dropTrigger.addEventListener("dragenter", 	function(e){ self.showDrop(e, self) }, 	false)
		dropTrigger.addEventListener("dragover", 	function(e){ self.showDrop(e, self) }, 	false)
		dropTrigger.addEventListener("drop", 		function(e){ self.onDrop(e, self) }, 	false)
		// $(document).on('keydown', function(e){ self.hideDrop(e, self) })
	}

	openFile.prototype.readFile = function(file){

		var self = this

		console.log("readFile", file)

		var filename = file.name

		var fr = new FileReader()

		// Set up our callbacks
		fr.onload = function(e){
			var fileContents = fr.result
			self.opts.onOpen(fileContents, filename)
		}

		// And read the file
		fr.readAsText(file)

	}

	openFile.prototype.showDrop = function(e, self){
		e.stopPropagation()
		e.preventDefault()
		self.opts.$dropZone.addClass('dragging')
	}

	openFile.prototype.hideDropIfShould = function(e, self){
		console.log("hideIfShould", e)
		e.stopPropagation()
		e.preventDefault()
		console.log(e.target)
		if (!e.target || e.target === self.opts.dropZone)
			self.opts.$dropZone.removeClass('dragging')
	}

	openFile.prototype.hideDrop = function(e, self){
		console.log("hideDrop")
		self.opts.$dropZone.removeClass('dragging')
	}

	openFile.prototype.onDrop = function(e, self){
		
		console.log('onDrop!')
		e.stopPropagation()
		e.preventDefault()
		
		self.opts.$dropZone.removeClass('dragging')

		var dt = e.dataTransfer
		var files = dt.files

		self.readFile(files[0])
	}



})(jQuery, window);