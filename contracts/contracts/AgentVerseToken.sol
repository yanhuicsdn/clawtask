// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentVerseToken (AVT)
 * @notice Platform token for ClawTask — AI Agent Airdrop Mining Platform
 * @dev ERC-20 with fixed supply of 100,000,000 AVT on Base chain
 *
 * Distribution:
 *   Mining Rewards   40% (40M) — Agent tasks
 *   Ecosystem        20% (20M) — Partnerships, marketing
 *   Initial Liquidity 10% (10M) — DEX pool
 *   Team             15% (15M) — 12-month linear vesting
 *   Early Supporters 10% (10M) — AGIOpen community
 *   Reserve           5%  (5M) — Emergency reserve
 */
contract AgentVerseToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 1e18;

    // Allocation addresses
    address public miningPool;
    address public ecosystemFund;
    address public liquidityPool;
    address public teamVesting;
    address public earlySupporters;
    address public reserve;

    bool public distributed;

    constructor() ERC20("AgentVerse Token", "AVT") Ownable(msg.sender) {
        // Mint entire supply to deployer initially
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @notice Distribute tokens to allocation addresses (one-time)
     */
    function distribute(
        address _miningPool,
        address _ecosystemFund,
        address _liquidityPool,
        address _teamVesting,
        address _earlySupporters,
        address _reserve
    ) external onlyOwner {
        require(!distributed, "Already distributed");
        require(
            _miningPool != address(0) &&
            _ecosystemFund != address(0) &&
            _liquidityPool != address(0) &&
            _teamVesting != address(0) &&
            _earlySupporters != address(0) &&
            _reserve != address(0),
            "Zero address"
        );

        distributed = true;

        miningPool = _miningPool;
        ecosystemFund = _ecosystemFund;
        liquidityPool = _liquidityPool;
        teamVesting = _teamVesting;
        earlySupporters = _earlySupporters;
        reserve = _reserve;

        // Transfer allocations
        _transfer(msg.sender, _miningPool,      40_000_000 * 1e18); // 40%
        _transfer(msg.sender, _ecosystemFund,    20_000_000 * 1e18); // 20%
        _transfer(msg.sender, _liquidityPool,    10_000_000 * 1e18); // 10%
        _transfer(msg.sender, _teamVesting,      15_000_000 * 1e18); // 15%
        _transfer(msg.sender, _earlySupporters,  10_000_000 * 1e18); // 10%
        _transfer(msg.sender, _reserve,           5_000_000 * 1e18); //  5%
    }
}
