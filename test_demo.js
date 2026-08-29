const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected");
    
    const models = [
      'Institution', 'SchoolSettings', 'Classe', 'Eleve', 'Teacher', 
      'Post', 'Group', 'GroupMessage', 'Schedule', 'User', 
      'ReportCard', 'AttendanceRecord', 'AttendanceEntry', 'PointTransaction'
    ];

    for (const model of models) {
      require('./app/api/_/models/ai/' + model);
      console.log(`Loaded ${model}`);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
