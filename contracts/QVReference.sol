// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

error QV_OnlyOwner();
error QV_InsufficientTokens();
error QV_VotingDoesntExist();
error QV_OptionDoesntExist();
error QV_Date();
error QV_AlreadyVoted();
error QV_InvalidInput();
error QV_NotTransferable();

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract QuadraticVoting {
    struct Voting {
        uint8 id;
        uint256 startDate;
        uint256 endDate;
        uint256[] options;
        address[] voted;
    }

    address owner;
    Voting[] votings;
    IERC20 votingToken;
    uint8 lastId = 0;

    constructor(IERC20 _votingToken) {
        votingToken = _votingToken;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert QV_OnlyOwner();
        _;
    }

    function createVoting(uint256 _startDate, uint256 _endDate, uint256[] calldata _options) external onlyOwner {
        // TODO: validate start/end date
        if (_options.length < 3) revert QV_InvalidInput();

        address[] memory emptyArray;
        votings.push(Voting({
            id: lastId,
            startDate: _startDate,
            endDate: _endDate,
            options: _options,
            voted: emptyArray 
        }));

        ++lastId;
    }

    // user can only vote once
    function vote(uint8 _id, uint256[] calldata _votes) external {
        Voting storage voting = votings[_id];

        // validate input
        if (voting.options.length != _votes.length) revert QV_InvalidInput();
        if (voting.startDate == 0) revert QV_VotingDoesntExist();
        if (block.timestamp < voting.startDate || block.timestamp > voting.endDate) revert QV_Date();
        if (_hasVoted(_id, msg.sender)) revert QV_AlreadyVoted();

        uint256 totalSpent = 0;

        for (uint256 i = 0; i < voting.options.length; i++) {
            uint256 optionWeight = _votes[i];

            if (optionWeight > 0) {
                voting.options[i] += optionWeight;
                totalSpent += optionWeight ** 2;
            }
        }

        if (votingToken.balanceOf(msg.sender) < totalSpent) revert QV_InsufficientTokens();

        voting.voted.push(msg.sender);
    }

    function _hasVoted(uint8 _id, address _user) internal view returns (bool) {
        for (uint256 i = 0; i < votings[_id].voted.length; i++) {
            if (votings[_id].voted[i] == _user) {
                return true;
            }
        }
        return false;
    }
}

