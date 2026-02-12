// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectToken
 * @notice Generic ERC-20 token for ClawOracle campaign projects.
 *         Deployer mints the full supply and distributes to agents via the platform.
 */
contract ProjectToken is ERC20, Ownable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        _mint(msg.sender, _totalSupply * 1e18);
    }
}
