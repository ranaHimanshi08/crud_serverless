"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// code for the post request
module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const title = requestBody.title;
  const director = requestBody.director;
  const release_data = requestBody.release_data;
  const rating = requestBody.rating;

  if (
    typeof title !== "string" ||
    typeof director !== "string" ||
    typeof rating !== "number"
  ) {
    console.error("Validation Failed");
    callback(new Error("Couldn't submit movie because of validation errors."));
    return;
  }
  submitMovie(movieInfo(title, director, release_data, rating))
    .then((res) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `The Movie Was Submited`,
          data: res,
        }),
      });
    })
    .catch((err) => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable To Submit Movie With The Title ${title}`,
        }),
      });
    });
};

const submitMovie = (movie) => {
  console.log("Submiting The Movie");
  const movieInfo = {
    TableName: process.env.hr_crud_table,
    Item: movie,
  };
  return dynamoDB
    .put(movieInfo)
    .promise()
    .then((res) => movie);
};

const movieInfo = (title, director, release_data, rating) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    title: title,
    director: director,
    release_data: release_data,
    rating: rating,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};

// code for the get
module.exports.list = (event, context, callback) => {
  var result = {
    TableName: process.env.hr_crud_table,
    ProjectionExpression: "id, title, director, release_data, rating",
  };

  console.log("Scanning Movie Table.");
  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log("Scan Succeeded.");
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          Movies: data.Items,
        }),
      });
    }
  };
  dynamoDB.scan(result, onScan);
};

// get with parameter
module.exports.get = (event, context, callback) => {
  const result = {
    TableName: process.env.hr_crud_table,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDB
    .get(result)
    .promise()
    .then((result) => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch((error) => {
      console.error(error);
      callback(new Error("Couldn't fetch movies."));
      return;
    });
};
