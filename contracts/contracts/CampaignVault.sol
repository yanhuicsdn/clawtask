// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CampaignVault
 * @notice Core contract managing all Campaign token deposits and distributions
 * @dev Projects deposit ERC-20 tokens, platform distributes to agents
 */
contract CampaignVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Campaign {
        address creator;
        address token;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 platformFee;
        uint256 startsAt;
        uint256 endsAt;
        bool active;
    }

    // Platform fee in basis points (500 = 5%, 1000 = 10%)
    uint256 public platformFeeBps = 500; // 5% default
    address public feeRecipient;

    // Campaign storage
    mapping(bytes32 => Campaign) public campaigns;
    bytes32[] public campaignIds;

    // Authorized distributors (backend service)
    mapping(address => bool) public distributors;

    // Events
    event CampaignCreated(bytes32 indexed campaignId, address indexed creator, address token, uint256 amount, uint256 fee);
    event RewardClaimed(bytes32 indexed campaignId, address indexed agent, uint256 amount);
    event CampaignPaused(bytes32 indexed campaignId);
    event CampaignResumed(bytes32 indexed campaignId);
    event CampaignEnded(bytes32 indexed campaignId, uint256 remainingReturned);
    event DistributorUpdated(address indexed distributor, bool authorized);
    event FeeUpdated(uint256 newFeeBps);

    modifier onlyDistributor() {
        require(distributors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
        distributors[msg.sender] = true;
    }

    /**
     * @notice Create a new campaign by depositing ERC-20 tokens
     * @param _campaignId Unique campaign identifier (from backend)
     * @param _token ERC-20 token address
     * @param _amount Total tokens to deposit (fee will be deducted)
     * @param _durationDays Campaign duration in days
     */
    function createCampaign(
        bytes32 _campaignId,
        address _token,
        uint256 _amount,
        uint256 _durationDays
    ) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(_token != address(0), "Invalid token");
        require(campaigns[_campaignId].creator == address(0), "Campaign exists");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");

        // Calculate platform fee
        uint256 fee = (_amount * platformFeeBps) / 10000;
        uint256 netAmount = _amount - fee;

        // Transfer tokens from creator
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Send fee to recipient
        if (fee > 0) {
            IERC20(_token).safeTransfer(feeRecipient, fee);
        }

        // Create campaign
        campaigns[_campaignId] = Campaign({
            creator: msg.sender,
            token: _token,
            totalAmount: netAmount,
            remainingAmount: netAmount,
            platformFee: fee,
            startsAt: block.timestamp,
            endsAt: block.timestamp + (_durationDays * 1 days),
            active: true
        });

        campaignIds.push(_campaignId);

        emit CampaignCreated(_campaignId, msg.sender, _token, netAmount, fee);
    }

    /**
     * @notice Distribute reward to an agent (called by backend)
     * @param _campaignId Campaign identifier
     * @param _agent Agent wallet address
     * @param _amount Token amount to send
     */
    function claimReward(
        bytes32 _campaignId,
        address _agent,
        uint256 _amount
    ) external onlyDistributor nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.active, "Campaign not active");
        require(campaign.remainingAmount >= _amount, "Insufficient remaining");
        require(_agent != address(0), "Invalid agent");
        require(block.timestamp <= campaign.endsAt, "Campaign ended");

        campaign.remainingAmount -= _amount;

        IERC20(campaign.token).safeTransfer(_agent, _amount);

        emit RewardClaimed(_campaignId, _agent, _amount);
    }

    /**
     * @notice Pause a campaign (only creator or owner)
     */
    function pauseCampaign(bytes32 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator || msg.sender == owner(), "Not authorized");
        require(campaign.active, "Already paused");
        campaign.active = false;
        emit CampaignPaused(_campaignId);
    }

    /**
     * @notice Resume a paused campaign
     */
    function resumeCampaign(bytes32 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator || msg.sender == owner(), "Not authorized");
        require(!campaign.active, "Already active");
        require(block.timestamp <= campaign.endsAt, "Campaign ended");
        campaign.active = true;
        emit CampaignResumed(_campaignId);
    }

    /**
     * @notice End campaign and return remaining tokens to creator
     */
    function withdrawRemaining(bytes32 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator || msg.sender == owner(), "Not authorized");
        require(
            block.timestamp > campaign.endsAt || !campaign.active,
            "Campaign still active"
        );

        uint256 remaining = campaign.remainingAmount;
        require(remaining > 0, "Nothing to withdraw");

        campaign.remainingAmount = 0;
        campaign.active = false;

        IERC20(campaign.token).safeTransfer(campaign.creator, remaining);

        emit CampaignEnded(_campaignId, remaining);
    }

    // ── Admin functions ──

    function setDistributor(address _distributor, bool _authorized) external onlyOwner {
        distributors[_distributor] = _authorized;
        emit DistributorUpdated(_distributor, _authorized);
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Zero address");
        feeRecipient = _recipient;
    }

    // ── View functions ──

    function getCampaignCount() external view returns (uint256) {
        return campaignIds.length;
    }

    function getCampaign(bytes32 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
}
