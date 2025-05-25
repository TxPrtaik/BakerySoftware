let express=require("express");
let upload=require("express-fileupload");
let session=require("express-session");
let mysql=require("mysql");
let bodyparser=require("body-parser");
let app=express();
let user=require("./routes/user");
app.use(express.static("public/"));
app.use(upload());
app.use(bodyparser.urlencoded({extended:true}));
app.use(session({
    "resave":true,
    "secret":"pratik123",
    "saveUninitialized":true
}))
app.use("/",user)

app.listen(1000);