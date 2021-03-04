const Client = require('@line/bot-sdk').Client;

const {
  commands,
  showAvailableCommands,
  getSimilarCommands,
} = require('../utils/commands.js');

const {
  getFormattedDateOfThisDay,
  getFormattedDateOfYesterday,
  getLastDateOfMonth,
} = require('../utils/date.js');

const { createSubject, getSubject } = require('../models/subject.js');

const {
  createAttendance,
  getAttendancesByDate,
  getAttendancesBySubject,
  getAttendance,
} = require('../models/attendance.js');

const { formatStringToTitleCase } = require('../utils/string.js');

require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

const handleRequest = async (event) => {
  console.log(event);
  const { source, message } = event;
  const userId = source.userId;
  let statusCode = 200;

  // if bot invited to a group or multichat
  if (event.type === 'join') {
    if (source.type === 'room' || source.type === 'group') {
      await replyMessage(
        event,
        'Halo, saya bot yang akan membantu melakukan pencatatan absen supaya menghindari terjadinya kerusuhan absen. ' +
          'Sekarang kalian bisa tenang tanpa gelisah karena takut nama kalian hilang dari absen karena kerusuhan.\n\n' +
          'Beri perintah /bantuan untuk melihat daftar perintah yang dapat digunakan.',
      );
    }
  }

  // if user send message
  if (event.type === 'message') {
    // cleaning user's message
    const cleanMessage = message.text.toLowerCase().trim().replace(/\s+/g, ' ');

    // analyze whether the message contains bot commands
    let matchedCommand = null;
    if (cleanMessage.startsWith('/')) {
      const commandDetailName = cleanMessage.split(' ').shift();
      for (const commandName of Object.keys(commands)) {
        if (commandDetailName === commandName) {
          matchedCommand = commandName;
          break;
        }
      }
    }

    // give respond according to user's command
    if (message.type === 'text' && matchedCommand !== null) {
      // if user's command === '/keluar'
      if (matchedCommand === '/keluar') {
        if (source.type === 'room') {
          client.leaveRoom(source.roomId);
        } else if (source.type === 'group') {
          client.leaveGroup(source.groupId);
        } else {
          await replyMessage(
            event,
            'Perintah /keluar hanya dapat digunakan pada grup dan multichat.',
          );
        }
      }

      // if user's command === '/bantuan'
      if (matchedCommand === '/bantuan') {
        // show commands list
        await replyMessage(event, showAvailableCommands());
      }

      // get user's command detail
      let commandDetail = cleanMessage.replace(matchedCommand, '').trim();

      // if user's command === '/catat'
      if (matchedCommand === '/catat') {
        if (commandDetail.startsWith('absen matkul ')) {
          const subjectName = commandDetail.replace('absen matkul ', '');
          const subject = await createSubject(
            subjectName,
            `${getFormattedDateOfThisDay()}`,
            userId,
          );
          await replyMessage(
            event,
            `Pencatatan absen matkul ${subject.name} tanggal ${subject.formattedDate} dimulai.`,
          );
        } else {
          await replyMessage(event, getSimilarCommands(matchedCommand));
        }
      }

      // if user's command === '/hadir'
      if (matchedCommand === '/hadir') {
        let [userName, subjectName] = [null, null];
        const splittedRequest = commandDetail
          .split(',')
          .map((input) => input.trim());

        for (const input of splittedRequest) {
          if (input.startsWith('nama')) {
            userName = input.split(':').pop().trim();
          } else if (input.startsWith('matkul')) {
            subjectName = input.split(':').pop().trim();
          }
        }

        if (userName && subjectName) {
          // check if subject exist
          const subject = await getSubject(
            subjectName,
            getFormattedDateOfThisDay(),
          );
          if (subject) {
            // if user have submit a presence in the subject before
            const attendance = await getAttendance(userId, subject._id);
            if (attendance) {
              // if user cheating the attendance
              if (
                userName.toLowerCase() !== attendance.userName.toLowerCase()
              ) {
                await replyMessage(
                  event,
                  `Kamu telah tercatat hadir di mata kuliah ${subject.name} pada tanggal ${subject.formattedDate} dengan nama ${attendance.userName}.`,
                );
              } else {
                // if user have double attendance request
                await replyMessage(
                  event,
                  `${attendance.userName} sudah tercatat hadir di mata kuliah ${subject.name} pada tanggal ${subject.formattedDate}.`,
                );
              }
            } else {
              // record the presence of user
              const createdAttendance = await createAttendance(
                userName,
                userId,
                subject._id,
              );
              await replyMessage(
                event,
                `Dimengerti! ${createdAttendance.userName} telah dicatat hadir pada matkul ${subject.name}.`,
              );
            }
          } else {
            await replyMessage(
              event,
              `Catatan absen mata kuliah ${formatStringToTitleCase(
                subjectName,
              )} pada hari ini tidak ditemukan.\n\n` +
                `Untuk melakukan absen pada matkul ${formatStringToTitleCase(
                  subjectName,
                )}, kamu harus buat catatan absen terlebih dulu dengan format sebagai berikut:\n\n` +
                '/catat ' +
                commands['/catat'][0].format,
            );
          }
        } else {
          await replyMessage(event, getSimilarCommands(matchedCommand));
        }
      }

      // if user's command === '/bantuan'
      if (matchedCommand === '/lihat') {
        if (commandDetail.startsWith('daftar absen ')) {
          commandDetail = commandDetail.replace('daftar absen ', '');
          if (commandDetail.startsWith('hari ini')) {
            // fetch data
            const attendances = await getAttendancesByDate(
              getFormattedDateOfThisDay(),
            );

            if (attendances) {
              let message = `Daftar absen tanggal ${getFormattedDateOfThisDay()} :\n`;
              for (const [subjectName, students] of attendances) {
                message += `\nMata kuliah ${subjectName} :\n`;
                for (const [index, student] of students.entries()) {
                  message += `${index + 1}. ${student.userName}\n`;
                }
              }
              await replyMessage(event, message);
            } else {
              await replyMessage(
                event,
                `Daftar absen pada hari ini tidak ditemukan.`,
              );
            }
          } else if (commandDetail.startsWith('kemarin')) {
            // fetch
            const attendances = await getAttendancesByDate(
              getFormattedDateOfYesterday(),
            );

            if (attendances) {
              let message = `Daftar absen tanggal ${getFormattedDateOfYesterday()} :\n`;
              for (const [subjectName, students] of attendances) {
                message += `\nMata kuliah ${subjectName} :\n`;
                for (const [index, student] of students.entries()) {
                  message += `${index + 1}. ${student.userName}\n`;
                }
              }
              await replyMessage(event, message);
            } else {
              await replyMessage(
                event,
                `Daftar absen pada hari kemarin tidak ditemukan.`,
              );
            }
          } else if (commandDetail.startsWith('tanggal ')) {
            commandDetail = commandDetail.replace('tanggal ', '');
            let [date, month, year] = commandDetail.split('-');
            [date, month, year] = [
              parseInt(date),
              parseInt(month),
              parseInt(year.slice(0, 4)),
            ];

            if (!isNaN(date) && !isNaN(month) && !isNaN(year)) {
              const lastDateOfMonth = getLastDateOfMonth(month, year);
              if (date > lastDateOfMonth) {
                await replyMessage(
                  event,
                  'Tanggal yang kamu masukkan tidak valid.',
                );
              }

              if (month > 12) {
                await replyMessage(
                  event,
                  'Bulan yang kamu masukkan tidak valid.',
                );
              }

              if (year < 2000 || year > new Date().getFullYear()) {
                await replyMessage(
                  event,
                  'Tahun yang kamu masukkan tidak valid.',
                );
              }

              [date, month, year] = [
                String(date).padStart(2, '0'),
                String(month).padStart(2, '0'),
                String(year),
              ];

              // fetch
              const formattedDate = `${date}-${month}-${year}`;
              const attendances = await getAttendancesByDate(formattedDate);

              if (attendances) {
                let message = `Daftar absen tanggal ${formattedDate} :\n`;
                for (const [subjectName, students] of attendances) {
                  message += `\nMata kuliah ${subjectName} :\n`;
                  for (const [index, student] of students.entries()) {
                    message += `${index + 1}. ${student.userName}\n`;
                  }
                }
                await replyMessage(event, message);
              } else {
                await replyMessage(
                  event,
                  `Daftar absen pada tanggal ${formattedDate} tidak ditemukan.`,
                );
              }
            } else {
              await replyMessage(event, getSimilarCommands(matchedCommand));
            }
          } else if (commandDetail.startsWith('matkul ')) {
            commandDetail = commandDetail.replace('matkul ', '');
            if (commandDetail.includes(' hari ini')) {
              const startIndexOfStringRemoval = commandDetail.indexOf(
                ' hari ini',
              );
              const subjectName = commandDetail.slice(
                0,
                startIndexOfStringRemoval,
              );
              const formattedDateOfThisDay = getFormattedDateOfThisDay();

              // fetch
              const attendances = await getAttendancesBySubject(
                subjectName.toLowerCase(),
                getFormattedDateOfThisDay(),
              );

              if (attendances) {
                let message = `Daftar absen mata kuliah ${formatStringToTitleCase(
                  subjectName,
                )} tanggal ${getFormattedDateOfThisDay()} :\n\n`;
                for (const [index, attendance] of attendances.entries()) {
                  message += `${index + 1}. ${attendance.userName}\n`;
                }
                await replyMessage(event, message);
              } else {
                await replyMessage(
                  event,
                  `Daftar absen mata kuliah ${formatStringToTitleCase(
                    subjectName,
                  )} pada hari ini tidak ditemukan.`,
                );
              }

              await replyMessage(
                event,
                `Daftar absen matkul ${subjectName} tanggal ${formattedDateOfThisDay} :`,
              );
            } else if (commandDetail.includes(' kemarin')) {
              const startIndexOfStringRemoval = commandDetail.indexOf(
                ' kemarin',
              );
              const subjectName = commandDetail.slice(
                0,
                startIndexOfStringRemoval,
              );
              const formattedDateOfYesterday = getFormattedDateOfYesterday();

              // fetch
              const attendances = await getAttendancesBySubject(
                subjectName.toLowerCase(),
                getFormattedDateOfYesterday(),
              );

              if (attendances) {
                let message = `Daftar absen mata kuliah ${formatStringToTitleCase(
                  subjectName,
                )} tanggal ${getFormattedDateOfYesterday()} :\n\n`;
                for (const [index, attendance] of attendances.entries()) {
                  message += `${index + 1}. ${attendance.userName}\n`;
                }
                await replyMessage(event, message);
              } else {
                await replyMessage(
                  event,
                  `Daftar absen mata kuliah ${formatStringToTitleCase(
                    subjectName,
                  )} pada hari kemarin tidak ditemukan.`,
                );
              }

              await replyMessage(
                event,
                `Daftar absen matkul ${subjectName} tanggal ${formattedDateOfYesterday} :`,
              );
            } else if (commandDetail.includes(' tanggal ')) {
              let [subjectName, formattedDate] = commandDetail.split(
                ' tanggal ',
              );
              formattedDate = formattedDate.split(' ').shift();
              let [date, month, year] = formattedDate.split('-');
              [date, month, year] = [
                parseInt(date),
                parseInt(month),
                parseInt(year.slice(0, 4)),
              ];

              if (!isNaN(date) && !isNaN(month) && !isNaN(year)) {
                const lastDateOfMonth = getLastDateOfMonth(month, year);
                if (date > lastDateOfMonth) {
                  await replyMessage(
                    event,
                    'Tanggal yang kamu masukkan tidak valid.',
                  );
                }

                if (month > 12) {
                  await replyMessage(
                    event,
                    'Bulan yang kamu masukkan tidak valid.',
                  );
                }

                if (year < 2000 || year > new Date().getFullYear()) {
                  await replyMessage(
                    event,
                    'Tahun yang kamu masukkan tidak valid.',
                  );
                }

                [date, month, year] = [
                  String(date).padStart(2, '0'),
                  String(month).padStart(2, '0'),
                  String(year),
                ];

                // fetch
                const formattedDate = `${date}-${month}-${year}`;
                const attendances = await getAttendancesBySubject(
                  subjectName.toLowerCase(),
                  formattedDate,
                );

                if (attendances) {
                  let message = `Daftar absen mata kuliah ${formatStringToTitleCase(
                    subjectName,
                  )} tanggal ${formattedDate} :\n\n`;
                  for (const [index, attendance] of attendances.entries()) {
                    message += `${index + 1}. ${attendance.userName}\n`;
                  }
                  await replyMessage(event, message);
                } else {
                  await replyMessage(
                    event,
                    `Daftar absen mata kuliah ${formatStringToTitleCase(
                      subjectName,
                    )} pada tanggal ${formattedDate} tidak ditemukan.`,
                  );
                }
              } else {
                await replyMessage(event, getSimilarCommands(matchedCommand));
              }
            } else {
              await replyMessage(event, getSimilarCommands(matchedCommand));
            }
          }
        } else {
          await replyMessage(event, getSimilarCommands(matchedCommand));
        }
      }
    }
  }

  return statusCode;
};

// reply message
const replyMessage = async (event, message) => {
  try {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: message,
    });
  } catch (error) {
    console.error(error.originalError.response.data.message);
    statusCode = error.statusCode;
    return statusCode;
  }
};

module.exports = {
  config,
  handleRequest,
};
