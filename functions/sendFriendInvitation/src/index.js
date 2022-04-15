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
    sdk.Query.equal('user2', [req.env['APPWRITE_FUNCTION_USER_ID'], req.payload])
  ]);

  friends.then(function (response) {

    let newFriend = users.get(req.payload);

    newFriend.then(function (data) {
        if (response.total) {
          res.json({message: "You already have that person as a friend or a friend request pending approval"}, 500)
        } else if (req.env['APPWRITE_FUNCTION_USER_ID'] == req.payload) {
          res.json({message: "You can't be you own friend... or can you?"}, 500)
        } else {
          let newFriendInvitation = database.createDocument('friends', 'unique()', {
            user1: req.env['APPWRITE_FUNCTION_USER_ID'],
            user2: req.payload,
            status: "pending"
          });
          newFriendInvitation.then(function (result) {
            res.send("The request has been sent")
          }, function (error) {
            res.json({message: "Error sending invitation"}, 500)
          });
        } 
    }, function (error) {
      res.json({message: "This user doesn't exist"}, 500)
    });

  },
  function (error) {
    res.send({message: "Error sending invitation"}, 500)
  });
};