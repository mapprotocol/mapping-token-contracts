// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import { BridgeTokenV2 } from "./abstract/BridgeTokenV2.sol";

contract MappingTokenV2 is BridgeTokenV2, ERC20Permit {
    error ZeroAdminAddress();

    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address _admin
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (_admin == address(0)) {
            revert ZeroAdminAddress();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, BridgeTokenV2) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
