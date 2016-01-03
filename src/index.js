'use strict';

import _ 						from 'lodash';
import ColorPicker  from 'react-colors-picker';
import d3 					from 'd3';
import React 				from 'react';

const HandlerWidth = 4;
const ColorPickerWidth = 16;
const Width = 300;
const Height = 15;
const ColorMode = 'rgb';
const DefaultStops = [
	{offset: 0.0, color: '#00f'},
  {offset: 0.5, color: '#aaa'},
  {offset: 1.0, color: '#f00'}
];

const CompareOffset = function CompareOffset(a, b) {
	return a.offset - b.offset;
};
const ColorPickerID = function ColorPickerID(containerID, idx) {
	return containerID+'_gc-cp_'+idx;
}

class ReactGradientColorPicker extends React.Component {

	constructor(props) {
    super(props);

    // TODO: how to get auto-expanded width
    var rootHeight = Height;
    var rootWidth = Width;
    if (this.props.width) {
    	rootWidth = this.props.width;
    	console.log(this.props.width);
    }

    // TODO: not sure this is correct to generate random ID
    this.containerID = _.uniqueId('gc-canvas_');

    // init canvas instance
    this.svg = null;

    // receive stops from props
    var defaultStops = this.props.stops || DefaultStops;

    // populate color stop data
    var stops = defaultStops.map(function iterator(d, idx) {
    	return {
    		idx: idx,
    		x: rootWidth * d.offset,
    		offset: d.offset,
    		color: d.color
    	}
    });

    // init state
    this.state = {
    	rootWidth: rootWidth,
    	rootHeight: rootHeight,
      colorModel: ColorMode,
      stops: stops
    };
  }

  addHandler(mouseX) {
  	var offset = 1.0 * mouseX / this.state.rootWidth;
  	var midColor = this.colorScale(offset);
  	var newStop = {
  		idx: this.state.stops.length,
  		x: mouseX,
  		offset: offset,
  		color: midColor
  	};
  	var newStops = this.state.stops.concat([newStop]);
  	newStops.sort(CompareOffset);
  	this.setState({stops: newStops});

    this.notifyChange();
  }

  dragHandler(d, mouseX, colorPickerID) {
  	// only update handler position but not state
  	d.x = mouseX;
  	d3.select(this).attr('x', mouseX);
  	d3.select('#' + colorPickerID)
  		.style('left', (d.x - ColorPickerWidth / 2) + 'px')
  		.style('top', Height + 'px');
  }

  dragHandlerEnd(d) {
  	// when the end of drag, update the state once.
  	var newStops = _.cloneDeep(this.state.stops);
  	var currentHandler = _.find(newStops, { 'idx': d.idx });
  	currentHandler.offset = 1.0 * d.x / this.state.rootWidth;
  	currentHandler.x = d.x;
    this.setState({stops: newStops});

    this.notifyChange();
  }

  notifyChange() {
    if (this.props.onChange) {
      this.props.onChange(_.map(this.state.stops,function(x){return _.pick(x,['offset','color'])}));
    }
  }
  componentDidMount() {
  	// try to get the auto-expanded comonent width

  	var rootWidth = this.refs.root.offsetWidth;
  	if (this.props.width) {
  		rootWidth = this.props.width;
  	}
  	var newStops = _.cloneDeep(this.state.stops);
  	newStops.forEach(function iterator(d) {
  		d.x = d.offset * rootWidth;
  	});
  	// TODO: this is anti-pattern. should fix it soon.
  	this.setState({
  		rootWidth: rootWidth,
  		stops: newStops
  	});

  	var self = this;
  	var clickColorMap = function clickColorMap() {
  		var mouseX = d3.mouse(this)[0];
  		self.addHandler(mouseX);
  	};

  	// init canvas
  	this.svg = d3.select('#' + this.containerID)
  		.append('svg')
  		.attr('width', this.state.rootWidth)
  		.attr('height', this.state.rootHeight);
  	var gradientID = this.containerID + '_gc-gradient';
  	this.gradient = this.svg.append('linearGradient')
      .attr('id', gradientID)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('y1', '0')
	    .attr('y2', '0')
	    .attr('x1', '0')
	    .attr('x2', this.state.rootWidth);

    this.colorMap = this.svg.append('rect')
    	.attr('id', 'gc-color-map')
    	.attr('x', 0)
    	.attr('y', 0)
    	.attr('width', this.state.rootWidth)
    	.attr('height', this.state.rootHeight)
    	.attr('fill', 'url(#' + gradientID + ')')
    	.on('click', clickColorMap);
  }

