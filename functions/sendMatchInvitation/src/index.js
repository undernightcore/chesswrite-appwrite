const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();

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
  
  let friends = database.listDocuments('friends', [
    sdk.Query.equal('user1', [req.env['APPWRITE_FUNCTION_USER_ID'], req.payload]),
    sdk.Query.equal('user2', [req.env['APPWRITE_FUNCTION_USER_ID'], req.payload]),
    sdk.Query.equal('status', 'accepted')
  ]);


  friends.then(function (response) {

    if (response.total) {
      let newMatch = database.createDocument('matches', 'unique()', {
        white: req.payload,
        black: req.env['APPWRITE_FUNCTION_USER_ID'],
        board: "",
        status: "pending",
        turn: "w",
        winner: ""
      })
      
      newMatch.then(function (data) {
        res.send("Match invitation sent!")
      },
      function (error) {
        res.json({message: "Error sending match invitation"}, 500)
      })

    } else {
      res.json({message: "You need to send a friend request to this user first"}, 500)
    }
  },
  function (error) {
    res.json({message: "Error sending match invitation"}, 500)
  });

};
