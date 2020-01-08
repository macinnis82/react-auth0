const express = require('express');
require('dotenv').config();
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const checkScope = require('express-jwt-authz'); // Validates JWT scopes

const checkJwt = jwt({
    // Dynamically provide a signing key based on the kid in the header
    // and the signing keys provided by the JWKS endpoint
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,

    // this must match the algorithm selected in the Auth0 dashboards
    // under your app's advanced settings under the OAuth Tab
    algorithms: ["RS256"]
});

const app = express();

function checkRole(role) {
    return function (req, res, next) {
        const assignRoles = req.user["http://localhost:3000/roles"];
        if (Array.isArray(assignRoles) && assignRoles.includes(role)) {
            return next();
        } else {
            return res.status(401).send("Insufficient role");
        }
    };
};

app.get('/public', function(req, res) {
    res.json({
        message: "Hello from a public API!!"
    });
});

app.get('/private', checkJwt, function(req, res) {
    res.json({
        message: "Hello from a private API!!"
    });
});

app.get('/course', checkJwt, checkScope(["read:courses"]), function(req, res) {
    res.json({
        courses: [
            { id: 1, title: "Building Apps with React and Redux" },
            { id: 2, title: "Creating Reusable React Components" }
        ]
    });
});

app.get('/admin', checkJwt, checkRole('admin'), function(req, res) {
    res.json({
        message: "Hello from an Admin API!!"
    });
});

app.listen(3001);
console.log("API server listening on " + process.env.REACT_APP_API_URL);
