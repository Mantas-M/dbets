// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;

import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Prediction is ConfirmedOwner, FunctionsClient, ERC721Enumerable {
  using Functions for Functions.Request;
    
  string _baseTokenURI;
  uint256 public _price = 0.001 ether;
  uint256 public tokenIds;
  mapping (uint256 => string) private _tokenURIs;


  bytes32 public latestRequestId;
  bytes public latestResponse;
  bytes public latestError;

  event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

  constructor(address oracle) FunctionsClient(oracle) ConfirmedOwner(msg.sender) ERC721("Prediction", "DBP") {}

  function executeRequest(
    string calldata source,
    bytes calldata secrets,
    string[] calldata args,
    uint64 subscriptionId,
    uint32 gasLimit
  ) public onlyOwner returns (bytes32) {
    Functions.Request memory req;
    req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
    if (secrets.length > 0) {
      req.addRemoteSecrets(secrets);
    }
    if (args.length > 0) req.addArgs(args);

    bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
    latestRequestId = assignedReqID;
    return assignedReqID;
  }

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    latestResponse = response;
    latestError = err;
    emit OCRResponse(requestId, response, err);
  }

  function updateOracleAddress(address oracle) public onlyOwner {
    setOracle(oracle);
  }

  function addSimulatedRequestId(address oracleAddress, bytes32 requestId) public onlyOwner {
    addExternalRequest(oracleAddress, requestId);
  }

  function mint() public payable  {
    require(msg.value >= _price, "Ether sent is not correct");
    require(latestResponse.length > 0, "No metadata is available");
    tokenIds += 1;
    _safeMint(msg.sender, tokenIds);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function withdraw() public onlyOwner  {
      address _owner = owner();
      uint256 amount = address(this).balance;
      (bool sent, ) =  _owner.call{value: amount}("");
      require(sent, "Failed to send Ether");
  }
  
  receive() external payable {}
  fallback() external payable {}
}