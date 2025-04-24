require('dotenv').config();

const express = require('express');
const router = express.Router();
const sendResponse = require('./sendResponse');
const pool = require('../config');
const util = require('util');
const {cmdLogger, persistentLogger} = require('../logger');
const bcrypt = require('bcrypt');
const sendEmail = require('./sendEmail').sendVerificationEmail;
const verifyEmail = require('./sendEmail').verifyEmail;
const path = require('path');
const fs = require('fs');

const jwt = require('jsonwebtoken');

const poolQuery = util.promisify(pool.query).bind(pool);
const table = 'users';

// Page after user is verified
const verificationPage = "";

function authMiddleware(req, res, next) {
    const token = req.cookies.token// Check for token in cookies

    if (!token) {
        cmdLogger.warn('No token provided');
        persistentLogger.warn({
            method: "POST",
            url: "/users/auth",
            status: "400",
            message: "No token provided",
            user_ip: req.ip
        });

        return sendResponse(res, 401, 'Unauthorized access');
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            cmdLogger.error('Failed to authenticate token');
            persistentLogger.error({
                method: "POST",
                url: "/users/auth",
                status: "400",
                message: "Failed to authenticate token",
                user_ip: req.ip,
                error: err
            });

            return sendResponse(res, 401, 'Unauthorized access');
        }

        req.user = decoded; // Save decoded user info in request object
        next();
    });
}

function userLoggedIn(req, res, next) {
    if (req.cookies.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);

            cmdLogger.warn("User already logged in");
            persistentLogger.warn({
                method: "POST",
                url: "/users/login",
                status: "400",
                message: "user already logged in",
                user_ip: req.ip,
                username: decoded.email_id
            });
            
            return sendResponse(res, 400, 'User already logged in');
        } catch (err) {
            cmdLogger.error(err);
            cmdLogger.error("Deleting token cookie");
            res.clearCookie('token'); // Clear the token cookie if it's invalid
        }

    }

    next();
}

router.use(express.static(path.join((__dirname, '../pages')))); // Serve static files from the pages directory

router.get('/user_logged_in', authMiddleware, async (req, res) => {
    sendResponse(res, 200, "User is logged in");
});

router.post('/login', userLoggedIn, async (req, res) => {
    cmdLogger.info("Inside POST /users/login");
    persistentLogger.info({
        method: "POST",
        url: "/users/login",
        status: "400",
        message: "Request received",
        user_ip: req.ip,
    });

    const userInfo = req.body;
    
    if (!userInfo.email_id || !userInfo.password) {
        cmdLogger.warn("Email id and/or password not part of request body");
        persistentLogger.warn({
            method: "POST",
            url: "/users/login",
            status: "400",
            message: "Email id and/or password not part of request body",
            user_ip: req.ip
        });

        sendResponse(res, 400, "Email id and password are required");
    }

    else {
        try {
            const results = await poolQuery(`SELECT * FROM ${table} WHERE email_id = ?;`, [userInfo.email_id]);

            if (results.length === 1) {
                const hashedPassword = results[0]['password'];

                try {
                    const isMatch = await bcrypt.compare(userInfo.password, hashedPassword);

                    if (isMatch) {
                        cmdLogger.info("User authenticated");
                        persistentLogger.info({
                            method: "POST",
                            url: "/users/login",
                            status: "200",
                            message: "Login authenication successful",
                            user_ip: req.ip
                        });

                        cmdLogger.info("Creating JWT token");

                        const token = jwt.sign({email_id: userInfo.email_id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRATION_TIME});

                        cmdLogger.info("Token created successfully");
                        res.cookie('token', token, {
                            httpOnly: true,
                            maxAge: 3600 * 1000, // 1 hour
                            secure: process.env.NODE_ENV === 'production'
                        }); // Set token in cookie

                        cmdLogger.info(`JWT created: ${token}`);
                        persistentLogger.info({
                            method: "POST",
                            url: "/users/login",
                            status: "200",
                            message: "JWT created",
                            user_ip: req.ip,
                            token: token,
                            username: userInfo.email_id
                        });

                        sendResponse(res, 200, "Success");
                    }
    
                    else {
                        cmdLogger.warn('User authentication failure: Invalid password');
                        persistentLogger.warn({
                            method: "POST",
                            url: "/users/login",
                            status: "400",
                            message: "User authentication failed: invalid password",
                            user_ip: req.ip
                        });
                        sendResponse(res, 401, "Invalid username or password");
                    }
                }
                
                catch (err) {
                    cmdLogger.error(`Error while comparing passwords: ${JSON.stringify(err)}`);
                    persistentLogger.error({
                        method: "POST",
                        url: "/users/login",
                        status: "400",
                        message: "Error comparing passwords",
                        user_ip: req.ip,
                        error: err
                    });

                    sendResponse(res, 400, "Error authenticating user");
                }
                
            }

            else {
                cmdLogger.warn(`No user with username: ${userInfo.email_id}`);
                persistentLogger.warn({
                    method: "POST",
                    url: "/users/login",
                    status: "400",
                    message: "User with provided username does not exist",
                    user_ip: req.ip
                });

                sendResponse(res, 401, "Invalid username or password");
            }
        }

        catch (err) {
            cmdLogger.error(`Error retreiving data from db: ${err}`);
            persistentLogger.error({
                method: "POST",
                url: "/users/login",
                status: "400",
                message: "Error while retreiving data from db",
                user_ip: req.ip,
                error: err
            });

            sendResponse(res, 400, "DB Error");
        }
    }
});

