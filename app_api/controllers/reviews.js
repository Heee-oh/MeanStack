const mongoose = require('mongoose');
const Loc = mongoose.model('Location');
const User = mongoose.model('User');

const getAuthor = async (req, res, callback) => {
  if (req.auth && req.auth.email) {
      try {
          // `exec()` 대신 `await`로 쿼리 처리
          const user = await User.findOne({ email: req.auth.email });

          if (!user) {
              return res.status(404).json({ "message": "User not found" });
          }

          // 사용자 정보를 성공적으로 찾으면 callback 호출
          callback(req, res, user.name);
      } catch (err) {
          console.log("Error finding user:", err);
          return res.status(500).json({ "message": "Database error", "error": err });
      }
  } else {
      return res.status(401).json({ "message": "Unauthorized - User not authenticated" });
  }
};


const reviewsCreate = async (req, res) => {
  console.log("reviewsCreate");

  try {
      await getAuthor(req, res, async (req, res, userName) => {
          const locationId = req.params.locationid;

          if (locationId) {
              // findById()에 await을 사용하여 비동기 작업을 처리
              const location = await Loc.findById(locationId).select('reviews');

              if (!location) {
                  return res.status(404).json({ "message": "Location not found" });
              }

              // 리뷰를 추가하는 로직을 doAddReview로 전달
              doAddReview(req, res, location, userName);
          } else {
              return res.status(404).json({ "message": "Location not found" });
          }
      });
  } catch (err) {
      console.error("Error in reviewsCreate:", err);
      return res.status(500).json({ "message": "Internal server error", "error": err });
  }
};

const reviewsReadOne = async (req, res) => {
  try {
    const location = await Loc.findById(req.params.locationid).select('name reviews').exec();
    if  (!location) {
      return res
        .status(404)
        .json({ "message": "location not found" });
    }
    if (location.reviews && location.reviews.length > 0) {
      const review = location.reviews.id(req.params.reviewid);
      if (!review) {
        return res
          .status(404)
          .json({ "message": "review not found" });
      }
      const response = {
        location: {
          name: location.name,
          id: req.params.locationid
        },
        review
      };
      return res
        .status(200)
        .json(response);
    } else {
      return res
        .status(404)
        .json({ "message": "No reviews found" });
    }
  } catch (err) {
    return res
      .status(400)
      .json(err);
  }
};

const doAddReview = async (req, res, location, author) => {
  if (!location) {  
      return res.status(404).json({ "message": "Location not found" });
  }

  const { rating, reviewText } = req.body;
  location.reviews.push({
      author,
      rating,
      reviewText
  });

  try {
      // `save()`에 await을 사용하여 비동기 처리
      const savedLocation = await location.save();
      
      // 평균 평점 업데이트
      updateAverageRating(savedLocation._id);

      // 방금 추가된 리뷰 객체 반환
      let thisReview = savedLocation.reviews[savedLocation.reviews.length - 1];
      return res.status(201).json(thisReview);
  } catch (err) {
      console.error("Error saving review:", err);
      return res.status(400).json(err);
  }
};

const doSetAverageRating = async (location) => {
  if (location.reviews && location.reviews.length > 0) {
    const count = location.reviews.length;
    const total = location.reviews.reduce((acc, {rating}) => {
      return acc + rating;
    }, 0);

    location.rating = parseInt(total / count, 10);
    try {
      await location.save();
      console.log(`Average rating updated to ${location.rating}`);
    } catch (err) {
      console.log(err);
    }
  }
};

const updateAverageRating = async (locationId) => {
  try {
    const location = await Loc.findById(locationId).select('rating reviews').exec();
    if (location) {
      await doSetAverageRating(location);
    }
  } catch (err) {
    console.log(err);
  }
};


const reviewsUpdateOne = async (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    return res.status(404).json({ "message": "Not found, locationid and reviewid are both required" });
  }

  try {
    const location = await Loc.findById(req.params.locationid).select('reviews').exec();
    if (!location) {
      return res.status(404).json({ "message": "Location not found" });
    }

    if (location.reviews && location.reviews.length > 0) {
      const thisReview = location.reviews.id(req.params.reviewid);
      if (!thisReview) {
        return res.status(404).json({ "message": "Review not found" });
      }

      thisReview.author = req.body.author;
      thisReview.rating = req.body.rating;
      thisReview.reviewText = req.body.reviewText;

      const updatedLocation = await location.save();
      await updateAverageRating(updatedLocation._id);
      return res.status(200).json(thisReview);
    } else {
      return res.status(404).json({ "message": "No review to update" });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};


const reviewsDeleteOne = async (req, res) => {
  const { locationid, reviewid } = req.params;
  if (!locationid || !reviewid) {
    return res.status(404).json({ 'message': 'Not found, locationid and reviewid are both required' });
  }

  try {
    const location = await Loc.findById(locationid).select('reviews').exec();
    if (!location) {
      return res.status(404).json({ 'message': 'Location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const review = location.reviews.id(reviewid);
      if (!review) {
        return res.status(404).json({ 'message': 'Review not found' });
      }

      review.deleteOne();
      await location.save();
      await updateAverageRating(location._id);
      return res.status(204).json(null);

    } else {
      return res.status(404).json({ 'message': 'No Review to delete' });
    }
  } catch (err) {
    return res.status(204).json(err);
  }
};
module.exports = {
  reviewsCreate,
  reviewsReadOne,
  reviewsUpdateOne,
  reviewsDeleteOne
};