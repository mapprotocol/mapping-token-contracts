// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBridgeTokenV2 {
    event UpdateMinter(address indexed previousMinter, address indexed newMinter);

    // previousCap/newCap let subscribers see raise vs lower at a glance;
    // currentSupply lets them detect an emergency lowering (newCap < currentSupply)
    // directly from the event without an extra RPC roundtrip.
    event UpdateMintCap(uint256 previousCap, uint256 newCap, uint256 currentSupply);

    function setMinter(address newMinter) external;

    function setMintCap(uint256 cap) external;

    function mint(address to, uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function burn(uint256 amount) external;

    function pause() external;

    function unpause() external;

    function minter() external view returns (address);

    function mintCap() external view returns (uint256);
}