router.post('/register', userLoggedIn, async (req, res) => {
    cmdLogger.info('Inside POST /users/register');
    persistentLogger.info({
        method: "POST",
        url: "/users/register",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    var userInfo = req.body;

    if (!userInfo.email_id || !userInfo.password || !userInfo.music_platform || !userInfo.first_name || !userInfo.last_name) {
        cmdLogger.warn('Request body does not contain all necessary information');
        persistentLogger.warn({
            method: "POST",
            url: "/users/register",
            status: "400",
            message: "Request body does not contain all necessary information",
            user_ip: req.ip
        });

        sendResponse(res, 400, "Enter all required information");
    }
    else {

        try {
            const isValidEmail = await verifyEmail(userInfo.email_id);

            if (isValidEmail === false) {
                cmdLogger.error('Invalid email address: ' + userInfo.email_id);
                persistentLogger.error({
                    method: "POST",
                    url: "/users/register",
                    status: "400",
                    message: "Invalid email address",
                    user_ip: req.ip,
                    email_id: userInfo.email_id
                });

                sendResponse(res, 400, "Invalid email address");
                return;
            }

            const results = await poolQuery(`SELECT * FROM ${table} WHERE email_id = ?;`, [userInfo.email_id]);

            if (results.length == 0) {
                const hashedPassword = await bcrypt.hash(userInfo.password, 10);

                try {
                    const results  = await poolQuery(`INSERT INTO ${table} (email_id, password, verified, music_platform,  first_name, last_name) VALUES 
                                                    (?, ?, ?, ?, ?, ?);`, [userInfo.email_id, hashedPassword, false, userInfo.music_platform, userInfo.first_name, userInfo.last_name]);
                    
                    cmdLogger.info('Insert successful: ', results.insertId);
                    persistentLogger.info({
                        method: "POST",
                        url: "/users/register",
                        status: "200",
                        message: "Successfully saved new user to db",
                        user_ip: req.ip
                    });

                    // Send JWT cookie to user
                    cmdLogger.info("Creating JWT token");

                    const token = jwt.sign({email_id: userInfo.email_id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRATION_TIME});

                    cmdLogger.info("Token created successfully");
                    res.cookie('token', token, {
                        httpOnly: true,
                        maxAge: 3600 * 1000, // 1 hour
                        secure: process.env.NODE_ENV === 'production'
                    }); // Set token in cookie

                    cmdLogger.info(`JWT created: ${token}`);
                    persistentLogger.info({
                        method: "POST",
                        url: "/users/login",
                        status: "200",
                        message: "JWT created",
                        user_ip: req.ip,
                        token: token,
                        username: userInfo.email_id
                    });
                    sendResponse(res, 200, "User registered successfully");
                } catch (err) {
                    cmdLogger.error('Error inserting new user: ', err);
                    persistentLogger.error({
                        method: "POST",
                        url: "/users/register",
                        status: "400",
                        message: "Error occurred while inserting new user to the db",
                        user_ip: req.ip,
                        error: err
                    });

                    sendResponse(res, 400, "DB Error");
                }
            }

            else {
                cmdLogger.warn('Email id already exists');
                persistentLogger.warn({
                    method: "POST",
                    url: "/users/register",
                    status: "400",
                    message: "Email id already exists",
                    user_ip: req.ip
                });

                sendResponse(res, 409, "Email id already exists");
            }

        } catch (err) {
            sendResponse(res, 400, "DB Error")
        }
    }
});

router.get('/settings', authMiddleware, async (req, res) => {
    cmdLogger.info('Inside GET /users/settings');
    persistentLogger.info({
        method: "GET", 
        url: "/users/settings",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    try {
        const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);
        const results = await poolQuery(`SELECT music_platform FROM ${table} WHERE email_id = ?;`, [user.email_id]);

        sendResponse(res, 200, "user's music platform preference", results[0]['music_platform']);
        cmdLogger.info('User settings retrieved successfully');
        persistentLogger.info({
            method: "GET",
            url: "/users/settings",
            status: "200",
            message: "User settings retrieved successfully",
            user_ip: req.ip
        });
    } 
    
    catch (err) {
        cmdLogger.error(`Error retreiving data from db: ${err}`);
        persistentLogger.error({
            method: "GET",
            url: "/users/settings",
            status: "400",
            message: "Error while retreiving data from db",
            user_ip: req.ip,
            error: err
        });

        sendResponse(res, 400, "DB Error");
    }
});

router.get('/send_verification_email', authMiddleware, async (req, res) => {
    cmdLogger.info('Inside GET /users/send_verification_email');   
    persistentLogger.info({
        method: "GET",
        url: "/users/send_verification_email",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);

    const token = jwt.sign({email_id: user.email_id}, process.env.EMAIL_SECRET_KEY, {expiresIn: '24h'});

    try {
        const results = await poolQuery(`SELECT verified FROM ${table} WHERE email_id = ?`, [user.email_id]);

        if (results.length == 1) {
            if (results[0]['verified']) {
                cmdLogger.warn('Email already verified');
                persistentLogger.warn({
                    method: "GET",
                    url: "/users/send_verification_email",
                    status: "400",
                    message: "Email already verified",
                    user_ip: req.ip
                });

                return sendResponse(res, 400, "Email already verified");
            }
        }
        else {
            cmdLogger.warn('Email id does not exist in db');
            persistentLogger.warn({
                method: "GET",
                url: "/users/send_verification_email",
                status: "400",
                message: "Email id does not exist in db",
                user_ip: req.ip
            });

            return sendResponse(res, 400, "Email id does not exist in db");
        }
    }
    catch (err) {
        cmdLogger.error(`Error retreiving data from db: ${err}`);
        persistentLogger.error({
            method: "GET",
            url: "/users/send_verification_email",
            status: "400",
            message: "Error retreiving data from db",
            user_ip: req.ip,
            error: err
        });
        sendResponse(res, 400, "DB Error");
    }
    
    const verificationLink = `http://localhost:3000/users/verify_email/${token}`; // Change to frontend URL

    const status = await sendEmail(user.email_id, verificationLink);
    if (status === false) {
        cmdLogger.info("Invalid email address");
        sendResponse(res, 400, "Invalid email");
    }

    else {   
        sendResponse(res, 200, "Verification email sent", verificationLink);
        cmdLogger.info('Verification email sent successfully');
        persistentLogger.info({
            method: "GET",
            url: "/users/send_verification_email",
            status: "200",
            message: "Verification email sent successfully",
            user_ip: req.ip
        });
    }
});

router.get('/verify_email/:token', async (req, res) => {
    cmdLogger.info('Inside GET /users/verify_email/:token');
    persistentLogger.info({
        method: "GET",
        url: "/users/verify_email/:token",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, process.env.EMAIL_SECRET_KEY);
        const email_id = decoded.email_id;

        const results = await poolQuery(`UPDATE ${table} SET verified = ? WHERE email_id = ?;`, [true, email_id]);

        //Send redirect page to user
        const redirectUrl = `${process.env.FRONTEND_URL}/`; // Change to frontend URL

        let html = fs.readFileSync(path.join(__dirname, '../pages/verified.html'), 'utf8'); 
        html = html.replace('{{REDIRECT_URL}}', redirectUrl);

        res.set('Content-Type', 'text/html');
        res.send(html);


        cmdLogger.info('Email verified successfully');
        persistentLogger.info({
            method: "GET",
            url: "/users/verify_email/:token",
            status: "200",
            message: "Email verified successfully",
            user_ip: req.ip
        });
    } catch (err) {
        cmdLogger.error(`Error verifying email: ${err}`);
        persistentLogger.error({
            method: "GET",
            url: "/users/verify_email/:token",
            status: "400",
            message: "Error verifying email",
            user_ip: req.ip,
            error: err
        });

        sendResponse(res, 400, "Invalid or expired token");
    }
});

router.post('/settings', authMiddleware, async (req, res) => {
    cmdLogger.info('Inside POST /users/settings');
    persistentLogger.info({
        method: "POST",
        url: "/users/settings",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    const userInfo = req.body;

    if (!userInfo.music_platform) {
        cmdLogger.warn('Request body does not contain user music paltform preference');
        persistentLogger.warn({
            method: "POST",
            url: "/users/settings",
            status: "400",
            message: "Request body does not contain user music paltform preference",
            user_ip: req.ip
        });

        sendResponse(res, 400, "Enter user music paltform preference");
    }

    try {
        const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);
        const results = await poolQuery(`UPDATE ${table} SET music_platform = ? WHERE email_id = ?;`, [userInfo.music_platform, user.email_id]);

        sendResponse(res, 200, "user's music platform preference updated", results.insertId);
        cmdLogger.info('User settings updated successfully');
        persistentLogger.info({
            method: "POST",
            url: "/users/settings",
            status: "200",
            message: "User settings updated successfully",
            user_ip: req.ip
        });
    } 
    
    catch (err) {
        cmdLogger.error(`Error retreiving data from db: ${err}`);
        persistentLogger.error({
            method: "GET",
            url: "/users/settings",
            status: "400",
            message: "Error while updating data in db",
            user_ip: req.ip,
            error: err
        });

        sendResponse(res, 400, "DB Error");
    }
});
        

// //Still template code
// router.post('/update', async (req, res) => {
//     cmdLogger.info('Inside POST /users/update');
//     persistentLogger.info({
//         method: "POST",
//         url: "/users/update",
//         status: "200",
//         message: "Request received",
//         user_ip: req.ip
//     });

//     var userInfo = req.body;

//     //If no user is logged in, request body must contain username
//     if (!req.session.user) {
//         if (!userInfo.username) {
//             cmdLogger.warn('No active session, and username not part of request body');
//             persistentLogger.warn({
//                 method: "POST",
//                 url: "/users/update",
//                 status: "400",
//                 message: "No active session and no username in request body",
//                 user_ip: req.ip
//             });

//             sendResponse(res, 400, "Please provide username");
//         }
//     }

//     if (!userInfo.old_password || !userInfo.new_password) {
//         cmdLogger.warn('Old and new passwords not part of request body');
//         persistentLogger.warn({
//             method: "POST",
//             url: "/users/update",
//             status: "400",
//             message: "Old and new passwords not part of request body",
//             user_ip: req.ip
//         });

//         sendResponse(res, 400, "Please provide old and new passwords");
//     }
//     else {
//         try {
//             const results = await poolQuery(`SELECT * FROM ${table} WHERE username = ?`, [(req.session.user.username) ? req.session.user.username : userInfo.username]);

//             if (results.length == 1) {
//                 try {
//                     const isMatch = await bcrypt.compare(userInfo.old_password, results[0]['password']);

//                     if (isMatch) {
//                         try {
//                             const hashedPassword = await bcrypt.hash(userInfo.new_password, 10);
                            
//                             try {
//                                 const results = await poolQuery(`UPDATE ${table} SET password = ? WHERE username = ?;`, [hashedPassword, (req.session.user.username) ? req.session.user.username : userInfo.username]);

//                                 //Destroy session after credential is updated
//                                 if (req.session.user) {
//                                     cmdLogger.info('Destroying user session...');
//                                     persistentLogger.info({
//                                         method: "POST",
//                                         url: "/users/update",
//                                         status: "200",
//                                         message: "Destroying user session",
//                                         user_ip: req.ip
//                                     });

//                                     req.session.destroy((err) => {
//                                         if (err) {
//                                             cmdLogger.error('Error destroying session: ', err);
//                                             persistentLogger.error({
//                                                 method: "POST",
//                                                 url: "/users/update",
//                                                 status: "400",
//                                                 message: "Error destroying user session",
//                                                 user_ip: req.ip,
//                                                 error: err
//                                             });

//                                             return sendResponse(res, 400, 'Error logging out');
//                                         }

//                                         res.clearCookie('connect.sid'); //Clear session cookie in browser
//                                         cmdLogger.info('session cookie cleared');
//                                         persistentLogger.info({
//                                             method: "GET",
//                                             url: "/users/logout",
//                                             status: "200",
//                                             message: "Session cookie cleared",
//                                             user_ip: req.ip
//                                         });
//                                     });
//                                 }
//                                 cmdLogger.info('Table data updated successfully');
//                                 persistentLogger.info({
//                                     method: "POST",
//                                     url: "/users/update",
//                                     status: "200",
//                                     message: "User data in db updated successfully",
//                                     user_ip: req.ip
//                                 });

//                                 sendResponse(res, 200, "Password updated successfully", results.insertId);
//                             } catch (err) {
//                                 cmdLogger.error('Error updated table data');
//                                 persistentLogger.error({
//                                     method: "POST",
//                                     url: "/users/update",
//                                     status: "400",
//                                     message: "Error updating user data in db",
//                                     user_ip: req.ip,
//                                     error: err
//                                 });

//                                 sendResponse(res, 400, "DB Error");
//                             }
//                         } catch (err) {
//                             cmdLogger.error('Error hashing new password');
//                             persistentLogger.error({
//                                 method: "POST",
//                                 url: "/users/update",
//                                 status: "400",
//                                 message: "Error hashing new password",
//                                 user_ip: req.ip,
//                                 error: err
//                             });

//                             sendResponse(res, 400, "bcrypt error");
//                         }
//                     }

//                     else {
//                         cmdLogger.warn('Incorrect username or password');
//                         persistentLogger.warn({
//                             method: "POST",
//                             url: "/users/update",
//                             status: "400",
//                             message: "Old password incorrect",
//                             user_ip: req.ip
//                         });

//                         sendResponse(res, 400, "Incorrect username or password");
//                     }

//                 } catch (err) {
//                     cmdLogger.error('Error comparing credentials: ', err);
//                     persistentLogger.error({
//                         method: "POST",
//                         url: "/users/update",
//                         status: "400",
//                         message: "Error verifying old password with hashed version in db",
//                         user_ip: req.ip,
//                         error: err
//                     });

//                     sendResponse(res, 400, "bcrypt error");
//                 }
//             }

//             else {
//                 cmdLogger.warn('Incorrect username or password');
//                 persistentLogger.warn({
//                     method: "POST",
//                     url: "/users/update",
//                     status: "400",
//                     message: "User with provided username does not exist",
//                     user_ip: req.ip
//                 });

//                 sendResponse(res, 400, "Incorrect username or password");
//             }
//         } catch (err) {
//             cmdLogger.error('Error retreiving data from table');
//             persistentLogger.error({
//                 method: "POST",
//                 url: "/users/update",
//                 status: "400",
//                 message: "Error retreiving data from db",
//                 user_ip: req.ip,
//                 error: err
//             });

//             sendResponse(res, 400, "DB Error");
//         }

//     }
// });

router.get('/logout', authMiddleware, async (req, res) => {
    cmdLogger.info("Inside GET /users/logout");
    persistentLogger.info({
        method: "GET",
        url: "/users/logout",
        status: "200",
        message: "Request received",
        user_ip: req.ip
    });

    persistentLogger.info({
        method: "GET",
        url: "/users/logout",
        status: "200",
        message: "Destroying jwt token",
        user_ip: req.ip
    });


    res.clearCookie('token'); //Clear token cookie in browser
    cmdLogger.info('token cookie cleared');
    persistentLogger.info({
        method: "GET",
        url: "/users/logout",
        status: "200",
        message: "Token cookie cleared",
        user_ip: req.ip
    });

    cmdLogger.info('Logged out successfully');
    persistentLogger.info({
        method: "GET",
        url: "/users/logout",
        status: "200",
        message: "Logout successful",
        user_ip: req.ip
    });

    return sendResponse(res, 200, 'Logged out successfully');
});

module.exports = router;