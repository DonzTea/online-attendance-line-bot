const mongoose = require('mongoose');
const { getSubjectsByDate, getSubject } = require('./subject.js');
const { formatStringToTitleCase } = require('../utils/string.js');

// schema
const attendenceSchema = new mongoose.Schema({
  userName: {
    type: String,
    lowercase: true,
    required: true,
    get: formatStringToTitleCase,
  },
  userId: {
    type: String,
    lowercase: true,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Subject',
  },
});

// model
const Attendance = mongoose.model('Attendance', attendenceSchema);

// methods
const createAttendance = async (userName, userId, subject) => {
  try {
    const attendance = await new Attendance({
      userName,
      userId,
      subject: subject,
    }).save();
    return attendance;
  } catch (error) {
    console.error(error);
  }
};

const getAttendancesByDate = async (formattedDate) => {
  try {
    const subjects = await getSubjectsByDate(formattedDate);
    if (subjects.length > 0) {
      const attendances = new Map();
      await Promise.all(
        subjects.map(async (subject) => {
          const students = await Attendance.find({
            subject: subject._id,
          }).populate('subject');
          attendances.set(subject.name, students);
        }),
      );
      const sortedAttendancesByDate = new Map(
        [...attendances.entries()].sort((a, b) => a[0] - b[0]),
      );
      return sortedAttendancesByDate;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
};

const getAttendancesBySubject = async (subjectName, formattedDate) => {
  try {
    const subject = await getSubject(subjectName, formattedDate);
    if (subject) {
      const attendances = Attendance.find({ subject: subject._id });
      return attendances;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
};

const getAttendance = async (userId, subjectId) => {
  try {
    const attendance = Attendance.findOne({ userId, subject: subjectId });
    return attendance;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  createAttendance,
  getAttendancesByDate,
  getAttendancesBySubject,
  getAttendance,
};
