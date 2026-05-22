// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBridgeTokenV2 {
    event UpdateMinter(address indexed previousMinter, address indexed newMinter);

    event UpdateMintCap(uint256 cap);

    function setMinter(address newMinter) external;

    function setMintCap(uint256 cap) external;

    function mint(address to, uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function burn(uint256 amount) external;

    function pause() external;

    function unpause() external;

    function minter() external view returns (address);

    function mintCap() external view returns (uint256);

    function outstanding() external view returns (uint256);
}
