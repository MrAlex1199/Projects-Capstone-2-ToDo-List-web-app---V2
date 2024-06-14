import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from 'lodash';

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });

const atlasConnectionString = "mongodb+srv://ZZ:ZZ1ZZ@clusterzero.jvgkprk.mongodb.net/todolistDB";

mongoose.connect(atlasConnectionString, { useNewUrlParser: true });

const itemschema =  {
    name: String,
};

const Item = mongoose.model("Item", itemschema);

const Item1 = new Item ({name: "Welcome to your todolist",});
const Item2 = new Item ({name: "<--- Hit this button to add a new item.",});
const Item3 = new Item ({name: "<--- Hit this to delete an item.",});

const listSchema = {
    name: String,
    items: [itemschema]
};

const List = mongoose.model("List", listSchema);

const defaultItems = [Item1, Item2, Item3]

app.get('/', (req, res) => {
    Item.find({})
        .exec()
        .then(foundItem => {
            if (foundItem.length === 0) {
                Item.insertMany(defaultItems)
                .then(() => {
                    console.log("Successfully saved all the item to todolistDB");
                })
                .catch((err) => {
                console.error(err);
            });
            res.redirect("/");
            } else {
                const data = { 
                    listTitle: "Today",
                    newListItems: foundItem,
                };
                res.render('partials/list.ejs', data); 
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    try {
        const foundList = await List.findOne({ name: customListName });
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems 
            });
            await list.save();
            res.redirect("/" + customListName);
        } else {
            res.render('partials/list.ejs', { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.error("Error:", err);
    }
});

app.post('/delete', async (req, res) => {
    const CheckboxItemID = req.body.Checkbox2;
    const listName = req.body.listname;
    try {
        if (listName === "Today") {
            await Item.findByIdAndRemove(CheckboxItemID).exec();
            console.log("Delete is successful");
            res.redirect("/");
        } else {
            await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: CheckboxItemID } } });
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log("Delete not successful");
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/', async (req, res) => {
    const stringDayContent = req.body['TodayDaylsit'];
    const ListWorkTodo = req.body['list'];

    const dayitem = new Item({
        name: stringDayContent
    });

    if (ListWorkTodo === "Today") {
        await dayitem.save();
        res.redirect("/");
    } else {
        try {
            const foundList = await List.findOne({ name: ListWorkTodo });
            foundList.items.push(dayitem);
            await foundList.save();
            res.redirect("/" + ListWorkTodo);
        } catch (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
        }
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

    