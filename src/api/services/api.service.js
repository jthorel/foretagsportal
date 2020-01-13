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

// ===============================
// - createADUserObject
//
// ===============================
function createADUserObject(user, tenant) {
    const extensionID =
        process.env.B2C_EXTENSION_ID || "461bed038d114dd8a5af6a4a5b666647";
    console.log("2. Creating AD Object");
    // const mailGuid = guidGenerator();
    return {
        objectId: null,
        accountEnabled: true,
        mailNickname: `${user.givenName}.${user.surname}`,
        signInNames: [],
        creationType: null,
        displayName: `${user.givenName} ${user.surname}`,
        givenName: user.givenName,
        surname: user.surname,
        passwordPolicies: null,
        userIdentities: [
            {
                issuer: "CGI",
                issuerUserId: Buffer.from(user.uid).toString("base64")
            }
        ],
        otherMails: [`${user.email}`],
        userPrincipalName: `${user.givenName}.${user.surname}@${tenant}`,
        [`extension_${extensionID}_admin`]: user.admin
    };
}

// ===============================
// - createUserInAD
// create user in AD
//
// ===============================
async function createUserInAD(tenantId, accessToken, userToBeCreated) {
    console.log("3. Adding user to AD");
    const res = await fetch(
        `https://graph.windows.net/${encodeURIComponent(
            tenantId
        )}/users?api-version=1.6`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + accessToken
            },
            body: JSON.stringify(userToBeCreated)
        }
    );
    const json = await res.json();
    if (!res.ok) throw Error(`${json["odata.error"].message.value}`);
    console.log("3. - SUCCESS - User added to AD");
    return json;
}

async function createUser(req) {
    const { user } = req.matchedData;
    const tenant = process.env.B2C_TENANT
        ? process.env.B2C_TENANT + ".onmicrosoft.com"
        : "folksamforetag.onmicrosoft.com";

    const token = await getAPIToken(tenant);
    const adObject = createADUserObject(user, tenant);
    const newUser = await createUserInAD(tenant, token, adObject);
    await addUserToADGroup(tenant, token, newUser.objectId);
    return newUser;
}

async function getUsers(req) {
    const groupId =
        process.env.AD_GROUP_ID || "96314840-db0b-4d56-bd96-ae7697291ec9";
    const tenant = process.env.B2C_TENANT
        ? process.env.B2C_TENANT + ".onmicrosoft.com"
        : "folksamforetag.onmicrosoft.com";

    const token = await getAPIToken(tenant);
    // GET https://graph.windows.net/myorganization/users/{user_id}/$links/memberOf?api-version
    const res = await fetch(
        `https://graph.windows.net/${tenant}/groups/${groupId}/members?api-version=1.6`,
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

    return json.value;
}

async function addUserToADGroup(tenantId, accessToken, aad_oid) {
    const groupId =
        process.env.AD_GROUP_ID || "96314840-db0b-4d56-bd96-ae7697291ec9";

    console.log("5. Adding user to AD group");
    const body = {
        url: `https://graph.windows.net/${tenantId}/directoryObjects/${aad_oid}`
    };
    const res = await fetch(
        `https://graph.windows.net/${encodeURIComponent(
            tenantId
        )}/groups/${groupId}/$links/members?api-version=1.6`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + accessToken
            },
            body: JSON.stringify(body)
        }
    );
    if (!res.ok) {
        const json = await res.json();
        throw Error(`${json["odata.error"].message.value}`);
    }
    console.log("5. - SUCCESS - User added to AD group");
    return true;
}

// ===============================
// - deleteUserFromAD
// remove user object in AD
//
// ===============================
async function deleteUserFromAD(req) {
    const { aad_oid } = req.matchedData;
    const tenant = process.env.B2C_TENANT
        ? process.env.B2C_TENANT + ".onmicrosoft.com"
        : "folksamforetag.onmicrosoft.com";

    const token = await getAPIToken(tenant);
    const res = await fetch(
        `https://graph.windows.net/${encodeURIComponent(
            tenant
        )}/users/${aad_oid}?api-version=1.6`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            }
        }
    );

    if (res.status === 404) throw Error("user did not exist in ad");
    if (res.status !== 204) {
        const json = await res.json();
        throw Error(JSON.stringify(json));
    }
    return "user successfully deleted from ad"; // body is empty when status is 204
}

module.exports = {
    deleteUserFromAD,
    getUsers,
    createUser,
    getGroups,
    getAPIToken
};
