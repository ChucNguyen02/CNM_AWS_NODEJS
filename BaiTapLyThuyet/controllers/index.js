const SubjectModel = require("../models/subject");
const Controller = {};

// method get sẽ thực hiện lấy tất cả các subject từ table Subject
Controller.get = async (req, res) => {
  try {
    const subjects = await SubjectModel.getSubjects();
    return res.status(200).json(subjects);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error getting subjects");
  }
};

// method getOne sẽ thực hiện lấy thông tin của subject dựa vào id
Controller.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await SubjectModel.getOneSubject(id);
    if (subject) {
      return res.status(200).json(subject);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error getting subject");
  }
};

module.exports = Controller; // ✅ QUAN TRỌNG: Phải có dòng này