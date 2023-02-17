//jshint esversion:6

const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const url = "mongodb+srv://cluster0.aotc4un.mongodb.net/todolistDB?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority";
const credentials = "C:\\Users\\Baker6Romeo\\Documents\\Development\\Udemy\\WebDevBootcamp\\X509-cert-9028201481151823249.pem";

mongoose.set("strictQuery", false);
mongoose.connect(url, {
  sslKey: credentials,
  sslCert: credentials
});

const itemSchema = {
  name: String
};

const Item = new mongoose.model("Item", itemSchema);

const welcomeMsg = new Item ({
  name: "Welcome to your ToDo List!"
});

const addMsg = new Item ({
  name: "Hit the + button to add a new item."
});

const deleteMsg = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [welcomeMsg, addMsg, deleteMsg];

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {
    if(err){
      console.log(err);
    }else if ( foundItems.length < 1 ){
      Item.insertMany(defaultItems, (err, docs) => {
        if(err){
          console.log(err);
        }else{
          console.log(docs);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:listName", (req,res) => {
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, (err, foundList) => {
    if(!err){
      console.log("error");
      if (!foundList){
        console.log("Didn't find list.");
        const newList = new List({
          name: listName,
          items: defaultItems
        })
        newList.save();
        res.redirect('/' + listName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", function(req, res){

  const item = new Item({
    name: req.body.newItem
  });
  const listName = req.body.list;

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      console.log(foundList);
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post("/delete", (req, res) =>{
  const checkboxId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkboxId, (err) => {
      if(err){
        console.log(err);
      }else{
        console.log("Deletion successful.");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxId}}}, (err, oldList) => {
      if(!err) {
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Listening on port " + port);
})
