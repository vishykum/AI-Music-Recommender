const sendResponse = (res, status, message, data = null) =>
    {
        var responseJson = {};
    
        responseJson.status = status;
        responseJson.message = message;
    
        if (data) responseJson.data = data;
    
        res.status(status).json(responseJson);
    }
    
    module.exports = sendResponse;