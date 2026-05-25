// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AccessControlEnumerable } from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { IBridgeTokenV2 } from "./interface/IBridgeTokenV2.sol";

contract MappingTokenV2 is ERC20Pausable, ERC20Permit, AccessControlEnumerable, IBridgeTokenV2 {
    error NotMinter(address caller, address currentMinter);
    error ZeroAdminAddress();
    error ZeroMinterAddress();
    error ZeroAmount();
    error MintCapExceeded(uint256 newSupply, uint256 mintCap);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public override minter;
    uint256 public override mintCap;
    uint8 private immutable _decimals;

    // Mint and burn are restricted to the bridge minter. Circulating supply is
    // tracked directly through totalSupply() instead of a separate counter.
    modifier onlyMinter() {
        if (_msgSender() != minter) {
            revert NotMinter(_msgSender(), minter);
        }
        _;
    }

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

    // The cap may be set to any value, including 0 or a value below the current
    // supply. Setting it at or below totalSupply() is a mint-only emergency stop:
    // mint() then reverts while transfers and burns keep working (unlike pause(),
    // which freezes every transfer).
    function setMintCap(uint256 cap) external virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 previousCap = mintCap;
        mintCap = cap;
        emit UpdateMintCap(previousCap, cap, totalSupply());
    }

    function pause() public virtual override onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public virtual override onlyMinter {
        if (amount == 0) revert ZeroAmount();
        uint256 newSupply = totalSupply() + amount;
        if (newSupply > mintCap) {
            revert MintCapExceeded(newSupply, mintCap);
        }
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual override onlyMinter {
        if (amount == 0) revert ZeroAmount();
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual override onlyMinter {
        if (amount == 0) revert ZeroAmount();
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
