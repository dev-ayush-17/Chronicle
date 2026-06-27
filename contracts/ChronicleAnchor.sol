// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChronicleAnchor {

    event EvidenceAnchored(bytes32 fileHash, address sender);

    function anchor(bytes32 fileHash) external {
        emit EvidenceAnchored(fileHash, msg.sender);
    }
}