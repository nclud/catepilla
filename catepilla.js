/**
* Catepilla - a wiggly image plugin
*
* Requires Modernizr 2.5 and requestAnimationFrame polyfill
*/

/*jshint asi: false, curly: true, eqeqeq: true, forin: false, newcap: true, noempty: true, strict: true, undef: true, browser: true */

(function( window, undefined ) {

'use strict';

// get global vars
var document = window.document;
var Modernizr = window.Modernizr;
// get convienent vars
var transformProp = Modernizr.prefixed('transform');
var transformCSSProp = {
  'WebkitTransform': '-webkit-transform',
     'MozTransform':    '-moz-transform',
      'msTransform':     '-ms-transform',
       'OTransform':      '-o-transform',
        'transform':         'transform'
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


var TWO_PI = Math.PI * 2;


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
  this.wiggleSpeed = 0;

  // used to keep track of images that have been loaded
  this.imagesData = {};

  this.create();

}


Catepilla.defaults = {
  segmentCount: 5,
  height: 300,
  segmentHeight: 0.55,
  transitionDuration: 0.2,
  perSegmentDelay: 0.05,
  wiggleAcceleration: 0.001,
  maxWiggleSpeed: 0.1,
  wiggleDelay: 1000,
  isAutoAdvancing: true,
  startAngle: Math.PI
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
  this.setSelectedIndex( 0 );

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
  for ( var i=0; i < segmentCount; i++ ) {
    segment = new CatepillaSegment({
      parent: this,
      width: this.segmentWidth,
      index: i
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
  if ( index === this.selectedIndex || index < 0 || index > this.images.length - 1 ) {
    return;
  }
  // console.log('⚑ setting selected index', index );

  // get img data of selected image
  var src = this.images[ index ].src;
  var imgData = this.imagesData[ src ];

  this.selectedIndex = index;

  // stop animation, if any
  this.stopAnimation();

  // do fun stuff async, after transition
  var _this = this;
  var setIndexAfterHidden = function() {
    // reset segments y position
    _this.theta = _this.options.startAngle;
    _this.segmentsEach('setWiggleY');

    if ( imgData.isLoaded ) {
      _this._setSelectedImage();
    } else {
      imgData.callback = _this._setSelectedImage;
    }
  };

  var delay = ( this.options.transitionDuration +
    this.options.perSegmentDelay * this.segments.length ) * 1000;

  if ( this.isHidden ) {
    // if already hidden, change to it now
    setIndexAfterHidden();
  } else {
    // hide, then change after hidden
    this.hide();
    setTimeout( setIndexAfterHidden, delay );
  }

};

Catepilla.prototype._setSelectedImage = function( index ) {
  // console.log('★set selected image★');
  var img = this.images[ this.selectedIndex ];
  this.segmentsEach( 'setImage', img );
  this.show();

  // start animation
  this.setAnimationTimeout( this.options.wiggleDelay, this.startAnimation );
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
  this.stopAnimation();
};

// advance to next image
Catepilla.prototype.next = function() {
  var index = ( this.selectedIndex + 1 ) % ( this.images.length );
  this.setSelectedIndex( index );
};

// ----- animation ----- //


/**
 * set a setTimeout for a frame of animation
 * @param {Integer} delay - Delay of animation in milliseconds
 * @param {Function} animation - Function triggered for a frame of animation
 */
Catepilla.prototype.setAnimationTimeout = function( delay, animation ) {
  if ( this.animationTimeout ) {
    clearTimeout( this.animationTimeout );
  }
  this.animationTimeout = setTimeout( animation.bind( this ), delay );
};


Catepilla.prototype.startAnimation = function() {
  if ( this.isAnimating ) {
    return;
  }
  this.isAnimating = true;
  this.isAccelerating = true;
  this.segmentsEach( 'setTransitionsEnabled', false );
  this.wiggle();
};

Catepilla.prototype.wiggle = function() {
  // console.log('wiggle');
  this.wiggleAcceleration = this.isAccelerating ? this.options.wiggleAcceleration : this.deceleration;

  this.wiggleSpeed += this.wiggleAcceleration;
  this.wiggleSpeed = Math.max( 0, Math.min( this.options.maxWiggleSpeed, this.wiggleSpeed ) );

  // apply rotation
  this.theta += this.wiggleSpeed;
  // normalize angle
  this.theta = ( this.theta + TWO_PI * 2 ) % TWO_PI;
  this.segmentsEach('setWiggleY');
  this.segmentsEach('position');

  // if speed has reach it's maximum
  if ( this.isAccelerating && this.wiggleSpeed === this.options.maxWiggleSpeed ) {
    this.startDeceleration();
  }

  if ( !this.isAccelerating && this.wiggleSpeed === 0 ) {
    // if animation has stopped
    this.stopAnimation();
    // after wiggle ends, switch to the next image, after delay
    if ( this.options.isAutoAdvancing ) {
      this.setAnimationTimeout( this.options.wiggleDelay, this.next );
    }
  } else if ( this.isAnimating ) {
    // keep on wiggling
    this.animationFrameId = window.requestAnimationFrame( this.wiggle.bind( this ) );
  }

};

Catepilla.prototype.startDeceleration = function() {
  this.isAccelerating = false;
  var speed = this.wiggleSpeed;
  var rotations = Math.ceil( speed / 0.05 );
  // return to original angle
  var destinationAngle = TWO_PI * rotations + this.options.startAngle;
  this.deceleration = -( speed * speed ) / ( 2 * ( destinationAngle - this.theta ) + speed );
};

Catepilla.prototype.stopAnimation = function() {
  // console.log('stopping animation');
  this.isAccelerating = false;
  this.wiggleSpeed = 0;
  // disable css transtiions
  this.segmentsEach( 'setTransitionsEnabled', true );
  this.isAnimating = false;
  if ( this.animationTimeout ) {
    clearTimeout( this.animationTimeout );
  }
  if ( isFinite( this.animationFrameId ) ) {
    window.cancelAnimationFrame( this.animationFrameId );
    delete this.animationFrameId;
  }
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
  this.elem.style[ durationProp ] = opts.transitionDuration + 's';
  this.elem.style[ delayProp ] = ( opts.perSegmentDelay * this.index ) + 's';

  this.img = new Image();

  this.position();
  this.setTransitionsEnabled( true );

  this.elem.appendChild( this.img );

}

CatepillaSegment.prototype.setWiggleY = function() {
  var parent = this.parent;
  this.y = ( Math.sin( this.index * Math.PI / 2 + parent.theta ) * 0.5 + 0.5 ) *
    parent.height * ( 1 - parent.options.segmentHeight );
};

CatepillaSegment.prototype.position = function() {
  positionElem( this.elem, this.width * this.index, this.y );
  positionElem( this.img, this.width * -this.index, -this.y + this.imgOffsetY );
};

CatepillaSegment.prototype.setImage = function( img ) {
  this.img.src = img.src;
  this.img.width = this.parent.width;

  var sizeRatio = this.parent.width / img.width;
  this.imgOffsetY = ( this.parent.height - img.height * sizeRatio ) / 2;

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
  this.position();
};

CatepillaSegment.prototype.setTransitionsEnabled = function( enabled ) {
  this.elem.style[ transitionPropertyProp ] = enabled ? transformCSSProp + ', opacity' : 'none';
};

})( window );
