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
var transformCSSProp = {
  'WebkitTransform': '-webkit-transform',
  'MozTransform': '-moz-transform'
}[ transformProp ];
var durationProp= Modernizr.prefixed('transitionDuration');
var delayProp = Modernizr.prefixed('transitionDelay');
var transitionProp = Modernizr.prefixed('transition');
var transitionPropertyProp = Modernizr.prefixed('transition-property');

var positionElem = Modernizr.csstransforms3d ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  } : Modernizr.csstransforms ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate(' + x + 'px, ' + y + 'px)';
  } : function( elem, x, y ) {
    elem.style.left = x + 'px';
    elem.style.top = y + 'px';
  };

var transEndEventName = {
  'WebkitTransition' : 'webkitTransitionEnd',
  'MozTransition'    : 'transitionend',
  'OTransition'      : 'oTransitionEnd',
  'msTransition'     : 'MSTransitionEnd',
  'transition'       : 'transitionend'
}[ transitionProp ];


//

// -------------------------- Catepilla -------------------------- //


/**
 * @class Creates a new Catepilla gallery
 * @param elem {Element} - The list element which contains images
 * @param options {Object} - Optional options
 */
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
  this.images = [];
  // used to keep track of images that have been loaded
  this.imagesData = {};

  this.create();

}


Catepilla.defaults = {
  segmentCount: 5,
  height: 300,
  segmentHeight: 0.55,
  transitionDuration: 0.2,
  perSegmentDelay: 0.05
};


/**
 * creates gallery
 */
Catepilla.prototype.create = function() {
  // create elem to hold segments
  this.elem = document.createElement('div');
  this.elem.className = 'catepilla';
  this.height = this.options.height;
  this.elem.style.height = this.height + 'px';
  // add elem to DOM
  this.list.parentNode.insertBefore( this.elem, this.list.nextSibling );
  // hide original list elem
  this.list.style.display = 'none';
  // get width
  this.width = this.elem.offsetWidth;

  this._createSegments();
  this.hide();

  // add images
  var images = this.list.getElementsByTagName('img');
  var src;
  for ( var i=0, len = images.length; i < len; i++ ) {
    src = images[i].src;
    this.addImage( src );
  }

  // show first image
  var _this = this;
  setTimeout( function() {
    _this.setSelectedIndex( 0 );
  }, 100 );

};

/**
 * @param {String} src - The src or URL of an image
 */
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
  this.images.push( img );
  // set src, which will trigger ._loadHander()
  img.src = src;
};

Catepilla.prototype._createSegments = function() {

  var segmentCount = this.options.segmentCount;
  
  this.segmentWidth = Math.floor( this.width / segmentCount );
  
  this.segments = [];

  var segment;
  var frag = document.createDocumentFragment();
  var theta = Math.floor( Math.random() * 2 ) * Math.PI;
  for ( var i=0; i < segmentCount; i++ ) {
    segment = new CatepillaSegment({
      parent: this,
      width: this.segmentWidth,
      index: i,
      y: ( Math.sin( i * Math.PI / 2 + theta ) * 0.5 + 0.5 ) * this.height * ( 1 - this.options.segmentHeight )
    });
    frag.appendChild( segment.elem );
    this.segments.push( segment );
  }

  this.elem.appendChild( frag );

};

/**
 * Trigger a method on each segment in the instance
 * @param {String} methodName
 */
Catepilla.prototype.segmentsEach = function( methodName ) {
  var segment;
  // pass in any other arguments after methodName
  var args = Array.prototype.slice.call( arguments, 1 );
  for (var i=0, len = this.segments.length; i < len; i++) {
    segment = this.segments[i];
    segment[ methodName ].apply( segment, args );
  }
};

/**
 * reveal
 * @param {integer} index
 */
Catepilla.prototype.setSelectedIndex = function( index ) {
  // don't proceed if not a new index
  if ( index === this.selectedIndex ) {
    return;
  }
  console.log('⚑ setting selected index', index );


  var src = this.images[ index ].src;
  var imgData = this.imagesData[ src ];

  this.selectedIndex = index;

  // do fun stuff async, after transition
  var _this = this;
  var setIndexAfterHidden = function() {
    // reset segments y position
    var theta = Math.floor( Math.random() * 2 ) * Math.PI;
    for ( var i=0, len = _this.segments.length; i < len; i++ ) {
      _this.segments[i].y = ( Math.sin( i * Math.PI / 2 + theta ) * 0.5 + 0.5 )
        * _this.height * ( 1 - _this.options.segmentHeight );
    }

    if ( imgData.isLoaded ) {
      _this.setSelectedImage();
    } else {
      imgData.callback = _this.setSelectedImage;
    }
  }

  var delay = ( this.options.transitionDuration +
    this.options.perSegmentDelay * this.segments.length ) * 1000;

  if ( this.isHidden ) {
    setIndexAfterHidden();
  } else {
    this.hide();
    setTimeout( setIndexAfterHidden, delay );
  }

};

Catepilla.prototype.setSelectedImage = function( index ) {
  console.log('★set selected image★');
  var img = this.images[ this.selectedIndex ];
  this.segmentsEach( 'setImage', img );
  this.show()
};

Catepilla.prototype.show = function() {
  if ( !this.isHidden ) {
    return;
  }
  this.segmentsEach('show');
  this.isHidden = false;
};

Catepilla.prototype.hide = function( callback ) {
  if ( this.isHidden ) {
    return;
  }
  this.segmentsEach('hide');
  this.isHidden = true;
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
  var img = event.target;
  var imgData = this.imagesData[ img.src ];
  imgData.isLoaded = true;

  // trigger callback
  if ( imgData.callback ) {
    imgData.callback.call( this );
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
  this.elem.style[ transitionPropertyProp ] = transformCSSProp + ', opacity';
  this.elem.style[ durationProp ] = opts.transitionDuration + 's';
  this.elem.style[ delayProp ] = ( opts.perSegmentDelay * this.index ) + 's';

  this.img = new Image();

  this.position( this.y );

  this.elem.appendChild( this.img );

}

CatepillaSegment.prototype.position = function( y ) {
  positionElem( this.elem, this.width * this.index, y );
};

CatepillaSegment.prototype.setImage = function( img ) {
  this.img.src = img.src;
  this.img.width = this.parent.width;

  var sizeRatio = this.parent.width / img.width;
  this.imgOffsetY = img.height * ( 1 - sizeRatio );

  positionElem( this.img, this.width * -this.index, -this.y + this.imgOffsetY );

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