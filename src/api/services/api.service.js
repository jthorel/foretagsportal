const { AuthenticationContext } = require("adal-node");
const fetch = require("node-fetch");

async function getGroups(req) {
    const { objectId } = req.matchedData;

    const B2C_TENANT = process.env.B2C_TENANT
        ? process.env.B2C_TENANT + ".onmicrosoft.com"
        : "folksamforetag.onmicrosoft.com";

    const token = await getAPIToken(B2C_TENANT);
    var queryString = `users/${objectId}/$links/memberOf?api-version=1.6`;
    // GET https://graph.windows.net/myorganization/users/{user_id}/$links/memberOf?api-version
    const res = await fetch(
        `https://graph.windows.net/${B2C_TENANT}/${queryString}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const json = await res.json();
    if (json["odata.error"])
        throw Error(
            `${json["odata.error"].code} ${json["odata.error"].message.value}`
        );
    const groupArray = json.value;
    let result = [];
    for (const group of groupArray) {
        const groupUrl = group.url;
        const groupResp = await fetch(
            `${groupUrl}?api-version=1.6&$select=displayName`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const groupJson = await groupResp.json();
        const name = groupJson.displayName;
        result.push(name);
    }
    console.log(result);
    return { groups: result };
}

// ===============================
// - getAPIToken
// get graph api token for the AD
// for AD calls (create user, add to group, remove etc)
//
// ===============================
function getAPIToken(tenant) {
    console.log("1. creating API token");
    var authorityHostUrl = "https://login.microsoftonline.com";
    var authorityUrl = authorityHostUrl + "/" + tenant;
    var applicationId =
        process.env.B2C_GRAPH_API_ID || "c2f7fe24-b96f-45db-94ae-68ef7625a438"; // Application Id of app registered under AAD.
    var clientSecret =
        process.env.B2C_GRAPH_API_SECRET || "tUur[tTZc[.51[X8BTklTIkd4:B/?yWM"; // Secret generated for app. Read this environment variable.
    var resource = "https://graph.windows.net/"; // URI that identifies the resource for which the token is valid.
    var context = new AuthenticationContext(authorityUrl);
    return new Promise((resolve, reject) => {
        context.acquireTokenWithClientCredentials(
            resource,
            applicationId,
            clientSecret,
            (err, tokenResponse) => {
                if (err) {
                    reject(err);
                } else {
                    console.log("1. - SUCCESS - API token created");
                    resolve(tokenResponse.accessToken);
                }
            }
        );
    });
}

module.exports = {
    getGroups,
    getAPIToken
};
