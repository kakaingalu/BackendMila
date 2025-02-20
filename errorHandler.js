// errorHandler.js
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ 
      message: err.message, 
      details: err.details 
    });
  }
  
  export default errorHandler;
  