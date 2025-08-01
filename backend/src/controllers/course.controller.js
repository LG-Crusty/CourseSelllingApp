import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Course } from "../models/course.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { pathfinder } from "../utils/path.finder.js";
import { Lesson } from "../models/courseData.model.js";
import { deleteAllFilesInFolder } from "../utils/clearFolder.js";

const createcourse = asyncHandler(async (req, res) => {
  const { courseName, category, instructor, description, price, title } =
    req.body;

  const files = req.files.thumbnail;
  const { path } = files[0];

  // upload data on cloudinary
  const data = await uploadonCloudinary(path);
  const { url } = data;

  //inserting data in db
  const insertinDb = await Course.create({
    title,
    courseName,
    category,
    instructor,
    courseDescription: description,
    price,
    thumbnail: url,
  });

  if (!insertinDb) {
    throw new ApiError(500, "failed to create course");
  }
  const createdCourse = await Course.findById(insertinDb._id);
  if (!createdCourse) {
    throw new ApiError(500, "no such course found");
  }

  //sending response to user
  res
    .status(200)
    .json(
      new ApiResponse(200, "successfully created the course", createdCourse)
    );
});

const uploadlessons = asyncHandler(async (req, res) => {
  //fetching data from body
  //fetching data from files
  //creating data in the db
  //checking for edge cases
  //sending data back to the user/client

  const { title, courseRef, description } = req.body;

  //rather destructuring check for key's
  const keys = ["images", "videos", "notes"];

  //iterate keys and punch value of present keys in the object or something
  const arrayToUpload = [];
  keys.map((key) => {
    if (req.files[key]) {
      arrayToUpload.push(pathfinder(req.files[key]));
    }
  });

  const uploadedData = arrayToUpload.map((e) => {
    return e.map((e) => {
      return uploadonCloudinary(e);
    });
  });

  const gainedValue = await Promise.all(uploadedData.flat());

  const videosArr = [];
  const imagesArr = [];
  const notesArr = [];

  gainedValue.map((e) => {
    switch (e.resource_type) {
      case "video":
        const videoObj = {
          title: e.original_filename,
          url: e.secure_url,
        };
        videosArr.push(videoObj);
        break;
      case "image":
        const obj = {
          title: "",
          url: "",
        };
        if (["jpg", "png", "jpeg"].includes(e.format)) {
          obj.title = e.original_filename;
          obj.url = e.secure_url;
          imagesArr.push(obj);
        } else {
          obj.title = e.original_filename;
          obj.url = e.secure_url;
          notesArr.push(obj);
        }
        break;
      default:
        break;
    }
  });

  //clear out the public => temp folder
  deleteAllFilesInFolder("./public/temp");

  const createLesson = await Lesson.create({
    title,
    courseRef,
    description,
    video: videosArr,
    image: imagesArr,
    notes: notesArr,
  });
  if (!createLesson) {
    throw new ApiError(500, "Error while creating database document");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "lesson successfully created", createLesson));
});

const updatelessons = asyncHandler(async (req, res) => {});

//controller for getting courses
const getCourses = asyncHandler(async (req, res) => {
  //query coursemodel in db and send all the course data to frontend(will check on the choice though)
  const token = req.cookies?.accessToken;

  const data = await Course.find({});

  if (!data) {
    throw new ApiError(500, "Error while fetching data");
  }
  res
    .status(200)
    .json(new ApiResponse(200, "data successfully received", data));
});

//controller for getting both course and lessons
const getCourseAndLessons = asyncHandler(async (req, res) => {
  //get query data from queries
  const val = JSON.parse(JSON.stringify(req.query));

  // check for the valid id  it exists or not
  if (val) {
    const data = await Course.findById(val.id);

    if (!data) {
      throw new ApiError(400, "invalid courseId");
    }

    //get data from lesson model
    const dataLessson = await Lesson.find({ courseRef: val.id });

    if (!dataLessson) {
      throw new ApiError(500, "error while fetching lesson data");
    }

    // make object out of both the data from course and lesson
    const datatoSend = {
      course: data,
      lessons: dataLessson,
    };

    // sending this data to the frontend
    res
      .status(200)
      .json(new ApiResponse(200, "data successfully received", datatoSend));
  }
});

const isSubscribed = asyncHandler(async (req, res) => {
  //fetch the student id and courseId from the frontend
  const { studentId, courseId } = req.body;

  //query the model and check for the studentId
  const isPresent = await Course.findOne({
    _id: courseId,
    students: studentId,
  });

  if (!isPresent) {
    throw new ApiError(400, "student not found");
  }

  //send data to the frontend
  res.status(200).json(200, "Student is present", isPresent);
});
export {
  createcourse,
  uploadlessons,
  updatelessons,
  getCourses,
  getCourseAndLessons,
  isSubscribed,
};
