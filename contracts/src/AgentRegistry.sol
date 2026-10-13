// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title AgentRegistry
/// @notice Agent identity and task-gated reputation, inspired by ERC-8004 (Trustless Agents).
/// @dev Every agent is an ERC-721 identity token that points to a registration file (agentURI).
/// Feedback can only be given by a client whose task the agent actually completed, so each
/// reputation point is backed by an on-chain interaction. This is a simplified take on the
/// ERC-8004 identity and reputation registries, not a conforming implementation.
contract AgentRegistry is ERC721 {
    enum TaskStatus {
        Open,
        Completed,
        Rated
    }

    struct Agent {
        string name;
        string agentURI;
        uint64 registeredAt;
        uint32 tasksReceived;
        uint32 tasksCompleted;
        uint32 feedbackCount;
        uint64 feedbackSum;
    }

    struct Task {
        uint256 agentId;
        address client;
        TaskStatus status;
        uint8 rating;
        uint64 createdAt;
        uint64 completedAt;
        uint64 ratedAt;
        string description;
        string result;
    }

    struct AgentView {
        uint256 id;
        address owner;
        string name;
        string agentURI;
        uint256 score;
        uint64 registeredAt;
        uint32 tasksReceived;
        uint32 tasksCompleted;
        uint32 feedbackCount;
    }

    struct TaskView {
        uint256 id;
        uint256 agentId;
        address client;
        TaskStatus status;
        uint8 rating;
        uint64 createdAt;
        uint64 completedAt;
        uint64 ratedAt;
        string description;
        string result;
    }

    /// @notice Scores are fixed-point with this many decimals (5000 = 50.00).
    uint8 public constant SCORE_DECIMALS = 2;
    uint8 public constant MAX_RATING = 5;

    uint256 public constant MAX_NAME_LENGTH = 48;
    uint256 public constant MAX_TEXT_LENGTH = 512;
    uint256 public constant MAX_URI_LENGTH = 2048;

    // Each star is worth 20 points, so ratings map onto a 20-100 scale.
    uint64 private constant POINTS_PER_STAR = 20;
    // A new agent behaves as if it already had PRIOR_WEIGHT neutral ratings, so a
    // single 5-star review cannot push it straight to the top of the leaderboard.
    uint256 private constant PRIOR_WEIGHT = 3;
    uint256 private constant PRIOR_POINTS = 50;

    uint256 public agentCount;
    uint256 public taskCount;
    uint256 public feedbackTotal;

    mapping(uint256 agentId => Agent) private _agents;
    mapping(uint256 taskId => Task) private _tasks;
    mapping(uint256 agentId => uint256[]) private _agentTaskIds;

    event Registered(uint256 indexed agentId, address indexed owner, string name, string agentURI);
    event URIUpdated(uint256 indexed agentId, string newURI);
    event TaskCreated(uint256 indexed taskId, uint256 indexed agentId, address indexed client, string description);
    event TaskCompleted(uint256 indexed taskId, uint256 indexed agentId, string result);
    event NewFeedback(
        uint256 indexed agentId, address indexed client, uint256 indexed taskId, uint8 rating, uint256 newScore
    );

    error InvalidLength();
    error InvalidRating();
    error InvalidStatus();
    error NotAgentOwner();
    error NotClient();
    error SelfDealing();
    error TaskNotFound();

    constructor() ERC721("RepBase Agent", "AGENT") {}

    // ───────────────────────────── Identity ─────────────────────────────

    /// @notice Mint an agent identity to the caller.
    /// @param name Human readable agent name.
    /// @param agentURI Registration file for the agent (https, ipfs or data URI). May be empty.
    function register(string calldata name, string calldata agentURI) external returns (uint256 agentId) {
        _checkLength(name, 1, MAX_NAME_LENGTH);
        _checkLength(agentURI, 0, MAX_URI_LENGTH);

        agentId = ++agentCount;
        Agent storage agent = _agents[agentId];
        agent.name = name;
        agent.agentURI = agentURI;
        agent.registeredAt = uint64(block.timestamp);

        // The recipient is the caller itself, so no receiver check (and no callback) is needed.
        _mint(msg.sender, agentId);
        emit Registered(agentId, msg.sender, name, agentURI);
    }

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        if (msg.sender != _requireOwned(agentId)) revert NotAgentOwner();
        _checkLength(newURI, 0, MAX_URI_LENGTH);

        _agents[agentId].agentURI = newURI;
        emit URIUpdated(agentId, newURI);
    }

    function tokenURI(uint256 agentId) public view override returns (string memory) {
        _requireOwned(agentId);
        return _agents[agentId].agentURI;
    }

    // ────────────────────────────── Tasks ───────────────────────────────

    /// @notice Assign a task to an agent. Owners cannot hire their own agent.
    function createTask(uint256 agentId, string calldata description) external returns (uint256 taskId) {
        if (msg.sender == _requireOwned(agentId)) revert SelfDealing();
        _checkLength(description, 1, MAX_TEXT_LENGTH);

        taskId = ++taskCount;
        Task storage task = _tasks[taskId];
        task.agentId = agentId;
        task.client = msg.sender;
        task.createdAt = uint64(block.timestamp);
        task.description = description;

        _agentTaskIds[agentId].push(taskId);
        _agents[agentId].tasksReceived++;

        emit TaskCreated(taskId, agentId, msg.sender, description);
    }

    /// @notice Agent owner delivers the result of an open task.
    /// @param result Short summary of the work or a URI pointing to it.
    function completeTask(uint256 taskId, string calldata result) external {
        Task storage task = _existingTask(taskId);
        if (msg.sender != ownerOf(task.agentId)) revert NotAgentOwner();
        if (task.status != TaskStatus.Open) revert InvalidStatus();
        _checkLength(result, 1, MAX_TEXT_LENGTH);

        task.status = TaskStatus.Completed;
        task.completedAt = uint64(block.timestamp);
        task.result = result;
        _agents[task.agentId].tasksCompleted++;

        emit TaskCompleted(taskId, task.agentId, result);
    }

    // ──────────────────────────── Reputation ────────────────────────────

    /// @notice Client rates a completed task (1-5 stars), updating the agent's score.
    function giveFeedback(uint256 taskId, uint8 rating) external {
        Task storage task = _existingTask(taskId);
        if (msg.sender != task.client) revert NotClient();
        if (task.status != TaskStatus.Completed) revert InvalidStatus();
        if (rating == 0 || rating > MAX_RATING) revert InvalidRating();
        // The identity may have been transferred to the client after the task was created.
        if (msg.sender == ownerOf(task.agentId)) revert SelfDealing();

        task.status = TaskStatus.Rated;
        task.rating = rating;
        task.ratedAt = uint64(block.timestamp);

        Agent storage agent = _agents[task.agentId];
        agent.feedbackCount++;
        agent.feedbackSum += rating * POINTS_PER_STAR;
        feedbackTotal++;

        emit NewFeedback(task.agentId, msg.sender, taskId, rating, _score(agent));
    }

    /// @notice Aggregated reputation for an agent.
    /// @return count Number of feedback entries.
    /// @return score Smoothed average on a 0-100 scale with `decimals` decimals.
    function getSummary(uint256 agentId) external view returns (uint64 count, uint256 score, uint8 decimals) {
        _requireOwned(agentId);
        Agent storage agent = _agents[agentId];
        return (agent.feedbackCount, _score(agent), SCORE_DECIMALS);
    }

    // ─────────────────────────────── Views ──────────────────────────────

    function getAgent(uint256 agentId) external view returns (AgentView memory) {
        _requireOwned(agentId);
        return _agentView(agentId);
    }

    /// @notice Agents ordered by id, starting after `offset`.
    function getAgents(uint256 offset, uint256 limit) external view returns (AgentView[] memory agents) {
        uint256 total = agentCount;
        if (offset >= total) return agents;

        uint256 size = _min(limit, total - offset);
        agents = new AgentView[](size);
        for (uint256 i = 0; i < size; i++) {
            agents[i] = _agentView(offset + i + 1);
        }
    }

    function getTask(uint256 taskId) external view returns (TaskView memory) {
        _existingTask(taskId);
        return _taskView(taskId);
    }

    /// @notice Latest tasks across all agents, newest first.
    function getRecentTasks(uint256 limit) external view returns (TaskView[] memory tasks) {
        uint256 total = taskCount;
        uint256 size = _min(limit, total);
        tasks = new TaskView[](size);
        for (uint256 i = 0; i < size; i++) {
            tasks[i] = _taskView(total - i);
        }
    }

    /// @notice Latest tasks of one agent, newest first.
    function getAgentTasks(uint256 agentId, uint256 limit) external view returns (TaskView[] memory tasks) {
        uint256[] storage ids = _agentTaskIds[agentId];
        uint256 total = ids.length;
        uint256 size = _min(limit, total);
        tasks = new TaskView[](size);
        for (uint256 i = 0; i < size; i++) {
            tasks[i] = _taskView(ids[total - i - 1]);
        }
    }

    // ───────────────────────────── Internals ────────────────────────────

    function _score(Agent storage agent) private view returns (uint256) {
        return ((PRIOR_WEIGHT * PRIOR_POINTS + agent.feedbackSum) * 10 ** SCORE_DECIMALS)
            / (PRIOR_WEIGHT + agent.feedbackCount);
    }

    function _agentView(uint256 agentId) private view returns (AgentView memory) {
        Agent storage agent = _agents[agentId];
        return AgentView({
            id: agentId,
            owner: _ownerOf(agentId),
            name: agent.name,
            agentURI: agent.agentURI,
            score: _score(agent),
            registeredAt: agent.registeredAt,
            tasksReceived: agent.tasksReceived,
            tasksCompleted: agent.tasksCompleted,
            feedbackCount: agent.feedbackCount
        });
    }

    function _taskView(uint256 taskId) private view returns (TaskView memory) {
        Task storage task = _tasks[taskId];
        return TaskView({
            id: taskId,
            agentId: task.agentId,
            client: task.client,
            status: task.status,
            rating: task.rating,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
            ratedAt: task.ratedAt,
            description: task.description,
            result: task.result
        });
    }

    function _existingTask(uint256 taskId) private view returns (Task storage task) {
        task = _tasks[taskId];
        if (task.client == address(0)) revert TaskNotFound();
    }

    function _checkLength(string calldata value, uint256 min, uint256 max) private pure {
        uint256 length = bytes(value).length;
        if (length < min || length > max) revert InvalidLength();
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
