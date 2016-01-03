import React from 'react';
import ReactGradientColorPicker from '../src/index';

class SimpleSelect extends React.Component {
  onChange(e){
    this.props.onChange(e.target.value);
  }
  render() {
    let {options,value} = this.props;

    return (<select onChange={this.onChange.bind(this)}>
        {options.map(function(option,i){
          return (<option key={i} value={option.value} selected={value == option.value}>{option.label}</option>)
          })}
      </select>
    )
  }
}
export default class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orientation:'top',
      stops: [
        {offset: 0.0, color: '#f00'},
        {offset: 0.5, color: '#fff'},
        {offset: 1.0, color: '#0f0'}]
    };
  }
  onChange(stops){
    this.setState({stops:stops});
  }
  render() {
  	const style = {
  		width: '300px',
  		height: '40px'
  	};
    const options = [
      {label:'horizontal',value:'top'},
      {label:'vertical',value:'left'},
      {label:'diagonal 45%',value:'45deg'},
      {label:'diagonal -45%',value:'-45deg'},
      {label:'radial',value:'center, ellipse cover'}
    ];


    var grandientStops = _.reduce(this.state.stops,function(memo,stop){return memo + ', ' + stop.color + ' ' + (stop.offset *100) + '%' },'');

    //TODO: add support for all browsers
    var grandientType = this.state.orientation === 'center, ellipse cover'?'-webkit-radial-gradient':'-webkit-linear-gradient';
    var background = grandientType + '(' + this.state.orientation + grandientStops + ')';

    var examplePanelStyle = {width: 300, height: 50, background: background };

    return (
      <div>
        <div style={style}>
          <ReactGradientColorPicker onChange={this.onChange.bind(this)} stops={this.state.stops}/>
        </div>
        <div><SimpleSelect options={options} value={this.state.orientation} onChange={(selectedValue)=>{this.setState({orientation:selectedValue})}} /></div>
        <div style={examplePanelStyle}></div>
      </div>
    );
  }

}
