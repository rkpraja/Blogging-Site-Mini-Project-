const blogModel = require("../Models/blogModel");
const authorModel = require("../Models/authorModel");

const createBlog = async function (req, res) {
  try {
    const data = req.body;

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "All Keys are Mandatory" });
    }

    const { title, body, authorId, category } = data;

    if (!isValid(title)) {
      return res.status(400).send({ status: false, msg: "title is required" });
    }

    if (!isValid(body)) {
      return res.status(400).send({ status: false, msg: "body is required" });
    }

    if (!isValid(authorId)) {
      return res
        .status(400)
        .send({ status: false, msg: "authorId is required" });
    }

    if (!isValidObjectId(authorId)) {
      return res
        .status(400)
        .send({ status: false, msg: `${authorId} is not a valid authorId` });
    }

    if (!isValid(category)) {
      return res
        .status(400)
        .send({ status: false, msg: "category title is required" });
    }

    const author = await authorModel.findById(authorId);
    if (!author) {
      return res
        .status(400)
        .send({ status: false, msg: "author does not exist" });
    }

    const savedData = await blogModel.create(data);
    res.status(201).send({ msg: savedData });
  } catch (err) {
    return res.status(500).send({ status: false, err: err.message });
  }
};

const getBlogs = async function (req, res) {
  try {
    let data = req.query;
    let getBlogs = await blogModel
      .find({ isPublished: true, isDeleted: false, ...data })
      .populate("authorId");
    res.status(201).send({ msg: getBlogs });
    if (getBlogs.length == 0)
      return res.status(404).send({ msg: "no such blog exist" });
  } catch (error) {
    res.status(500).send({ status: false, err: error.message });
  }
};

const putBlog = async function (req, res) {
  try {
    let data = req.body;
    let authorId = req.query.authorId;
    let id = req.params.blogId;

    if (!id) {
      return res.status(400).send({
        status: false,
        msg: "blogId must be present in request param ",
      });
    }

    let blogFound = await blogModel.findOne({ _id: id });

    if (!blogFound) {
      return res
        .status(400)
        .send({ status: false, msg: "No Blog with this Id exist" });
    }

    let updatedBlog = await blogModel.findOneAndUpdate(
      { _id: id, authorId: authorId },
      {
        $addToSet: { tags: data.tags, subcategory: data.subcategory },
        $set: { title: data.title, body: data.body, category: data.category },
      },
      { new: true, upsert: true }
    );

    if (updatedBlog) {
      return res.status(200).send({ status: true, data: updatedBlog });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const deleteBlog = async function (req, res) {
  try {
    let blog = req.params.blogId;
    let authorId = req.query.authorId;

    if (!blog) {
      return res.status(400).send({
        status: false,
        msg: "blogId must be present in order to delete it",
      });
    }

    let blogFound = await blogModel.findOne({ _id: blog });

    if (!blogFound) {
      return res.status(400).send({
        status: false,
        msg: "No blog exists bearing this Blog Id, please provide another one",
      });
    }

    if (blogFound.isdeleted === true) {
      return res
        .status(404)
        .send({ status: false, msg: "this blog has been deleted by You" });
    }

    let deletedBlog = await blogModel.findOneAndUpdate(
      { _id: blog },
      { $set: { isdeleted: true }, deletedAt: Date.now() },
      { new: true }
    );

    if (deletedBlog) {
      return res.status(200).send({
        status: true,
        msg: "Your Blog has been successfully deleted",
        deletedData: deletedBlog,
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

module.exports = { createBlog, getBlogs, putBlog, deleteBlog };
