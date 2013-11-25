/* 
 * Editor
 *
 * Entry-point for the world editor.
 * Ties together the various components to allow the user
 * to load a world from file, edit the world, then save the
 * world back out to a file 
 * 
 * @geordiemhall
======================================================= */


$(function(){


	

	// Create our world data object
	var world = new World({

	})


	

	var sidebar = new Sidebar({
		$sidebar: $('.sidebar')
	})

	var graph = new Graph({
		$workArea: $('.work-area'),
		sidebar: sidebar
	})

	var file = new OpenFile({
		$dropZone: $('.drop-zone'),
		$input: $('.file-open'),
		onOpen: function(contents, filename){
			console.log('onOpen: ')
			console.log(contents)

			// We don't need the work area to be a click zone
			$('.work-area .file-container').hide()

			// Load the file into our model
			world.importFromText(contents)

			// Then init the graph with the world
			// it will init the sidebar as needed
			graph.initWithWorld(world, filename)
		}
	})


})

