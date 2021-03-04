// list of commands
const commands = {
  '/catat': [
    {
      format: 'absen matkul <nama matkul>',
      action: 'memulai pencatatan absen suatu matkul pada hari ini',
    },
  ],
  '/hadir': [
    {
      format: 'nama: <nama kamu>, matkul: <nama matkul>',
      action: 'melakukan absen pada suatu matkul di hari ini',
    },
  ],
  '/lihat': [
    {
      format: 'daftar absen hari ini',
      action: 'menampilkan daftar absen pada hari ini',
    },
    {
      format: 'daftar absen kemarin',
      action: 'menampilkan daftar absen pada hari kemarin',
    },
    {
      format: 'daftar absen tanggal <tgl-bln-thn, contoh: 31-08-2020>',
      action: 'menampilkan daftar absen pada tanggal spesifik',
    },
    {
      format: 'daftar absen matkul <nama matkul> hari ini',
      action: 'menampilkan daftar absen suatu matkul pada hari ini',
    },
    {
      format: 'daftar absen matkul <nama matkul> kemarin',
      action: 'menampilkan daftar absen suatu matkul pada hari kemarin',
    },
    {
      format:
        'daftar absen matkul <nama matkul> tanggal <tgl-bln-thn, contoh: 31-08-2020>',
      action: 'menampilkan daftar absen suatu matkul pada tanggal spesifik',
    },
  ],
  '/bantuan': [
    {
      format: '',
      action: 'menampilkan daftar perintah',
    },
  ],
  '/keluar': [
    {
      format: '',
      action: 'mengeluarkan bot dari grup atau multichat',
    },
  ],
};

// show list of all commands
const showAvailableCommands = () => {
  let [message, listNumber] = ['', 1];
  for (const [command, subCommands] of Object.entries(commands)) {
    for (const subCommand of subCommands) {
      if (listNumber > 1) message += `\n`;
      message += `${listNumber}. ${command} ${subCommand.format}`;
      message += `\n(${subCommand.action})\n`;
      listNumber++;
    }
  }
  return message;
};

// get similar commands based on its command
const getSimilarCommands = (command) => {
  let similarCommands =
    'Maaf, sepertinya kamu memberikan perintah dengan format yang tidak dikenal.\n\nMungkin perintah yang kamu maksud adalah :\n\n';
  if (commands[command].length === 1) {
    similarCommands += `${command} ${commands[command][0].format}`;
  } else if (commands[command].length > 1) {
    for (const [index, subCommand] of commands[command].entries()) {
      similarCommands += `${index > 0 ? '\n' : ''} ${index + 1}. ${command} ${
        subCommand.format
      }`;
    }
  }
  return similarCommands;
};

module.exports = {
  commands,
  showAvailableCommands,
  getSimilarCommands,
};
