import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongoConfig = process.env.MONGO_CONFIG;

await mongoose.connect(mongoConfig);

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
  }
});

const defaultItems = [{name: "Walk"}, {name: "Do some coding"}, {name: "Piano practice"}];
const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {

  let items = await Item.find();

  if (items.length === 0) {
    items = await Item.insertMany(defaultItems);
  };

  res.render("list", {listTitle: "Today", newListItems: items});

});

app.post("/", async (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({name: itemName});

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    await List.findOne({name: listName}).then(foundList => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect(`/${listName}`);
    })
  }
});

app.post("/delete", async (req, res) => {
  const deletedItem = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName === "Today") {
      await Item.findByIdAndDelete(deletedItem);
      res.redirect("/");
    } else {
      await List.findOne({name: listName}).then(result => {
        result.items.pull(deletedItem);
        result.save();
        res.redirect(`/${listName}`);
      })
    }
  });

app.get("/:list", async (req, res) => {

  const customList = req.params.list.charAt(0).toUpperCase() + req.params.list.slice(1).toLowerCase();
  const exists = await List.findOne({name: customList});

  if (exists) {
    res.render("list", {listTitle: customList, newListItems: exists.items});
  } else {
    const list = new List({
      name: customList,
      items: defaultItems
    });

    list.save();

    res.redirect(`/${customList}`);
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
