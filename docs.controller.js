
const fs = require("fs");
const db = require("../models");
const User = db.user;

exports.getList = async (req, res) => {
  try {
    let listData = await fs.readFileSync("e://data/list.json", {
      encoding: "utf8",
      flag: "r",
    });
    res.status(200).send(listData);
  } catch (err) {
    console.log("------- list json file read error ------", err);
    return res.status(401).send({ message: "list.json file read error." });
  }
};

exports.getLang = async (req, res) => {
  let docs = [],
    indexData = [],
    localStorageData = [];
  try {
    const allowedDocsdata = await User.find({ _id: req.userId }).select(
      "allowedDocs"
    );
    const { allowedDocs } = allowedDocsdata[0];

    if (allowedDocs.length > 0) {
      let docsData = await fs.readFileSync("e://data/docs.json", {
        encoding: "utf8",
        flag: "r",
      });
      docsData = JSON.parse(docsData);
      Promise.all([
        allowedDocs.map(async (doc) => {
          let _docData = await docsData.filter((d) => d.value === Number(doc));
          if (_docData.length > 0) {
            docs.push(_docData[0]);
            const filename = _docData[0].key + ".json";
            try {
              let _indexData = fs.readFileSync("e://data/indexDB/" + filename, {
                encoding: "utf8",
                flag: "r",
              });
              let _localStorage = fs.readFileSync(
                "e://data/localStorage/" + filename,
                {
                  encoding: "utf8",
                  flag: "r",
                }
              );
              localStorageData.push({
                key: _docData[0].key,
                value: _localStorage,
              });
              indexData.push({ key: _docData[0].key, value: _indexData });
            } catch (err) {
              console.log("------- err doc file read error", err);
              return res
                .status(401)
                .send({ message: "docs.json file read error." });
            }
          }
        })
      ]).then(() => {
        res.status(200).send({
          message: "Docs data has loaded successfully!",
          indexData,
          localStorageData,
          docs,
        });
      });
    } else {
      res.status(200).send({ message: "No allowed doc data!" });
    }
  } catch (e) {
    console.log("----- get lang -------", e);
    return res.status(401).send({ message: e });
  }

  // const temp = JSON.parse(indexData);
  // const localTemp = JSON.parse(localStorage);
  // res.status(200).send({
  //   indexData: temp,
  //   localStorage: localTemp,
  //   docs: "",
  // });
};

exports.enableLang = async (req, res) => {
  const { langItem } = req.body;
  try {
    const data = await User.find({ _id: req.userId }).select("allowedDocs");
    const { allowedDocs } = data[0];
    if (!allowedDocs.includes(langItem)) {
      User.updateOne(
        { _id: req.userId },
        {
          $push: {
            allowedDocs: langItem,
          },
        }
      ).exec((err, result) => {
        if (err) {
          console.log("--------- enable lang ---------", err);
          res.status(500).send({ message: err });
          return;
        }
        if (!result) {
          return res.status(404).send({ message: "User Not found." });
        }
        res.status(200).send({
          message: "New item has enabled Successfully!",
          status: true,
        });
      });
    } else {
      res
        .status(200)
        .send({ message: "New item has already enabled!", status: true });
    }
  } catch (err) {
    console.log("-------- err ------", err);
    return res.status(401).send({ message: "docs.json file read error." });
  }
};
