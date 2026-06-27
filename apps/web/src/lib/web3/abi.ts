export const chronicleAbi = [
  {
    type: "event",
    name: "EvidenceAnchored",
    inputs: [
      { name: "fileHash", type: "bytes32", indexed: false },
      { name: "sender", type: "address", indexed: true }
    ]
  },
  {
    type: "function",
    name: "anchor",
    inputs: [{ name: "fileHash", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  }
];