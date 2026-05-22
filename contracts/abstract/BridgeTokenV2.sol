// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AccessControlEnumerable } from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { IBridgeTokenV2 } from "../interface/IBridgeTokenV2.sol";

abstract contract BridgeTokenV2 is ERC20Burnable, ERC20Pausable, AccessControlEnumerable, IBridgeTokenV2 {
    error NotMinter(address caller, address currentMinter);
    error MintCapExceeded(uint256 nextOutstanding, uint256 mintCap);
    error MintCapBelowOutstanding(uint256 mintCap, uint256 outstanding);
    error OutstandingUnderflow(uint256 outstanding, uint256 amount);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public override minter;
    uint256 public override mintCap;
    uint256 public override outstanding;

    function mint(address to, uint256 amount) public virtual override {
        if (_msgSender() != minter) {
            revert NotMinter(_msgSender(), minter);
        }

        uint256 newOutstanding = outstanding + amount;
        if (newOutstanding > mintCap) {
            revert MintCapExceeded(newOutstanding, mintCap);
        }
        outstanding = newOutstanding;
        _mint(to, amount);
    }

    function setMinter(address newMinter) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        address previousMinter = minter;
        if (previousMinter == newMinter) {
            return;
        }

        minter = newMinter;

        emit UpdateMinter(previousMinter, newMinter);
    }

    function setMintCap(uint256 cap) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (cap < outstanding) {
            revert MintCapBelowOutstanding(cap, outstanding);
        }
        mintCap = cap;
        emit UpdateMintCap(cap);
    }

    function burn(uint256 amount) public virtual override(ERC20Burnable, IBridgeTokenV2) {
        super.burn(amount);
        _decreaseOutstanding(amount);
    }

    function burnFrom(address account, uint256 amount) public virtual override(ERC20Burnable, IBridgeTokenV2) {
        super.burnFrom(account, amount);
        _decreaseOutstanding(amount);
    }

    function pause() public virtual override onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _decreaseOutstanding(uint256 amount) internal {
        if (outstanding < amount) {
            revert OutstandingUnderflow(outstanding, amount);
        }
        unchecked {
            outstanding -= amount;
        }
    }
}
