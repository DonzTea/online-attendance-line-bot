const mongoose = require('mongoose');
const { formatStringToTitleCase } = require('../utils/string.js');

// schema
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: true,
    get: formatStringToTitleCase,
  },
  formattedDate: {
    type: String,
    lowercase: true,
    required: true,
  },
  userId: {
    type: String,
    lowercase: true,
    required: true,
  },
});

// model
const Subject = mongoose.model('Subject', subjectSchema);

// methods
const createSubject = async (name, formattedDate, userId) => {
  try {
    const subject = await new Subject({ name, formattedDate, userId }).save();
    return subject;
  } catch (error) {
    console.error(error);
  }
};

const getSubjectsByDate = async (formattedDate) => {
  try {
    const subjects = await Subject.find({
      formattedDate,
    });
    return subjects;
  } catch (error) {
    console.error(error);
  }
};

const getSubject = async (name, formattedDate) => {
  try {
    const subjects = await Subject.findOne({ name, formattedDate });
    return subjects;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  createSubject,
  getSubjectsByDate,
  getSubject,
};
