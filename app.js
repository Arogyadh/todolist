const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://arogyadhdl:iKQkRBq1lGuRnBGr@cluster0.4jcjcke.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to this to-do list.",
});
const item2 = new Item({
  name: "Use the + button to add.",
});
const item3 = new Item({
  name: "<-- Hit this to delete.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully added default items to DB.");
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/favicon.ico", (req, res) => {
  // You can send an empty response or serve your favicon file here
  // For example:
  // res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});
// This code leads to race condition and make duplicacy errors in the database.
// app.get("/:customListName", function (req, res) {
//   customListName = req.params.customListName;

//   List.findOne({ name: customListName })
//     .then((foundList) => {
//       if (!foundList) {
//         //Create a new list
//         const list = new List({
//           name: customListName,
//           items: defaultItems,
//         });
//         list.save();
//         res.redirect("/" + customListName);
//       } else {
//         //Show an exisiting list
//         res.render("list", {
//           listTitle: foundList.name,
//           newListItems: foundList.items,
//         });
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// });
app.get("/:customListName", function (req, res) {
  customListName = _.capitalize(req.params.customListName);

  // Check if a list with the same name already exists
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // Create a new list only if it doesn't exist
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        // Save the new list to the database
        list
          .save()
          .then(() => {
            res.redirect("/" + customListName);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList
          .save()
          .then(() => {
            res.redirect("/" + listName);
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then((checkedItemId) => {
        console.log(
          "Successfully deleted the item with name " +
            "'" +
            checkedItemId.name +
            "'" +
            " Id : " +
            "'" +
            checkedItemId._id +
            "'"
        );
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT;

app.listen(PORT, function () {
  console.log("Server started on port " + PORT);
});
