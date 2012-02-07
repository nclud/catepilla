/**
* Catepilla - a silly image plugin
*/

(function( window, undefined ) {
//
var document = window.document;



// -------------------------- Catepilla -------------------------- //

function Catepilla( elem, options ) {

  if ( !elem ) {
    return;
  }

  this.elem = elem;

  this.options = {};

  for ( var prop in Catepilla.defaults ) {
    this.options[ prop ] = Catepilla.defaults[ prop ];
  }

  for ( prop in options ) {
    this.options[ prop ] = options[ prop ];
  }

  this._create();

}


Catepilla.defaults = {
  segmentCount: 5
};

Catepilla.prototype._create = function() {

  // css for elem
  this.elem.style.position = 'relative';

  var w = this.width = this.elem.offsetWidth;

  this.img = this.elem.getElementsByTagName('img')[0];
  this.img.style.display = 'none';

  var segmentCount = this.options.segmentCount;
  
  this.segments = [];


  var segment;
  var frag = document.createDocumentFragment();
  for ( var i=0; i < segmentCount; i++ ) {
    segment = new CatepillaSegment({
      width: Math.round( w / segmentCount ),
      index: i,
      imgSrc: this.img.src,
      imgWidth: w
    });
    frag.appendChild( segment.elem );
  }

  this.elem.appendChild( frag );

}

window.Catepilla = Catepilla;

// -------------------------- CatepillaSegment -------------------------- //

function CatepillaSegment( props ) {
  // extend props over segment, width, imgSrc, index
  for ( var prop in props ) {
    this[ prop ] = props[ prop ];
  }

  this.elem = document.createElement('div');
  this.elem.style.position = 'absolute';
  this.elem.style.overflow = 'hidden';
  this.elem.style.width = this.width + 'px';
  this.elem.style.height = '100%';

  this.img = new Image();
  this.img.src = props.imgSrc;
  this.img.width = props.imgWidth;
  this.img.style.position = 'absolute';
  this.elem.appendChild( this.img );

}

})( window );