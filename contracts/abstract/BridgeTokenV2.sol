// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AccessControlEnumerable } from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { IBridgeTokenV2 } from "../interface/IBridgeTokenV2.sol";

abstract contract BridgeTokenV2 is ERC20Pausable, AccessControlEnumerable, IBridgeTokenV2 {
    error NotMinter(address caller, address currentMinter);
    error ZeroMinterAddress();
    error MintCapExceeded(uint256 newSupply, uint256 mintCap);
    error MintCapBelowSupply(uint256 mintCap, uint256 currentSupply);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public override minter;
    uint256 public override mintCap;

    // Mint and burn are restricted to the bridge minter. Circulating supply is
    // tracked directly through totalSupply() instead of a separate counter.
    modifier onlyMinter() {
        if (_msgSender() != minter) {
            revert NotMinter(_msgSender(), minter);
        }
        _;
    }

    function mint(address to, uint256 amount) public virtual override onlyMinter {
        uint256 newSupply = totalSupply() + amount;
        if (newSupply > mintCap) {
            revert MintCapExceeded(newSupply, mintCap);
        }
        _mint(to, amount);
    }

    function setMinter(address newMinter) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMinter == address(0)) {
            revert ZeroMinterAddress();
        }

        address previousMinter = minter;
        if (previousMinter == newMinter) {
            return;
        }

        minter = newMinter;

        emit UpdateMinter(previousMinter, newMinter);
    }

    function setMintCap(uint256 cap) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 currentSupply = totalSupply();
        if (cap < currentSupply) {
            revert MintCapBelowSupply(cap, currentSupply);
        }
        mintCap = cap;
        emit UpdateMintCap(cap);
    }

    function burn(uint256 amount) public virtual override onlyMinter {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual override onlyMinter {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function pause() public virtual override onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
