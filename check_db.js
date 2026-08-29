const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const models = {
    Classe: mongoose.models.ai_Ecole_St_Martin || mongoose.model('ai_Ecole_St_Martin', new mongoose.Schema({ schoolKey: String, annee: String, history: Array })),
    Schedule: mongoose.models.Schedule || mongoose.model('Schedule', new mongoose.Schema({ schoolKey: String })),
    AttendanceRecord: mongoose.models.ai_AttendanceRecords_Ecole_St_Martin || mongoose.model('ai_AttendanceRecords_Ecole_St_Martin', new mongoose.Schema({ schoolKey: String }))
  };

  const classesCount = await models.Classe.countDocuments({ schoolKey: 'demo_master' });
  const schedulesCount = await models.Schedule.countDocuments({ schoolKey: 'demo_master' });
  const attendanceCount = await models.AttendanceRecord.countDocuments({ schoolKey: 'demo_master' });

  console.log(`Classes: ${classesCount}`);
  console.log(`Schedules: ${schedulesCount}`);
  console.log(`AttendanceRecords: ${attendanceCount}`);
  
  process.exit(0);
}
check();
