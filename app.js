var express = require("express");
const app = express();
const path = require("path");
const router = express.Router();

router.get("/", function(req,res) {
	res.sendFile(path.join(__dirname + "/test.html"));
});

router.get("/test", function(req,res) {
	res.sendFile(path.join(__dirname + "/test.html"));
});
	
app.use("/lib", express.static(__dirname + "/lib"));
app.use("/", router);

app.listen(3010);

console.log('Running at Port 3010');