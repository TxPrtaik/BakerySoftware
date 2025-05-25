
let util=require("util");
let mysql=require("mysql")
let con=mysql.createConnection({
    "host":"bvm2l1xdgsunv7hqfwr3-mysql.services.clever-cloud.com",
    "user":"u935cpdq6eqfjvzh",
    "password":"uccL6D2DgluZOvcP2jpS",
    "database":"bvm2l1xdgsunv7hqfwr3"
})
module.exports=util.promisify(con.query).bind(con);
