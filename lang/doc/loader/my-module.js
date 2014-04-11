define( 'lofty/lang/doc/loader/my-module', [], function( ){
    
    var myModule = {
		say:function( message ){
			alert( message );
		}
	};
    return myModule;
} );