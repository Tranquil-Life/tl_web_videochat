import React, { Component } from "react";

export default class ChannelForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: ""
        };
    }

    onChange = e => {
        let { name, value } = e.target;
        this.setState({ [name]: value });
    };

    onSubmit = e => {
        e.preventDefault();
        if (this.state.channel.trim() === "") return alert("Please enter a name");
        
        console.log("Submitting: ", this.state.channel);
        // We call the function passed down from App.js
        this.props.selectChannel(this.state.channel);
        this.setState({ channel: "" });
    };
    
    render() {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <form onSubmit={this.onSubmit}>
                    <label style={{ display: "block", marginBottom: "10px" }}>Channel Name</label>
                    <input
                        placeholder="Channel Name"
                        name="channel"
                        value={this.state.channel}
                        onChange={this.onChange} // <--- CRITICAL FIX
                        style={{ padding: "8px", marginRight: "10px" }}
                    />
                    <input type="submit" value="Join Channel" style={{ padding: "8px 16px", cursor: "pointer" }} />
                </form>
            </div>
        );
    }
}