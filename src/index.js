var React = require('react');
var ReactDOM = require('react-dom');

require('./style.less');


var Hello = React.createClass({
    render: function() {
        return (
            <div>Hello {this.props.name}</div>
            );
    }
});

ReactDOM.render(
    <Hello name="World" />,
    document.getElementById('AppRoot')
);

require.ensure(['./a'], function(require) {
    var content = require('./a');
    document.getElementById('AppRoot').innerHTML = content;
});
