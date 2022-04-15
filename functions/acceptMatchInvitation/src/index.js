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
  
  let matchRequest = database.getDocument('matches', req.payload);

  matchRequest.then(function (response) {
    if (response.white == req.env['APPWRITE_FUNCTION_USER_ID']) {
      if (response.status == "pending") {
        let updatedMatchRequest = database.updateDocument('matches', req.payload, {
          status: "ongoing"
        });
        updatedMatchRequest.then(function (response) {
          res.send("Match request accepted :)")
        }, function (error) {
          res.json({message: "Error accepting match request"}, 500)
        });
      } else {
        res.json({message: "You can't accept this match request"}, 500)
      }
    } else {
      res.json({message: "You can't accept this match request"}, 500)
    }
  }, function (error) {
    res.json({message: "We can't find that match request"}, 500)
  });

};