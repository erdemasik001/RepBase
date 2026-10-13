// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry internal registry;

    address internal owner = makeAddr("owner");
    address internal client = makeAddr("client");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        registry = new AgentRegistry();
    }

    // ───────────────────────────── Helpers ──────────────────────────────

    function _register() internal returns (uint256 agentId) {
        vm.prank(owner);
        agentId = registry.register("Atlas", "ipfs://atlas");
    }

    function _createTask(uint256 agentId) internal returns (uint256 taskId) {
        vm.prank(client);
        taskId = registry.createTask(agentId, "Summarize the Monad docs");
    }

    function _complete(uint256 taskId) internal {
        vm.prank(owner);
        registry.completeTask(taskId, "ipfs://result");
    }

    function _rate(uint256 taskId, uint8 rating) internal {
        vm.prank(client);
        registry.giveFeedback(taskId, rating);
    }

    function _runTask(uint256 agentId, uint8 rating) internal {
        uint256 taskId = _createTask(agentId);
        _complete(taskId);
        _rate(taskId, rating);
    }

    // ───────────────────────────── Identity ─────────────────────────────

    function test_Register_MintsIdentityToCaller() public {
        vm.expectEmit(true, true, false, true);
        emit AgentRegistry.Registered(1, owner, "Atlas", "ipfs://atlas");
        uint256 agentId = _register();

        assertEq(agentId, 1);
        assertEq(registry.agentCount(), 1);
        assertEq(registry.ownerOf(agentId), owner);
        assertEq(registry.tokenURI(agentId), "ipfs://atlas");

        AgentRegistry.AgentView memory agent = registry.getAgent(agentId);
        assertEq(agent.id, 1);
        assertEq(agent.owner, owner);
        assertEq(agent.name, "Atlas");
        assertEq(agent.registeredAt, block.timestamp);
    }

    function test_Register_NewAgentStartsAtNeutralScore() public {
        uint256 agentId = _register();

        (uint64 count, uint256 score, uint8 decimals) = registry.getSummary(agentId);
        assertEq(count, 0);
        assertEq(score, 5000);
        assertEq(decimals, 2);
    }

    function test_Register_RevertsOnInvalidName() public {
        vm.expectRevert(AgentRegistry.InvalidLength.selector);
        registry.register("", "");

        vm.expectRevert(AgentRegistry.InvalidLength.selector);
        registry.register("this-agent-name-is-way-too-long-to-fit-in-the-registry", "");
    }

    function test_SetAgentURI_OnlyOwner() public {
        uint256 agentId = _register();

        vm.prank(stranger);
        vm.expectRevert(AgentRegistry.NotAgentOwner.selector);
        registry.setAgentURI(agentId, "ipfs://hijacked");

        vm.prank(owner);
        registry.setAgentURI(agentId, "ipfs://atlas-v2");
        assertEq(registry.tokenURI(agentId), "ipfs://atlas-v2");
    }

    // ────────────────────────────── Tasks ───────────────────────────────

    function test_CreateTask_RecordsTask() public {
        uint256 agentId = _register();

        vm.expectEmit(true, true, true, true);
        emit AgentRegistry.TaskCreated(1, agentId, client, "Summarize the Monad docs");
        uint256 taskId = _createTask(agentId);

        AgentRegistry.TaskView memory task = registry.getTask(taskId);
        assertEq(task.agentId, agentId);
        assertEq(task.client, client);
        assertEq(uint8(task.status), uint8(AgentRegistry.TaskStatus.Open));
        assertEq(task.description, "Summarize the Monad docs");
        assertEq(registry.getAgent(agentId).tasksReceived, 1);
    }

    function test_CreateTask_RevertsWhenOwnerHiresOwnAgent() public {
        uint256 agentId = _register();

        vm.prank(owner);
        vm.expectRevert(AgentRegistry.SelfDealing.selector);
        registry.createTask(agentId, "Give myself work");
    }

    function test_CreateTask_RevertsForUnknownAgent() public {
        vm.prank(client);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 42));
        registry.createTask(42, "Hello?");
    }

    function test_CompleteTask_OnlyAgentOwner() public {
        uint256 taskId = _createTask(_register());

        vm.prank(stranger);
        vm.expectRevert(AgentRegistry.NotAgentOwner.selector);
        registry.completeTask(taskId, "done");

        _complete(taskId);

        AgentRegistry.TaskView memory task = registry.getTask(taskId);
        assertEq(uint8(task.status), uint8(AgentRegistry.TaskStatus.Completed));
        assertEq(task.result, "ipfs://result");
        assertEq(registry.getAgent(task.agentId).tasksCompleted, 1);
    }

    function test_CompleteTask_RevertsWhenNotOpen() public {
        uint256 taskId = _createTask(_register());
        _complete(taskId);

        vm.prank(owner);
        vm.expectRevert(AgentRegistry.InvalidStatus.selector);
        registry.completeTask(taskId, "again");
    }

    function test_CompleteTask_RevertsForUnknownTask() public {
        vm.expectRevert(AgentRegistry.TaskNotFound.selector);
        registry.completeTask(7, "done");
    }

    // ──────────────────────────── Reputation ────────────────────────────

    function test_GiveFeedback_UpdatesScore() public {
        uint256 agentId = _register();
        uint256 taskId = _createTask(agentId);
        _complete(taskId);

        // (3 * 50 + 100) / (3 + 1) = 62.50
        vm.expectEmit(true, true, true, true);
        emit AgentRegistry.NewFeedback(agentId, client, taskId, 5, 6250);
        _rate(taskId, 5);

        AgentRegistry.TaskView memory task = registry.getTask(taskId);
        assertEq(uint8(task.status), uint8(AgentRegistry.TaskStatus.Rated));
        assertEq(task.rating, 5);

        AgentRegistry.AgentView memory agent = registry.getAgent(agentId);
        assertEq(agent.score, 6250);
        assertEq(agent.feedbackCount, 1);
        assertEq(registry.feedbackTotal(), 1);
    }

    function test_GiveFeedback_BadRatingLowersScore() public {
        uint256 agentId = _register();
        _runTask(agentId, 5);
        assertEq(registry.getAgent(agentId).score, 6250);

        // (150 + 100 + 20) / 5 = 54.00
        _runTask(agentId, 1);
        assertEq(registry.getAgent(agentId).score, 5400);
    }

    function test_GiveFeedback_OnlyClient() public {
        uint256 taskId = _createTask(_register());
        _complete(taskId);

        vm.prank(stranger);
        vm.expectRevert(AgentRegistry.NotClient.selector);
        registry.giveFeedback(taskId, 5);

        vm.prank(owner);
        vm.expectRevert(AgentRegistry.NotClient.selector);
        registry.giveFeedback(taskId, 5);
    }

    function test_GiveFeedback_RevertsBeforeCompletion() public {
        uint256 taskId = _createTask(_register());

        vm.prank(client);
        vm.expectRevert(AgentRegistry.InvalidStatus.selector);
        registry.giveFeedback(taskId, 5);
    }

    function test_GiveFeedback_RevertsOnSecondRating() public {
        uint256 taskId = _createTask(_register());
        _complete(taskId);
        _rate(taskId, 4);

        vm.prank(client);
        vm.expectRevert(AgentRegistry.InvalidStatus.selector);
        registry.giveFeedback(taskId, 5);
    }

    function test_GiveFeedback_RevertsOnOutOfRangeRating() public {
        uint256 taskId = _createTask(_register());
        _complete(taskId);

        vm.startPrank(client);
        vm.expectRevert(AgentRegistry.InvalidRating.selector);
        registry.giveFeedback(taskId, 0);
        vm.expectRevert(AgentRegistry.InvalidRating.selector);
        registry.giveFeedback(taskId, 6);
        vm.stopPrank();
    }

    function test_GiveFeedback_RevertsWhenClientAcquiredTheAgent() public {
        uint256 agentId = _register();
        uint256 taskId = _createTask(agentId);
        _complete(taskId);

        vm.prank(owner);
        registry.transferFrom(owner, client, agentId);

        vm.prank(client);
        vm.expectRevert(AgentRegistry.SelfDealing.selector);
        registry.giveFeedback(taskId, 5);
    }

    function test_ReputationFollowsIdentityOnTransfer() public {
        uint256 agentId = _register();
        _runTask(agentId, 5);

        vm.prank(owner);
        registry.transferFrom(owner, stranger, agentId);

        AgentRegistry.AgentView memory agent = registry.getAgent(agentId);
        assertEq(agent.owner, stranger);
        assertEq(agent.score, 6250);
    }

    function testFuzz_ScoreStaysWithinRatingBounds(uint8[] calldata ratings) public {
        vm.assume(ratings.length <= 32);
        uint256 agentId = _register();

        for (uint256 i = 0; i < ratings.length; i++) {
            _runTask(agentId, uint8(bound(ratings[i], 1, 5)));
        }

        uint256 score = registry.getAgent(agentId).score;
        assertGe(score, 2000);
        assertLe(score, 10000);
    }

    // ─────────────────────────────── Views ──────────────────────────────

    function test_GetAgents_Paginates() public {
        for (uint256 i = 0; i < 5; i++) {
            registry.register(string.concat("Agent ", vm.toString(i + 1)), "");
        }

        AgentRegistry.AgentView[] memory page = registry.getAgents(1, 2);
        assertEq(page.length, 2);
        assertEq(page[0].id, 2);
        assertEq(page[1].id, 3);

        assertEq(registry.getAgents(0, 100).length, 5);
        assertEq(registry.getAgents(4, 100).length, 1);
        assertEq(registry.getAgents(5, 100).length, 0);
    }

    function test_GetRecentTasks_NewestFirst() public {
        uint256 atlas = _register();
        vm.prank(stranger);
        uint256 nova = registry.register("Nova", "");

        _createTask(atlas);
        _createTask(nova);
        _createTask(atlas);

        AgentRegistry.TaskView[] memory recent = registry.getRecentTasks(2);
        assertEq(recent.length, 2);
        assertEq(recent[0].id, 3);
        assertEq(recent[1].id, 2);

        AgentRegistry.TaskView[] memory atlasTasks = registry.getAgentTasks(atlas, 10);
        assertEq(atlasTasks.length, 2);
        assertEq(atlasTasks[0].id, 3);
        assertEq(atlasTasks[1].id, 1);

        assertEq(registry.getRecentTasks(10).length, 3);
        assertEq(registry.getAgentTasks(nova, 10).length, 1);
    }
}
