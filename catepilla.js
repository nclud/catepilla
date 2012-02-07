/**
* Catepilla - a silly image plugin
*/

/*jshint forin: false */

(function( window, undefined ) {
// get global vars
var document = window.document;
var Modernizr = window.Modernizr;
// get convienent vars
var transformProp = Modernizr.prefixed('transform');

var positionElem = Modernizr.csstransforms3d ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  } : Modernizr.csstransforms ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate(' + x + 'px, ' + y + 'px)';
  } : function( elem, x, y ) {
    elem.style.left = x + 'px';
    elem.style.top = y + 'px';
  };

//

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

  this.create();

}


Catepilla.defaults = {
  segmentCount: 5
};

Catepilla.prototype.create = function() {

  // css for elem
  this.elem.style.position = 'relative';

  var w = this.width = this.elem.offsetWidth;
  this.height = this.elem.offsetHeight;

  this.img = this.elem.getElementsByTagName('img')[0];
  
  var loaderImg = new Image();
  loaderImg.addEventListener( 'load', this, false );
  loaderImg.src = this.img.src;
  
};

Catepilla.prototype._createSegments = function() {

  console.log( this.img.offsetHeight );
  this.img.style.display = 'none';

  var segmentCount = this.options.segmentCount;
  
  this.segmentWidth = this.width / segmentCount;
  
  this.segments = [];

  var segment;
  var frag = document.createDocumentFragment();
  for ( var i=0; i < segmentCount; i++ ) {
    segment = new CatepillaSegment({
      parent: this,
      width: this.segmentWidth,
      index: i,
      imgWidth: this.width
    });
    frag.appendChild( segment.elem );
  }

  this.elem.appendChild( frag );


};


// ----- event handling ----- //

Catepilla.prototype.handleEvent = function( event ) {
  var handleMethod = '_' + event.type + 'Handler';
  if ( this[ handleMethod ] ) {
    this[ handleMethod ]( event );
  }
};

// triggered after img loads
Catepilla.prototype._loadHandler = function( event ) {
  this.imgSize = {
    width: event.target.width,
    height: event.target.height
  };
  this._createSegments();
};

// put in global namespace
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
  this.height = this.parent.height;

  this.img = new Image();
  this.img.src = this.parent.img.src;
  

  var imgSize = this.parent.imgSize;
  
  var sizeRatio = this.imgWidth / imgSize.width;
  this.imgOffsetY = imgSize.height * ( 1 - sizeRatio );
  
  this.img.width = this.imgWidth;
  this.img.style.position = 'absolute';


  this.position( 0 );

  this.elem.appendChild( this.img );

}

CatepillaSegment.prototype.position = function( y ) {
  positionElem( this.elem, this.width * this.index, y );
  positionElem( this.img, this.width * -this.index, y + this.imgOffsetY );
};

})( window );