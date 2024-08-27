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
import "@fhenixprotocol/contracts/FHE.sol";

// TODO: try with uint256
contract QuadraticVoting {
    struct Voting {
        uint8 id;
        uint256 startDate;
        uint256 endDate;
        euint64[] options;
        address[] voted;
    }

    euint64 immutable ZERO = FHE.asEuint64(0);

    address public owner;
    Voting[] public votings;
    IERC20 public votingToken;
    uint8 public lastId = 0;

    constructor(IERC20 _votingToken) {
        votingToken = _votingToken;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert QV_OnlyOwner();
        _;
    }

    function createVoting(uint256 _startDate, uint256 _endDate, uint256 _options) external onlyOwner {
        if (block.timestamp > _startDate || _startDate > _endDate) revert QV_Date();
        if (_options < 3) revert QV_InvalidInput();

        // initialize options array
        euint64[] memory optionsEmpty;
        for (uint256 i = 0; i < _options; i++) {
            optionsEmpty[i] = FHE.asEuint64(0);
        }

        address[] memory addressesEmpty;

        votings.push(Voting({
            id: lastId++,
            startDate: _startDate,
            endDate: _endDate,
            options: optionsEmpty,
            voted: addressesEmpty
        }));
    }

    // user can only vote once
    // example _votes: [0, 0, 21e18, 40e18, 0]
    function vote(uint8 _id, inEuint64[] calldata _votes) external {
        Voting storage voting = votings[_id];

        // validate input
        if (voting.startDate == 0) revert QV_VotingDoesntExist();
        if (voting.options.length != _votes.length) revert QV_InvalidInput();
        if (block.timestamp < voting.startDate || block.timestamp > voting.endDate) revert QV_Date();
        if (_hasVoted(_id, msg.sender)) revert QV_AlreadyVoted();

        euint64 totalSpent = FHE.asEuint64(0);

        // change every option, so input won't get leaked
        for (uint256 i = 0; i < voting.options.length; i++) {
            euint64 optionWeight = FHE.asEuint64(_votes[i]);
            ebool isVotingZero = optionWeight.eq(ZERO);

            euint64 toAdd = FHE.select(isVotingZero, ZERO, optionWeight);

            euint64 option = voting.options[i];
            voting.options[i] = option.add(toAdd);

            totalSpent = FHE.add(totalSpent, FHE.mul(optionWeight, optionWeight));
        }

        uint64 userBalance = uint64(votingToken.balanceOf(msg.sender));
        euint64 userBalanceEncrypted = FHE.asEuint64(userBalance);

        if (userBalanceEncrypted.lt(totalSpent).decrypt()) revert QV_InsufficientTokens();

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

