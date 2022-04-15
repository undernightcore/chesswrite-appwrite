const sdk = require("node-appwrite");
const { Chess } = require('chess.js');

module.exports = async function (req, res) {
  const client = new sdk.Client();
  const chess = new Chess()

  let database = new sdk.Database(client);
  let users = new sdk.Users(client);

  if (
    !req.env['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.env['APPWRITE_FUNCTION_API_KEY']
  ) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.env['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  }
  
  try {
    let data = JSON.parse(req.payload);
    if (data.match && data.from && data.to) {

      let matchRequest = database.getDocument('matches', data.match);

      matchRequest.then(function (response) {
        if (response.white == req.env['APPWRITE_FUNCTION_USER_ID'] || response.black == req.env['APPWRITE_FUNCTION_USER_ID']) {
          if (response.status == "ongoing") {
            chess.load_pgn(response.board)
            if ((chess.turn() == "w" && response.white == req.env['APPWRITE_FUNCTION_USER_ID']) || (chess.turn() == "b" && response.black == req.env['APPWRITE_FUNCTION_USER_ID'])) {
              if (chess.move({from: data.from, to: data.to})) {
                let status;
                let winner;
                if (chess.game_over()) {
                  status = "finished"
                  winner = req.env['APPWRITE_FUNCTION_USER_ID']
                } else {
                  status = "ongoing"
                  winner = ""
                }
                let updatedMatchRequest = database.updateDocument('matches', data.match, {
                  board: chess.pgn(),
                  status: status,
                  winner: winner,
                  turn: chess.turn()
                })
                updatedMatchRequest.then(function (response) {
                  res.send("You have made a move!")
                }, function (error) {
                  res.json({message: "Error making a move"}, 500)
                })
              } else {
                res.json({message: "You can't move there"}, 500)
              }
            } else {
              res.json({message: "It isn't your turn"}, 500)
            }
          } else {
            res.json({message: "You can't move right now"}, 500)
          }
          
        } else {
          res.json({message: "You are just a spectator here!"}, 500)
        }
      }, function (error) {
        res.json({message: "We can't find that match"}, 500)
      });

    } else {
      res.json({message: "Missing data"}, 500)
    }
  } catch (error) {
    res.json({message: "Wrong data received"}, 500)
  } 

};