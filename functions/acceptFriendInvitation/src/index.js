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

  let friendRequest = database.getDocument('friends', req.payload);

  friendRequest.then(function (response) {
    
    if (response.user2 == req.env['APPWRITE_FUNCTION_USER_ID']) {
      if (response.status == "pending") {
        let updatedFriendRequest = database.updateDocument('friends', req.payload, {
          status: "accepted"
        });
        updatedFriendRequest.then(function (response) {
          res.send("Friend request accepted :)")
        }, function (error) {
          res.json({message: "Error accepting friend request"}, 500)
        });
      } else {
        res.json({message: "You already accepted this request"}, 500)
      }
    } else {
      res.json({message: "Error accepting friend request"}, 500)
    }

  }, function (error) {
    res.json({message: "We can't find that friend request"}, 500)
  });

};
