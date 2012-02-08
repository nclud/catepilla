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
var delayProp = Modernizr.prefixed('transitionDelay')

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

  this.list = elem;

  this.options = {};

  for ( var prop in Catepilla.defaults ) {
    this.options[ prop ] = Catepilla.defaults[ prop ];
  }

  for ( prop in options ) {
    this.options[ prop ] = options[ prop ];
  }

  // default properties
  this.selectedIndex = -1;
  this.images = []
  // used to keep track of images that have been loaded
  this.imagesData = {};

  this.create();

}


Catepilla.defaults = {
  segmentCount: 5,
  segmentHeight: 0.55,
  perSegmentDelay: 0.05
};

Catepilla.prototype.create = function() {

  this.elem = document.createElement('div');
  this.elem.className += ' catepilla';

  // css for elem
  // this.elem.style.position = 'relative';

  var w = this.width = this.list.offsetWidth;
  this.height = this.options.height;

  // this.img = this.elem.getElementsByTagName('img')[0];

  var images = this.list.getElementsByTagName('img');

  // load images
  var src;
  var loaderImg;
  for ( var i=0, len = images.length; i < len; i++ ) {
    src = images[i].src;
    this.addImage( src );
  }

  // show first image
  this.setSelectedIndex( 0 );

};

Catepilla.prototype.addImage = function( src ) {
  // don't proceed if already added
  if ( this.imagesData[ src ] ) {
    return;
  }
  // load image
  var img = new Image();
  img.addEventListener( 'load', this, false );
  // create object to keep track of its properties
  this.imagesData[ src ] = {
    index: this.images.length // backwards reference for this.images
  };
  // add to images
  this.images.push( img )
  // set src, which will trigger ._loadHander()
  img.src = src;
};

// switch to image
// wait until image needs to load before switching for it


Catepilla.prototype._createSegments = function() {

  console.log( this.img.offsetHeight );
  this.img.style.display = 'none';

  var segmentCount = this.options.segmentCount;
  
  this.segmentWidth = this.width / segmentCount;
  
  this.segments = [];

  var segment;
  var frag = document.createDocumentFragment();
  var theta = Math.floor( Math.random() * 2 ) * Math.PI;
  for ( var i=0; i < segmentCount; i++ ) {
    segment = new CatepillaSegment({
      parent: this,
      width: this.segmentWidth,
      index: i,
      imgWidth: this.width,
      y: ( Math.sin( i * Math.PI / 2 + theta ) * 0.5 + 0.5 ) * this.height * ( 1 - this.options.segmentHeight )
    });
    frag.appendChild( segment.elem );
    this.segments.push( segment );
  }

  this.elem.appendChild( frag );


};


Catepilla.prototype.segmentsEach = function( methodName ) {
  for (var i=0, len = this.segments.length; i < len; i++) {
    this.segments[i][ methodName ]();
  }
};

Catepilla.prototype.setSelectedIndex = function( index ) {
  // don't proceed if not a new index
  if ( index === this.selectedIndex ) {
    return;
  }
  console.log('⚑ setting selected index', index );


  var src = this.images[ index ].src
  var imgData = this.imagesData[ src ];

  this.selectedIndex = index;

  if ( imgData.isLoaded ) {
    this.setSelectedImage();
  } else {
    imgData.callback = this.setSelectedImage;
  }

};

Catepilla.prototype.setSelectedImage = function( index ) {
  console.log('★set selected image★');
  var imgData = this.imagesData[ this.selectedIndex ];
}

// ----- event handling ----- //

Catepilla.prototype.handleEvent = function( event ) {
  var handleMethod = '_' + event.type + 'Handler';
  if ( this[ handleMethod ] ) {
    this[ handleMethod ]( event );
  }
};

// triggered after img loads
Catepilla.prototype._loadHandler = function( event ) {
  var img = event.target;
  var imgData = this.imagesData[ img.src ];
  imgData.isLoaded = true;

  // trigger callback
  if ( imgData.callback ) {
    imgData.callback();
    delete imgData.callback;
  }
};

// put in global namespace
window.Catepilla = Catepilla;

// -------------------------- CatepillaSegment -------------------------- //

function CatepillaSegment( props ) {
  // extend props over segment, width, imgSrc, index
  for ( var prop in props ) {
    this[ prop ] = props[ prop ];
  }

  var opts = this.parent.options;

  this.elem = document.createElement('div');
  this.elem.className = 'segment';
  this.elem.style.width = this.width + 'px';
  this.elem.style.height = ( 100 * opts.segmentHeight ) + '%';
  this.elem.style[ delayProp ] = ( opts.perSegmentDelay * this.index ) + 's';
  // this.elem.style.opacity = 0;

  this.img = new Image();
  this.img.src = this.parent.img.src;

  var imgSize = this.parent.imgSize;
  var sizeRatio = this.imgWidth / imgSize.width;
  this.imgOffsetY = imgSize.height * ( 1 - sizeRatio );
  
  this.img.width = this.imgWidth;

  this.position( this.y );

  this.elem.appendChild( this.img );

}

CatepillaSegment.prototype.position = function( y ) {
  positionElem( this.elem, this.width * this.index, y );
  positionElem( this.img, this.width * -this.index, -y + this.imgOffsetY );
};

CatepillaSegment.prototype.hide = function() {
  this.elem.style.opacity = 0;
  var sign = Math.random() > 0.5 ? 1 : -1;
  var hideY = this.parent.height * 1.5 * sign + this.parent.height / 2;
  positionElem( this.elem, this.width * this.index, hideY );
};

CatepillaSegment.prototype.show = function() {
  this.elem.style.opacity = 1;
  this.position( this.y );
};

})( window );