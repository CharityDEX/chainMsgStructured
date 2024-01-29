// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Mailbox {
    event Register(address indexed addr);
    event SendMessage(address indexed from, address indexed to, bytes data);

    mapping (address => bool) isRegistered;

    /**
     * Registration is required to reveal the complete public key of the sender.
     */
    function register() public {
        require(!isRegistered[msg.sender], "Mailbox: already registered");
        isRegistered[msg.sender] = true;
        emit Register(msg.sender);
    }

    function sendMessage(address to, bytes calldata data) public payable {
        emit SendMessage(msg.sender, to, data);
    }
}
