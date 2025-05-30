let express=require("express");
let route=express.Router();
let exe=require("../connection");

function checkUser(req,res,next){
    setExpiry();
    req.session.uid=1;

    if(req.session.uid){
        next();
    }
    else{
        res.redirect("/login");
    }
}

route.get("/login",async(req,res)=>{

    res.render("login.ejs");
})
route.post("/user-login",async(req,res)=>{
    let d=req.body;
    let data=await exe(`select*from users where username='${d.username}' and password='${d.password}'`);
    if(data.length!=0){
req.session.uid=data[0].id;
        res.redirect("/")
    }
    else{
res.redirect("/login");        
    }
})
route.get("/signup",async(req,res)=>{
    let users=await exe(`select username from users`);
    let obj={
        "users":users
    }
    res.render("signup.ejs",obj);
})
route.post("/create-account",async(req,res)=>{
    let d=req.body;
    let data=await exe(`insert into users(username,password) values('${d.username}','${d.password}')`);
    req.session.uid=data.insertId;
   res.redirect("/");
})
async function setExpiry(){
    let pros=await exe(`select*from product where isExpired='false'`);
   
    let ndate=new Date().getTime();
    for(let i of pros){
        let odate=new Date(i.exp_date).getTime();
        if(ndate>odate){
       await exe(`update product set isExpired='true' where id='${i.id}'`)
        }
    }
}
route.get("/",checkUser,async(req,res)=>{
   

    res.render("index.ejs");
})
route.get("/profile",checkUser,async(req,res)=>{
    let data=await exe(`select*from users where id='${req.session.uid}'`);
    let obj={
        "user":data[0]
    }
    res.render("profile.ejs",obj);
})
route.get("/logout",checkUser,async(req,res)=>{
req.session.uid=undefined;
res.redirect("/login");
})
route.post("/change-password",async(req,res)=>{
    let d=await exe(`update users set password='${req.body.password}' where id='${req.session.uid}'`);
    res.redirect("/profile");
})
route.get("/add-vendor",checkUser,async(req,res)=>{
    res.render("addvendor.ejs");
})
route.post("/save-vendor",checkUser,async(req,res)=>{
    let d=req.body;
    await exe(`insert into vendor(name,mobile) values('${d.name}','${d.mobile}')`);
    res.redirect("/add-vendor");
})
route.get("/vendor-list",checkUser,async(req,res)=>{
    let ve=await exe(`select*from vendor`);
    let obj={
        "vendor":ve
    }
    res.render("vendorlist.ejs",obj);
})
route.get("/edit-vendor/:id",checkUser,async(req,res)=>{
    let v=await exe(`select*from vendor where id='${req.params.id}'`);
    let obj={
        "vendor":v[0]
    }
    res.render("editvendor.ejs",obj)
})
route.post("/update-vendor/:id",async(req,res)=>{
    await exe(`update vendor set name='${req.body.name}',mobile='${req.body.mobile}' where id='${req.params.id}'`);
    res.redirect("/edit-vendor/"+req.params.id);
})
route.get("/category",checkUser,async(req,res)=>{
    let cats=await exe(`select*from category`);
    let obj={
        "cats":cats
    }
    res.render("category.ejs",obj);
})
route.post("/save-category",async(req,res)=>{
    let d=req.body;
    await exe(`insert into category(category,items) values('${d.category}','0')`);
    res.redirect("/category");
})
route.get("/import-new/:vid",checkUser,async(req,res)=>{
    let cats=await exe(`select*from category`);
    let obj={
        "cats":cats
    }
res.render("importnewstock.ejs",obj)
})
route.post("/import-new-stock",async(req,res)=>{
 let inv=  await exe(`insert into imports(vid,imp_date,net_ttl) value('${req.body.vid}','${new Date().toISOString().slice(0,10)}','${req.body.net_ttl}')`);
for(let i=0;i<req.body.pname.length;i++){
await exe(`insert into product(pname,cid,price,mrp,unit,stock,mgf_date,exp_date,isExpired,ttl_amt,vid,imp_id,isReturn,return_date)
    values('${req.body.pname[i]}','${req.body.cid[i]}','${req.body.price[i]}',
    '${req.body.mrp[i]}','${req.body.unit[i]}','${req.body.stock[i]}',
    '${req.body.mgf_date[i]}','${req.body.exp_date[i]}','false','${req.body.ttl_amt[i]}',
    '${req.body.vid}','${inv.insertId}','false','-')
    `)


}
   
   
    res.send(req.body)
})
route.get("/deal-history/:vid",checkUser,async(req,res)=>{
    let bills=await exe(`select*from imports where vid='${req.params.vid}' ORDER BY id DESC`);

    let obj={
        "bills":bills
    }
    res.render("dealhistory.ejs",obj);
})
route.get("/product-list/:id",checkUser,async(req,res)=>{
    let bill=await exe(`select*from imports where id='${req.params.id}'`);
    let pl=await exe(`select*,(select category from category where category.id=product.cid) as cat from product where imp_id='${req.params.id}'`);
    let obj={
        "bill":bill[0],
        "pro":pl
    }
    res.render("impproducts.ejs",obj)
})
route.get("/products",checkUser,async(req,res)=>{
    let pro=null;
let title=null;
   let cats=await exe(`select*from category`);
    if(req.query.exp){
        pro= await exe(`select*,(select category from category where category.id=product.cid) as cat, 
        (select name from vendor where vendor.id=product.vid) as vendor
            from product where isExpired='true' `);
          title="Expired Products"
       
    }
   else if(req.query.ret){
        pro= await exe(`select*,(select category from category where category.id=product.cid) as cat, 
        (select name from vendor where vendor.id=product.vid) as vendor
            from product where  isReturn='true'`);
          title="Returned Products"
       
    }
    else{
     pro= await exe(`select* ,(select category from category where category.id=product.cid) as cat, 
        (select name from vendor where vendor.id=product.vid) as vendor
        from product where isExpired='false' `);
             title="Products"
    }
    let obj={
        "pro":pro,
        "cats":cats,
        "title":title
    }
    
    res.render("products.ejs",obj)
})
route.get("/return-product/:id",checkUser,async(req,res)=>{
    let pro=await exe(`update product set stock='0',isReturn='true',return_date='${new Date().toISOString().slice(0,10)}'
    where id='${req.params.id}'
    `);
    res.redirect("/products?ret=true");
})
route.get("/import-existing/:id",checkUser,async(req,res)=>{
    let pros=await exe(`select*from product where vid='${req.params.id}'`);
    let obj={
        "pros":pros
    }
    res.render("importexisting.ejs",obj);
})
module.exports=route;