// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MiningPool
 * @notice Manages AVT mining rewards with halving mechanism
 * @dev Agents earn AVT by completing platform tasks (social, check-in, etc.)
 *
 * Halving schedule:
 *   Epoch 1 (Month 1-3):  10M AVT
 *   Epoch 2 (Month 4-6):   5M AVT
 *   Epoch 3 (Month 7-9):  2.5M AVT
 *   ...and so on until pool is depleted
 */
contract MiningPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public avtToken;

    // Mining configuration
    uint256 public constant EPOCH_DURATION = 90 days; // 3 months
    uint256 public constant INITIAL_EPOCH_REWARD = 10_000_000 * 1e18; // 10M AVT

    uint256 public startTime;
    uint256 public totalDistributed;
    uint256 public totalPoolSize; // 40M AVT

    // Authorized distributors (backend service)
    mapping(address => bool) public distributors;

    // Agent claim tracking
    mapping(address => uint256) public agentTotalClaimed;

    // Daily limits
    uint256 public dailyLimit = 100_000 * 1e18; // 100K AVT per day
    mapping(uint256 => uint256) public dailyDistributed; // day => amount

    // Events
    event MiningReward(address indexed agent, uint256 amount, string reason);
    event EpochAdvanced(uint256 epoch, uint256 epochReward);
    event DistributorUpdated(address indexed distributor, bool authorized);

    modifier onlyDistributor() {
        require(distributors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _avtToken) Ownable(msg.sender) {
        require(_avtToken != address(0), "Zero address");
        avtToken = IERC20(_avtToken);
        startTime = block.timestamp;
        distributors[msg.sender] = true;
    }

    /**
     * @notice Initialize pool with AVT tokens (call after token distribution)
     */
    function initializePool() external onlyOwner {
        totalPoolSize = avtToken.balanceOf(address(this));
        require(totalPoolSize > 0, "No tokens in pool");
    }

    /**
     * @notice Get current epoch (0-indexed)
     */
    function currentEpoch() public view returns (uint256) {
        return (block.timestamp - startTime) / EPOCH_DURATION;
    }

    /**
     * @notice Get reward rate for current epoch (halving)
     */
    function currentEpochReward() public view returns (uint256) {
        uint256 epoch = currentEpoch();
        uint256 reward = INITIAL_EPOCH_REWARD;
        for (uint256 i = 0; i < epoch && i < 20; i++) {
            reward = reward / 2;
        }
        return reward;
    }

    /**
     * @notice Get today's date key for daily limit tracking
     */
    function _today() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /**
     * @notice Distribute mining reward to an agent
     * @param _agent Agent wallet address
     * @param _amount AVT amount
     * @param _reason Reason string (e.g., "social_post", "check_in", "comment")
     */
    function distributeReward(
        address _agent,
        uint256 _amount,
        string calldata _reason
    ) external onlyDistributor nonReentrant {
        require(_agent != address(0), "Invalid agent");
        require(_amount > 0, "Amount must be > 0");

        // Check pool has enough
        uint256 poolBalance = avtToken.balanceOf(address(this));
        require(poolBalance >= _amount, "Pool depleted");

        // Check daily limit
        uint256 today = _today();
        require(dailyDistributed[today] + _amount <= dailyLimit, "Daily limit reached");

        dailyDistributed[today] += _amount;
        totalDistributed += _amount;
        agentTotalClaimed[_agent] += _amount;

        avtToken.safeTransfer(_agent, _amount);

        emit MiningReward(_agent, _amount, _reason);
    }

    // ── Admin functions ──

    function setDistributor(address _distributor, bool _authorized) external onlyOwner {
        distributors[_distributor] = _authorized;
        emit DistributorUpdated(_distributor, _authorized);
    }

    function setDailyLimit(uint256 _limit) external onlyOwner {
        dailyLimit = _limit;
    }

    // ── View functions ──

    function poolBalance() external view returns (uint256) {
        return avtToken.balanceOf(address(this));
    }

    function remainingToday() external view returns (uint256) {
        uint256 used = dailyDistributed[_today()];
        return used >= dailyLimit ? 0 : dailyLimit - used;
    }
}
