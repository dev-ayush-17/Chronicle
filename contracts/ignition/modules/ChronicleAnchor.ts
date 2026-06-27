import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChronicleAnchorModule = buildModule("ChronicleAnchorModule", (m) => {
  const chronicleAnchor = m.contract("ChronicleAnchor", []);

  return { chronicleAnchor };
});

export default ChronicleAnchorModule;