  refreshCanvas() {
  	if (this.svg === null) {
  		return;
  	}

  	// refresh canvas size
  	this.svg.attr('width', this.state.rootWidth)
  		.attr('height', this.state.rootHeight);

  	this.colorMap.attr('width', this.state.rootWidth)
  		.attr('height', this.state.rootHeight);

  	// refresh gradient
  	var gradientID = this.containerID + '_gc-gradient';
  	this.gradient = this.svg.select('#' + gradientID)
  		.attr('x2', this.state.rootWidth)
	  	.selectAll('stop')
      .data(this.state.stops);

    // enter stops
    this.gradient.enter()
    	.append('stop')
      .attr('offset', function offsetAccessor(d) {
      	return (d.offset * 100) + '%';
      })
      .attr('stop-color', function colorAccessor(d) {
      	return d.color;
      });
    // update existing stops
    this.gradient
    	.attr('offset', function offsetAccessor(d) {
      	return (d.offset * 100).toString()+'%';
      })
      .attr('stop-color', function colorAccessor(d) {
      	return d.color;
      });

    // TODO: there's no remove handler function now.
    // remove non-exist stops
    this.gradient.exit().remove();

  	// refresh handlers
  	this.handlers = this.svg.selectAll('.gc-handler')
    	.data(this.state.stops);

  	// enter new handlers
  	var self = this;
  	var dragCallback = function dragCallback(d) {
  		var newX = d3.event.x;
	  	if (newX >= 0 && newX <= self.state.rootWidth) {
		  	self.dragHandler.call(this, d, newX, ColorPickerID(self.containerID, d.idx));
	  	}
  	}
  	var drag = d3.behavior.drag()
	    .origin(Object)
	    .on('drag', dragCallback)
	    .on('dragend', this.dragHandlerEnd.bind(this))
		this.handlers.enter()
			.append('rect')
    	.attr('class', 'gc-handler')
    	.attr('x', function xPos(d) {
    		return d.x - HandlerWidth / 2;
    	}.bind(this))
    	.attr('y', '0')
    	.attr('width', HandlerWidth)
    	.attr('height', this.state.rootHeight)
    	.call(drag);

    // update existing handlers
    this.handlers
    	.attr('x', function xPos(d) {
    		return d.x - HandlerWidth / 2;
    	}.bind(this));

    // remove non-exist handlers
    this.handlers.exit().remove();

    // refresh the color pickers
    this.state.stops.forEach(function iterator(s) {
    	d3.select('#' + ColorPickerID(this.containerID, s.idx))
    		.style('left', (s.x - ColorPickerWidth / 2) + 'px')
    		.style('top', Height + 'px');
    }.bind(this));

    // refresh color scale
    var stops = this.state.stops.map(function iterator(s) {
    	return {
    		offset: s.offset,
    		color: s.color
    	};
    }).sort(CompareOffset);
    var offsets = _.map(stops, 'offset');
    var colors = _.map(stops, 'color');
    this.colorScale = d3.scale.linear()
    	.domain(offsets)
    	.range(colors);
  }

  render() {
  	this.refreshCanvas();

  	var colorChangeCallback = function colorChangeCallback(color, idx) {
  		var newStops = _.cloneDeep(this.state.stops);
	  	var currentHandler = _.find(newStops, { 'idx': idx });
	  	currentHandler.color = color;
	    this.setState({stops: newStops});

	    this.notifyChange();
  	}.bind(this);
  	var colorpickers = this.state.stops.map(function iterator(s) {
  		let pickerId = ColorPickerID(this.containerID, s.idx);
  		let callback = function callback(c) {
  			colorChangeCallback(c.color, s.idx);
  		};
  		var style = {
  			left: (s.x - ColorPickerWidth / 2) + 'px',
  			top: Height + 'px'
  		}
  		return (
  			<div className="gc-colorpicker" id={pickerId} key={pickerId} style={style} >
  				<ColorPicker animation="slide-up" color={s.color} onChange={callback}/>
  			</div>
  		);
  	}.bind(this));
    return (
	    <div className="gc-container" ref="root">
	    	{colorpickers}
	    	<div className="gc-canvas" id={this.containerID}></div>
	    </div>
    );
  }
}

ReactGradientColorPicker.propTypes = {
	stops: React.PropTypes.arrayOf(React.PropTypes.object),
	onChange: React.PropTypes.func,
	width: React.PropTypes.number
};

module.exports = ReactGradientColorPicker;
