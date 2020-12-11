const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const { nanoid } = require("nanoid");
const monk = require("monk");

require('dotenv').config();

// TODO:  double check using MONGOURI properly
const db = monk(process.env.MONGO_URI);
const urls = db.get('urls');
urls.createIndex('name');
// TODO:  double check using MONGOURI properly, see .env for possible changes


const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

// app.get('/url/:id', (req,res) => {
//     res.json({
//     //    TODO: get a short url by id
//     })
// });

// app.get('/:id', (req,res) => {
//     res.json({
//   //    TODO: redirect to a url
//     })
// });

const schema = yup.object().shape({
  slug: yup
    .string()
    .trim()
    .matches(/[\w\-]/i),
  url: yup.string().trim().url().required(),
});

app.post("/url", async (req, res, next) => {
  let { slug, url } = req.body;
  try {
    await schema.validate({
      slug,
      url,
    });
    if (!slug) {
      slug = nanoid(7);
    }
    slug = slug.toLowerCase();
    res.json({
      slug,
      url,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
